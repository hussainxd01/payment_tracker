import * as XLSX from 'xlsx'

export interface ExcelVoucher {
  voucherNumber: string
  partyName: string
  totalAmount: number
}

export const parseExcelFile = (file: File): Promise<ExcelVoucher[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        if (!rows || rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        // Get the first row to find column names
        const firstRow = rows[0]
        const keys = Object.keys(firstRow)
        
        console.log('[v0] Excel keys found:', keys)

        // Find column indices by matching keys flexibly
        let voucherKey = ''
        let partyKey = ''
        let amountKey = ''

        for (const key of keys) {
          const lowerKey = key.toLowerCase().trim()
          
          if (!voucherKey && (lowerKey.includes('voucher') || lowerKey.includes('no') || lowerKey.includes('number'))) {
            voucherKey = key
          }
          
          if (!partyKey && (lowerKey.includes('party') || lowerKey.includes('name') || lowerKey.includes('vendor'))) {
            partyKey = key
          }
          
          if (!amountKey && (lowerKey.includes('amount') || lowerKey.includes('total') || lowerKey.includes('value'))) {
            amountKey = key
          }
        }

        console.log('[v0] Matched keys - Voucher:', voucherKey, 'Party:', partyKey, 'Amount:', amountKey)

        const vouchers: ExcelVoucher[] = rows
          .map((row, index) => {
            const voucherNumber = String(row[voucherKey] || '').trim()
            const partyName = String(row[partyKey] || '').trim()
            const totalAmount = parseFloat(String(row[amountKey] || '0').replace(/,/g, '')) || 0

            console.log(`[v0] Row ${index}: Voucher="${voucherNumber}", Party="${partyName}", Amount=${totalAmount}`)

            return {
              voucherNumber,
              partyName,
              totalAmount,
            }
          })
          .filter((v) => v.voucherNumber && v.partyName && v.totalAmount > 0)

        console.log('[v0] Total valid vouchers found:', vouchers.length)

        if (vouchers.length === 0) {
          reject(new Error('No valid vouchers found in the Excel file. Please ensure your file has columns for Voucher Number, Party Name, and Amount.'))
        } else {
          resolve(vouchers)
        }
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const exportSummaryToExcel = (data: {
  totalCash: number
  totalByBank: { [key: string]: number }
  totalAmount: number
  totalOutstanding: number
  outstandingVouchers: any[]
  timestamp: string
}) => {
  const summaryData = [
    { label: 'Summary Report', value: '' },
    { label: 'Generated on', value: data.timestamp },
    { label: '', value: '' },
    { label: 'Total Amount', value: data.totalAmount },
    { label: 'Cash Received', value: data.totalCash },
  ]

  Object.entries(data.totalByBank).forEach(([bank, amount]) => {
    summaryData.push({ label: `Received in ${bank}`, value: amount })
  })

  summaryData.push({ label: '', value: '' })
  summaryData.push({ label: 'Total Outstanding', value: data.totalOutstanding })

  if (data.outstandingVouchers.length > 0) {
    summaryData.push({ label: '', value: '' })
    summaryData.push({ label: 'Outstanding Vouchers', value: '' })

    data.outstandingVouchers.forEach((voucher) => {
      summaryData.push({
        label: `${voucher.voucherNumber} - ${voucher.partyName}`,
        value: voucher.totalAmount,
      })
    })
  }

  const ws = XLSX.utils.json_to_sheet(summaryData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Summary')

  XLSX.writeFile(wb, `payment-summary-${Date.now()}.xlsx`)
}
