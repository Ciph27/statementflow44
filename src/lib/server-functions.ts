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

// Parse statement function
export async function parseStatement(data: { fileId: string; bankName: string; period: string }) {
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
    
  // TODO: Extract transactions using AI
  // For now, return mock data
  return {
    success: true,
    transactions: [],
  }
}

// Analyze template function
export async function analyzeTemplate(data: { fileId: string; name: string }) {
  const user = await getAuthenticatedUser()
  
  // Download the Excel file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('templates')
    .download(data.fileId)
  
  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`)
  }
  
  // TODO: Analyze template using AI
  // For now, return mock data
  return {
    success: true,
    fieldMapping: {
      layoutType: 'A',
      discoveredCategories: ['Category 1', 'Category 2'],
    },
  }
}

// Export cashbook function
export async function exportCashbook(data: { templateId: string; transactionIds: string[] }) {
  const user = await getAuthenticatedUser()
  
  // TODO: Generate Excel export
  // For now, return mock data
  return {
    success: true,
    downloadUrl: 'https://example.com/export.xlsx',
  }
}

// Preview export function
export async function previewExport(data: { templateId: string; transactionIds: string[] }) {
  const user = await getAuthenticatedUser()
  
  // TODO: Generate preview
  // For now, return mock data
  return {
    success: true,
    preview: [],
    totals: {
      debit: 0,
      credit: 0,
      balance: 0,
    },
  }
}

// Update transaction category function
export async function updateTransactionCategory(data: { transactionId: string; categoryId: string }) {
  const user = await getAuthenticatedUser()
  
  const { error } = await supabase
    .from('transactions')
    .update({ category_id: data.categoryId })
    .eq('id', data.transactionId)
    .eq('bank_statements.user_id', user.id)
  
  if (error) {
    throw new Error(`Failed to update category: ${error.message}`)
  }
  
  return { success: true }
}

// Update transaction description function
export async function updateTransactionDescription(data: { transactionId: string; description: string }) {
  const user = await getAuthenticatedUser()
  
  const { error } = await supabase
    .from('transactions')
    .update({ description: data.description })
    .eq('id', data.transactionId)
    .eq('bank_statements.user_id', user.id)
  
  if (error) {
    throw new Error(`Failed to update description: ${error.message}`)
  }
  
  return { success: true }
}

// Save matching rule function
export async function saveMatchingRule(data: { merchant: string; categoryId: string; keyword: string; priority: number }) {
  const user = await getAuthenticatedUser()
  
  // Create merchant mapping
  const { error: mappingError } = await supabase
    .from('merchant_mappings')
    .insert({
      user_id: user.id,
      merchant_name: data.merchant,
      category_id: data.categoryId,
    })
  
  if (mappingError) {
    throw new Error(`Failed to create merchant mapping: ${mappingError.message}`)
  }
  
  // Create keyword rule
  const { error: ruleError } = await supabase
    .from('rules')
    .insert({
      user_id: user.id,
      keyword: data.keyword,
      category_id: data.categoryId,
      priority: data.priority,
      is_regex: false,
    })
  
  if (ruleError) {
    throw new Error(`Failed to create rule: ${ruleError.message}`)
  }
  
  return { success: true }
}

// Apply all rules function
export async function applyAllRules() {
  const user = await getAuthenticatedUser()
  
  // TODO: Apply all rules to uncategorized transactions
  // For now, return mock data
  return {
    success: true,
    appliedCount: 0,
  }
}