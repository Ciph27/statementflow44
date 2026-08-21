import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabase } from './supabase'

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Parse statement server function
export const parseStatement = createServerFn({ method: 'POST' })
  .validator(z.object({
    fileId: z.string(),
    bankName: z.string(),
    period: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('statements')
      .download(data.fileId)
    
    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }
    
    // Validate PDF magic bytes
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Check for %PDF- magic bytes
    const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D] // %PDF-
    for (let i = 0; i < pdfMagic.length; i++) {
      if (uint8Array[i] !== pdfMagic[i]) {
        throw new Error('Invalid PDF file')
      }
    }
    
    // Validate file size (15 MB cap)
    const maxSize = 15 * 1024 * 1024 // 15 MB
    if (uint8Array.length > maxSize) {
      throw new Error('File size exceeds 15 MB limit')
    }
    
    // Convert to base64 for AI processing
    const base64 = btoa(String.fromCharCode(...uint8Array))
    
    // Call AI for extraction
    const aiGatewayUrl = process.env.VITE_AI_GATEWAY_URL
    const aiApiKey = process.env.VITE_AI_API_KEY
    
    if (!aiGatewayUrl || !aiApiKey) {
      throw new Error('AI gateway configuration missing')
    }
    
    const response = await fetch(`${aiGatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all transactions from this bank statement PDF. Return a JSON array with the following structure:
[
  {
    "date": "YYYY-MM-DD",
    "description": "full transaction description",
    "merchant": "full transaction description (same as description)",
    "reference": "transaction reference if available",
    "debit": amount as number (0 if credit),
    "credit": amount as number (0 if debit),
    "balance": running balance as number if available
  }
]

Important: 
- merchant must equal the full description text (do not abbreviate)
- date format must be YYYY-MM-DD
- debit and credit should be numbers, not strings
- include all transactions from the statement`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`AI extraction failed: ${response.statusText}`)
    }
    
    const aiResult = await response.json()
    const transactions = JSON.parse(aiResult.choices[0].message.content)
    
    // Create bank statement record
    const { data: statement, error: statementError } = await supabase
      .from('bank_statements')
      .insert({
        user_id: user.id,
        file_path: data.fileId,
        bank_name: data.bankName,
        period: data.period,
        status: 'processing',
        transaction_count: transactions.length,
      })
      .select()
      .single()
    
    if (statementError) {
      throw new Error(`Failed to create statement record: ${statementError.message}`)
    }
    
    // Insert transactions
    const transactionsToInsert = transactions.map((t: any) => ({
      statement_id: statement.id,
      date: t.date,
      description: t.description,
      merchant: t.merchant,
      reference: t.reference || null,
      debit: t.debit || 0,
      credit: t.credit || 0,
      balance: t.balance || null,
      side: t.debit > 0 ? 'debit' : 'credit',
      category: null,
      confidence: 0.5,
    }))
    
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
    
    if (insertError) {
      // Update statement status to failed
      await supabase
        .from('bank_statements')
        .update({ status: 'failed' })
        .eq('id', statement.id)
      
      throw new Error(`Failed to insert transactions: ${insertError.message}`)
    }
    
    // Auto-categorize transactions
    await autoCategorizeTransactions(statement.id, user.id)
    
    // Update statement status to completed
    await supabase
      .from('bank_statements')
      .update({ status: 'completed' })
      .eq('id', statement.id)
    
    return { 
      success: true, 
      statementId: statement.id,
      transactionCount: transactions.length 
    }
  })

// Auto-categorize transactions using merchant mappings, rules, and AI fallback
async function autoCategorizeTransactions(statementId: string, userId: string) {
  // Get all transactions for the statement
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('statement_id', statementId)
  
  if (transactionsError || !transactions) {
    return
  }
  
  // Get merchant mappings
  const { data: mappings } = await supabase
    .from('merchant_mappings')
    .select('merchant, category_id')
    .eq('user_id', userId)
  
  // Get rules
  const { data: rules } = await supabase
    .from('rules')
    .select('keyword, is_regex, category_id, priority')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
  
  for (const transaction of transactions) {
    let categoryId = null
    let confidence = 0.5
    
    // Try merchant mapping first
    const mapping = mappings?.find(m => m.merchant === transaction.merchant)
    if (mapping) {
      categoryId = mapping.category_id
      confidence = 0.95
    } else {
      // Try keyword rules
      for (const rule of rules || []) {
        let match = false
        if (rule.is_regex) {
          try {
            const regex = new RegExp(rule.keyword, 'i')
            match = regex.test(transaction.description)
          } catch (e) {
            // Invalid regex, skip
          }
        } else {
          match = transaction.description.toLowerCase().includes(rule.keyword.toLowerCase())
        }
        
        if (match) {
          categoryId = rule.category_id
          confidence = 0.85
          break
        }
      }
      
      // AI fallback if no match
      if (!categoryId) {
        categoryId = await aiCategorizeTransaction(transaction.description, transaction.side)
        confidence = 0.7
      }
    }
    
    // Update transaction with category
    if (categoryId) {
      await supabase
        .from('transactions')
        .update({ category: categoryId, confidence })
        .eq('id', transaction.id)
    }
  }
}

// AI categorization fallback
async function aiCategorizeTransaction(description: string, side: string): Promise<string | null> {
  const aiGatewayUrl = process.env.VITE_AI_GATEWAY_URL
  const aiApiKey = process.env.VITE_AI_API_KEY
  
  if (!aiGatewayUrl || !aiApiKey) {
    return null
  }
  
  try {
    const response = await fetch(`${aiGatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `Categorize this transaction: "${description}". It is a ${side} transaction. 
            Return the most appropriate category name as a simple string. Common categories include:
            For debit: Compensation Employees, Communication, Educational Materials, Utilities, Computerisation, Hospitality, Fertilizers, Transport, Rent, Insurance, Office Supplies, Professional Fees, Maintenance Repairs, Marketing Advertising, Bank Charges, Other Expenses.
            For credit: Sale of Services, Grants & Donations, Other Income, Interest Income, Sales Revenue, Consulting Fees, Rental Income, Dividend Income.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    })
    
    if (!response.ok) {
      return null
    }
    
    const aiResult = await response.json()
    const category = JSON.parse(aiResult.choices[0].message.content)
    return category.category || null
  } catch (e) {
    return null
  }
}

// Analyze template server function
export const analyzeTemplate = createServerFn({ method: 'POST' })
  .validator(z.object({
    fileId: z.string(),
    name: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Download the XLSX from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('templates')
      .download(data.fileId)
    
    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }
    
    // Validate XLSX magic bytes (PK zip header)
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Check for PK zip header
    const zipMagic = [0x50, 0x4B, 0x03, 0x04] // PK\x03\x04
    for (let i = 0; i < zipMagic.length; i++) {
      if (uint8Array[i] !== zipMagic[i]) {
        throw new Error('Invalid Excel file')
      }
    }
    
    // Validate file size (10 MB cap)
    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (uint8Array.length > maxSize) {
      throw new Error('File size exceeds 10 MB limit')
    }
    
    // Use SheetJS to read the file
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Snapshot first ~30 rows × ~45 columns
    const snapshot: any[][] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const rowsToSnapshot = Math.min(30, range.e.r + 1)
    const colsToSnapshot = Math.min(45, range.e.c + 1)
    
    for (let row = 0; row < rowsToSnapshot; row++) {
      const rowData: any[] = []
      for (let col = 0; col < colsToSnapshot; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]
        rowData.push(cell ? cell.v : '')
      }
      snapshot.push(rowData)
    }
    
    // Call AI to analyze the template structure
    const aiGatewayUrl = process.env.VITE_AI_GATEWAY_URL
    const aiApiKey = process.env.VITE_AI_API_KEY
    
    if (!aiGatewayUrl || !aiApiKey) {
      throw new Error('AI gateway configuration missing')
    }
    
    const response = await fetch(`${aiGatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `Analyze this Excel cashbook template and return a JSON mapping. The template can be one of three layouts:

(A) Single ledger: one debit column + one credit column + a text category column
(B) Single columnar block: one column per category
(C) Two-sided cashbook: Receipts block on the left and Payments block on the right, each with its own date/details/reference columns, its own per-category columns, its own optional running AMOUNT total column, and its own dataStartRow

Here is the template data (first ${rowsToSnapshot} rows × ${colsToSnapshot} columns):
${JSON.stringify(snapshot)}

Return JSON with this structure:
{
  "layoutType": "A" | "B" | "C",
  "dataStartRow": number,
  "columns": {
    "date": string | null,
    "description": string | null,
    "merchant": string | null,
    "reference": string | null,
    "debit": string | null,
    "credit": string | null,
    "total": string | null,
    "categories": {
      "categoryName": "columnLetter"
    }
  },
  "twoSided": {
    "receipts": {
      "dataStartRow": number,
      "columns": { same structure as above }
    },
    "payments": {
      "dataStartRow": number,
      "columns": { same structure as above }
    }
  } | null,
  "discoveredCategories": ["category1", "category2", ...]
}

Handle headers that wrap across two rows by concatenating them (e.g. "Sale of" + "Services" → "Sale of Services").`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`)
    }
    
    const aiResult = await response.json()
    const fieldMapping = JSON.parse(aiResult.choices[0].message.content)
    
    // Create template record
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: data.name,
        storage_path: data.fileId,
        field_mapping: fieldMapping,
      })
      .select()
      .single()
    
    if (templateError) {
      throw new Error(`Failed to create template record: ${templateError.message}`)
    }
    
    // Upsert discovered categories
    if (fieldMapping.discoveredCategories && Array.isArray(fieldMapping.discoveredCategories)) {
      for (const categoryName of fieldMapping.discoveredCategories) {
        // Determine side based on context (simplified logic)
        const side = 'both' // Default to both, could be smarter
        
        await supabase
          .from('categories')
          .upsert({
            user_id: user.id,
            name: categoryName,
            description: `Auto-discovered from template`,
            side: side,
          }, {
            onConflict: 'user_id,name'
          })
      }
    }
    
    return { 
      success: true, 
      templateId: template.id,
      fieldMapping 
    }
  })

// Export cashbook server function
export const exportCashbook = createServerFn({ method: 'POST' })
  .validator(z.object({
    templateId: z.string(),
    transactionIds: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', data.templateId)
      .eq('user_id', user.id)
      .single()
    
    if (templateError || !template) {
      throw new Error('Template not found')
    }
    
    // Get transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .in('id', data.transactionIds)
    
    if (transactionsError || !transactions) {
      throw new Error('Failed to fetch transactions')
    }
    
    // Download template workbook
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('templates')
      .download(template.storage_path)
    
    if (downloadError) {
      throw new Error(`Failed to download template: ${downloadError.message}`)
    }
    
    const arrayBuffer = await fileData.arrayBuffer()
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const mapping = template.field_mapping as any
    
    // Append transactions based on layout type
    if (mapping.layoutType === 'C') {
      // Two-sided cashbook
      await appendTwoSided(worksheet, transactions, mapping, XLSX)
    } else {
      // Single ledger or columnar
      await appendSingleLayout(worksheet, transactions, mapping, XLSX)
    }
    
    // Generate export filename
    const exportFileName = `export_${Date.now()}.xlsx`
    
    // Upload to exports bucket
    const exportBuffer = XLSX.write(workbook, { type: 'array' })
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(`${user.id}/${exportFileName}`, exportBuffer)
    
    if (uploadError) {
      throw new Error(`Failed to upload export: ${uploadError.message}`)
    }
    
    // Create export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: user.id,
        template_id: data.templateId,
        storage_path: uploadData.path,
        status: 'completed',
        row_count: transactions.length,
      })
      .select()
      .single()
    
    if (exportError) {
      throw new Error(`Failed to create export record: ${exportError.message}`)
    }
    
    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(uploadData.path, 3600) // 1 hour expiry
    
    if (signedUrlError) {
      throw new Error(`Failed to generate signed URL: ${signedUrlError.message}`)
    }
    
    return { 
      success: true, 
      exportId: exportRecord.id,
      downloadUrl: signedUrlData.signedUrl 
    }
  })

// Preview export server function
export const previewExport = createServerFn({ method: 'POST' })
  .validator(z.object({
    templateId: z.string(),
    transactionIds: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', data.templateId)
      .eq('user_id', user.id)
      .single()
    
    if (templateError || !template) {
      throw new Error('Template not found')
    }
    
    // Get transactions (limit to first 100 for preview)
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .in('id', data.transactionIds.slice(0, 100))
    
    if (transactionsError || !transactions) {
      throw new Error('Failed to fetch transactions')
    }
    
    // Get template mapping
    const mapping = template.field_mapping as any
    
    // Map transactions to preview format
    const previewData = transactions.map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      merchant: t.merchant,
      reference: t.reference,
      debit: t.debit,
      credit: t.credit,
      balance: t.balance,
      category: t.category,
      side: t.side,
    }))
    
    // Calculate totals
    const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0)
    const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0)
    const closingBalance = transactions[transactions.length - 1]?.balance || 0
    
    return { 
      success: true, 
      preview: previewData,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        balance: closingBalance,
      },
      mapping 
    }
  })

// Update transaction category
export const updateTransactionCategory = createServerFn({ method: 'POST' })
  .validator(z.object({
    transactionId: z.string(),
    categoryId: z.string().nullable(),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Verify transaction belongs to user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*, bank_statements(user_id)')
      .eq('id', data.transactionId)
      .single()
    
    if (transactionError || !transaction) {
      throw new Error('Transaction not found')
    }
    
    if (transaction.bank_statements?.user_id !== user.id) {
      throw new Error('Unauthorized')
    }
    
    // Update category
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        category: data.categoryId,
        confidence: 1.0, // Manual update has high confidence
      })
      .eq('id', data.transactionId)
    
    if (updateError) {
      throw new Error(`Failed to update transaction: ${updateError.message}`)
    }
    
    return { success: true }
  })

// Update transaction description
export const updateTransactionDescription = createServerFn({ method: 'POST' })
  .validator(z.object({
    transactionId: z.string(),
    description: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Verify transaction belongs to user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*, bank_statements(user_id)')
      .eq('id', data.transactionId)
      .single()
    
    if (transactionError || !transaction) {
      throw new Error('Transaction not found')
    }
    
    if (transaction.bank_statements?.user_id !== user.id) {
      throw new Error('Unauthorized')
    }
    
    // Update description (and merchant to match)
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        description: data.description,
        merchant: data.description, // Keep merchant in sync
      })
      .eq('id', data.transactionId)
    
    if (updateError) {
      throw new Error(`Failed to update transaction: ${updateError.message}`)
    }
    
    return { success: true }
  })

// Save matching rule
export const saveMatchingRule = createServerFn({ method: 'POST' })
  .validator(z.object({
    transactionId: z.string(),
    categoryId: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser()
    
    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*, bank_statements(user_id)')
      .eq('id', data.transactionId)
      .single()
    
    if (transactionError || !transaction) {
      throw new Error('Transaction not found')
    }
    
    if (transaction.bank_statements?.user_id !== user.id) {
      throw new Error('Unauthorized')
    }
    
    // Create merchant mapping
    await supabase
      .from('merchant_mappings')
      .upsert({
        user_id: user.id,
        merchant: transaction.merchant,
        category_id: data.categoryId,
      }, {
        onConflict: 'user_id,merchant'
      })
    
    // Create keyword rule (use first word as keyword)
    const firstWord = transaction.description.split(' ')[0]
    if (firstWord) {
      await supabase
        .from('rules')
        .insert({
          user_id: user.id,
          keyword: firstWord,
          is_regex: false,
          category_id: data.categoryId,
          priority: 1,
        })
    }
    
    return { success: true }
  })

// Apply all rules
export const applyAllRules = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await getAuthenticatedUser()
    
    // Get all user's transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, bank_statements(user_id)')
      .eq('bank_statements.user_id', user.id)
    
    if (transactionsError || !transactions) {
      throw new Error('Failed to fetch transactions')
    }
    
    // Get merchant mappings
    const { data: mappings } = await supabase
      .from('merchant_mappings')
      .select('merchant, category_id')
      .eq('user_id', user.id)
    
    // Get rules
    const { data: rules } = await supabase
      .from('rules')
      .select('keyword, is_regex, category_id, priority')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
    
    let updatedCount = 0
    
    for (const transaction of transactions) {
      let categoryId = null
      let confidence = 0.5
      
      // Try merchant mapping first
      const mapping = mappings?.find(m => m.merchant === transaction.merchant)
      if (mapping) {
        categoryId = mapping.category_id
        confidence = 0.95
      } else {
        // Try keyword rules
        for (const rule of rules || []) {
          let match = false
          if (rule.is_regex) {
            try {
              const regex = new RegExp(rule.keyword, 'i')
              match = regex.test(transaction.description)
            } catch (e) {
              // Invalid regex, skip
            }
          } else {
            match = transaction.description.toLowerCase().includes(rule.keyword.toLowerCase())
          }
          
          if (match) {
            categoryId = rule.category_id
            confidence = 0.85
            break
          }
        }
      }
      
      // Update if category found and different from current
      if (categoryId && categoryId !== transaction.category) {
        await supabase
          .from('transactions')
          .update({ category: categoryId, confidence })
          .eq('id', transaction.id)
        
        updatedCount++
      }
    }
    
    return { success: true, updatedCount }
  })

// Helper function to append transactions to single layout
async function appendSingleLayout(worksheet: any, transactions: any[], mapping: any, XLSX: any) {
  const dataStartRow = mapping.dataStartRow || 1
  const columns = mapping.columns
  
  // Find first empty row
  let currentRow = dataStartRow
  while (true) {
    const isEmpty = !columns.date || worksheet[XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.date) })]?.v
    if (isEmpty) break
    currentRow++
  }
  
  // Append transactions
  for (const transaction of transactions) {
    if (columns.date) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.date) })
      worksheet[cell] = { v: transaction.date, t: 's' }
    }
    
    if (columns.description) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.description) })
      worksheet[cell] = { v: transaction.description, t: 's' }
    }
    
    if (columns.merchant) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.merchant) })
      worksheet[cell] = { v: transaction.merchant, t: 's' }
    }
    
    if (columns.reference) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.reference) })
      worksheet[cell] = { v: transaction.reference || '', t: 's' }
    }
    
    if (columns.debit && transaction.side === 'debit') {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.debit) })
      worksheet[cell] = { v: transaction.debit, t: 'n' }
    }
    
    if (columns.credit && transaction.side === 'credit') {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.credit) })
      worksheet[cell] = { v: transaction.credit, t: 'n' }
    }
    
    if (columns.total) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.total) })
      worksheet[cell] = { v: transaction.side === 'debit' ? transaction.debit : transaction.credit, t: 'n' }
    }
    
    // Write to category column if exists
    if (transaction.category && columns.categories?.[transaction.category]) {
      const cell = XLSX.utils.encode_cell({ r: currentRow, c: XLSX.utils.decode_col(columns.categories[transaction.category]) })
      worksheet[cell] = { v: transaction.side === 'debit' ? transaction.debit : transaction.credit, t: 'n' }
    }
    
    currentRow++
  }
}

// Helper function to append transactions to two-sided layout
async function appendTwoSided(worksheet: any, transactions: any[], mapping: any, XLSX: any) {
  const receipts = mapping.twoSided?.receipts
  const payments = mapping.twoSided?.payments
  
  if (!receipts || !payments) {
    throw new Error('Invalid two-sided mapping')
  }
  
  // Separate transactions by side
  const receiptTransactions = transactions.filter(t => t.side === 'credit')
  const paymentTransactions = transactions.filter(t => t.side === 'debit')
  
  // Append receipts
  let receiptRow = receipts.dataStartRow || 1
  while (receipts.columns.date && worksheet[XLSX.utils.encode_cell({ r: receiptRow, c: XLSX.utils.decode_col(receipts.columns.date) })]?.v) {
    receiptRow++
  }
  
  for (const transaction of receiptTransactions) {
    await appendTransactionToRow(worksheet, transaction, receipts.columns, receiptRow, XLSX)
    receiptRow++
  }
  
  // Append payments
  let paymentRow = payments.dataStartRow || 1
  while (payments.columns.date && worksheet[XLSX.utils.encode_cell({ r: paymentRow, c: XLSX.utils.decode_col(payments.columns.date) })]?.v) {
    paymentRow++
  }
  
  for (const transaction of paymentTransactions) {
    await appendTransactionToRow(worksheet, transaction, payments.columns, paymentRow, XLSX)
    paymentRow++
  }
}

async function appendTransactionToRow(worksheet: any, transaction: any, columns: any, row: number, XLSX: any) {
  if (columns.date) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.date) })
    worksheet[cell] = { v: transaction.date, t: 's' }
  }
  
  if (columns.description) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.description) })
    worksheet[cell] = { v: transaction.description, t: 's' }
  }
  
  if (columns.merchant) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.merchant) })
    worksheet[cell] = { v: transaction.merchant, t: 's' }
  }
  
  if (columns.reference) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.reference) })
    worksheet[cell] = { v: transaction.reference || '', t: 's' }
  }
  
  if (columns.total) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.total) })
    worksheet[cell] = { v: transaction.side === 'debit' ? transaction.debit : transaction.credit, t: 'n' }
  }
  
  // Write to category column if exists
  if (transaction.category && columns.categories?.[transaction.category]) {
    const cell = XLSX.utils.encode_cell({ r: row, c: XLSX.utils.decode_col(columns.categories[transaction.category]) })
    worksheet[cell] = { v: transaction.side === 'debit' ? transaction.debit : transaction.credit, t: 'n' }
  }
}