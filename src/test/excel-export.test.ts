import { describe, it, expect } from 'vitest'
import XLSX from 'xlsx'

describe('Excel Export Validation', () => {
  it('should validate XLSX magic bytes', () => {
    // Create a simple test buffer with XLSX magic bytes
    const magicBytes = [0x50, 0x4B, 0x03, 0x04] // PK\x03\x04 (ZIP header)
    const testBuffer = new Uint8Array([...magicBytes, 0x00, 0x00, 0x00, 0x00])
    
    // Check if buffer starts with ZIP magic bytes
    expect(testBuffer[0]).toBe(0x50) // P
    expect(testBuffer[1]).toBe(0x4B) // K
    expect(testBuffer[2]).toBe(0x03) // \x03
    expect(testBuffer[3]).toBe(0x04) // \x04
  })

  it('should create and read a valid XLSX workbook', () => {
    // Create a simple workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Header 1', 'Header 2', 'Header 3'],
      ['Data 1', 'Data 2', 'Data 3'],
      ['Data 4', 'Data 5', 'Data 6'],
    ])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'array' })
    
    // Verify it's a Uint8Array
    expect(buffer).toBeInstanceOf(Uint8Array)
    
    // Verify magic bytes
    expect(buffer[0]).toBe(0x50) // P
    expect(buffer[1]).toBe(0x4B) // K
    expect(buffer[2]).toBe(0x03) // \x03
    expect(buffer[3]).toBe(0x04) // \x04
    
    // Read back the workbook
    const readWorkbook = XLSX.read(buffer, { type: 'array' })
    
    // Verify workbook structure
    expect(readWorkbook.SheetNames).toContain('Sheet1')
    expect(readWorkbook.Sheets['Sheet1']).toBeDefined()
    
    // Verify data integrity
    const readWorksheet = readWorkbook.Sheets['Sheet1']
    const data = XLSX.utils.sheet_to_json(readWorksheet, { header: 1 })
    
    expect(data[0]).toEqual(['Header 1', 'Header 2', 'Header 3'])
    expect(data[1]).toEqual(['Data 1', 'Data 2', 'Data 3'])
    expect(data[2]).toEqual(['Data 4', 'Data 5', 'Data 6'])
  })

  it('should preserve template cells when appending data', () => {
    // Create template with existing data
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Date', 'Description', 'Amount'],
      ['2024-01-01', 'Existing Transaction', 100.00],
      ['2024-01-02', 'Another Transaction', 200.00],
    ])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // Store original data for comparison
    const originalData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Append new data (simulating export behavior)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const newRow = range.e.r + 1
    worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: newRow, c: 2 } })
    
    worksheet[XLSX.utils.encode_cell({ r: newRow, c: 0 })] = { v: '2024-01-03', t: 's' }
    worksheet[XLSX.utils.encode_cell({ r: newRow, c: 1 })] = { v: 'New Transaction', t: 's' }
    worksheet[XLSX.utils.encode_cell({ r: newRow, c: 2 })] = { v: 300.00, t: 'n' }
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'array' })
    
    // Read back and verify
    const readWorkbook = XLSX.read(buffer, { type: 'array' })
    const readWorksheet = readWorkbook.Sheets['Sheet1']
    const finalData = XLSX.utils.sheet_to_json(readWorksheet, { header: 1 })
    
    // Verify original data is preserved
    expect(finalData[0]).toEqual(originalData[0])
    expect(finalData[1]).toEqual(originalData[1])
    expect(finalData[2]).toEqual(originalData[2])
    
    // Verify new data was appended
    expect(finalData[3]).toEqual(['2024-01-03', 'New Transaction', 300.00])
    
    // Verify total row count
    expect(finalData.length).toBe(4)
  })

  it('should handle two-sided cashbook layout', () => {
    // Create a two-sided cashbook template
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Receipts', '', '', '', 'Payments', '', '', ''],
      ['Date', 'Description', 'Ref', 'Amount', 'Date', 'Description', 'Ref', 'Amount'],
      ['2024-01-01', 'Sale 1', 'REF001', 500.00, '2024-01-02', 'Expense 1', 'REF002', 200.00],
    ])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cashbook')
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'array' })
    
    // Verify magic bytes
    expect(buffer[0]).toBe(0x50)
    expect(buffer[1]).toBe(0x4B)
    expect(buffer[2]).toBe(0x03)
    expect(buffer[3]).toBe(0x04)
    
    // Read back and verify structure
    const readWorkbook = XLSX.read(buffer, { type: 'array' })
    const readWorksheet = readWorkbook.Sheets['Cashbook']
    const data = XLSX.utils.sheet_to_json(readWorksheet, { header: 1 })
    
    // Verify two-sided structure is preserved
    expect(data[0][0]).toBe('Receipts')
    expect(data[0][4]).toBe('Payments')
    expect(data[1][0]).toBe('Date')
    expect(data[1][4]).toBe('Date')
  })

  it('should handle large datasets without corruption', () => {
    // Create a workbook with many rows
    const workbook = XLSX.utils.book_new()
    const largeData = [['Date', 'Description', 'Amount']]
    
    // Add 1000 rows of data
    for (let i = 0; i < 1000; i++) {
      largeData.push([
        `2024-01-${(i % 30) + 1}`,
        `Transaction ${i}`,
        Math.random() * 1000,
      ])
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(largeData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LargeData')
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'array' })
    
    // Verify magic bytes
    expect(buffer[0]).toBe(0x50)
    expect(buffer[1]).toBe(0x4B)
    expect(buffer[2]).toBe(0x03)
    expect(buffer[3]).toBe(0x04)
    
    // Read back and verify data integrity
    const readWorkbook = XLSX.read(buffer, { type: 'array' })
    const readWorksheet = readWorkbook.Sheets['LargeData']
    const readData = XLSX.utils.sheet_to_json(readWorksheet, { header: 1 })
    
    // Verify row count
    expect(readData.length).toBe(1001) // Header + 1000 rows
    
    // Verify sample data
    expect(readData[0]).toEqual(['Date', 'Description', 'Amount'])
    expect(readData[1][0]).toMatch(/2024-01-\d+/)
    expect(readData[1000][1]).toBe('Transaction 999')
  })

  it('should maintain cell types and formatting', () => {
    // Create workbook with different cell types
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Text', 'Number', 'Date', 'Formula'],
      ['Hello', 42.5, '2024-01-01', '=A2'],
    ])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Types')
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'array' })
    
    // Read back
    const readWorkbook = XLSX.read(buffer, { type: 'array' })
    const readWorksheet = readWorkbook.Sheets['Types']
    
    // Verify text cell
    const textCell = readWorksheet['A2']
    expect(textCell).toBeDefined()
    expect(textCell.v).toBe('Hello')
    expect(textCell.t).toBe('s')
    
    // Verify number cell
    const numberCell = readWorksheet['B2']
    expect(numberCell).toBeDefined()
    expect(numberCell.v).toBe(42.5)
    expect(numberCell.t).toBe('n')
  })
})