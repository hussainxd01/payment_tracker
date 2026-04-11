'use client'

import { useState, useEffect } from 'react'
import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatIndianNumber } from '@/lib/utils'
import { Printer, Download, RotateCcw, ArrowRight, Plus } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function TallyReportStep() {
  const { getSummary, resetAll, vouchers, setCurrentStep, manualQuantity, updateManualQuantity } = useAccountingStore()
  const [summary, setSummary] = useState(getSummary())
  const [localQuantity, setLocalQuantity] = useState(manualQuantity)
  const [quantityConfirmed, setQuantityConfirmed] = useState(true)
  const [tempQuantity, setTempQuantity] = useState(manualQuantity)

  useEffect(() => {
    setSummary(getSummary())
    setLocalQuantity(manualQuantity)
    setTempQuantity(manualQuantity)
    setQuantityConfirmed(true)
  }, [getSummary, manualQuantity])

  const handleQuantityEdit = () => {
    setQuantityConfirmed(false)
  }

  const handleQuantityConfirm = () => {
    updateManualQuantity(tempQuantity)
    setLocalQuantity(tempQuantity)
    setQuantityConfirmed(true)
  }

  const totalReceivedAmount = summary.totalCash + Object.values(summary.totalByAccount).reduce((a, b) => a + b, 0)
  const totalDeductions = summary.totalDiscount + summary.totalGoodsReturn
  const netReceivable = summary.totalAmount - totalDeductions

  const handlePrint = () => {
    window.print()
  }

  const handleExportToExcel = () => {
    const reportData = []

    // Header
    reportData.push(['PAYMENT COLLECTION REPORT'])
    reportData.push([''])
    reportData.push(['Report Date', new Date().toLocaleDateString('en-IN')])
    reportData.push(['Report Time', new Date().toLocaleTimeString('en-IN')])
    reportData.push([''])

    // Summary Section
    reportData.push(['SUMMARY DETAILS'])
    reportData.push(['Total Vouchers', vouchers.length])
    reportData.push(['Total PCS (Pieces)', summary.totalQuantity])
    reportData.push(['Total Amount', summary.totalAmount])
    reportData.push(['Total Discount', summary.totalDiscount])
    reportData.push(['Total Goods Return', summary.totalGoodsReturn])
    reportData.push(['Net Receivable', netReceivable])
    reportData.push(['Total Outstanding', summary.totalOutstanding])
    reportData.push([''])

    // Cash & Bank Section
    reportData.push(['COLLECTION DETAILS'])
    reportData.push(['Payment Method', 'Amount'])
    reportData.push(['Cash', summary.totalCash])

    Object.entries(summary.totalByBank).forEach(([bank, amount]) => {
      reportData.push([bank, amount])
    })

    reportData.push(['Total Collected', totalReceivedAmount])
    reportData.push([''])

    // Outstanding Vouchers Section
    if (summary.outstandingVouchers.length > 0) {
      reportData.push(['OUTSTANDING VOUCHERS'])
      reportData.push(['Voucher Number', 'Party Name', 'Amount', 'Paid', 'Outstanding'])
      summary.outstandingVouchers.forEach((v) => {
        const paid = v.distributions.reduce((sum, d) => sum + d.amount, 0)
        const outstanding = v.totalAmount - paid - (v.discount || 0) - (v.goodsReturn || 0)
        reportData.push([v.voucherNumber, v.partyName, v.totalAmount, paid, Math.max(0, outstanding)])
      })
    }

    const ws = XLSX.utils.aoa_to_sheet(reportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `payment-report-${Date.now()}.xlsx`)
  }

  const handleStartOver = () => {
    resetAll()
    setCurrentStep('upload')
  }

  const handleContinueSession = () => {
    setCurrentStep('upload')
  }

  const handleViewOutstanding = () => {
    setCurrentStep('outstanding')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Tally-Style Report - Print-optimized */}
        <div className="bg-white text-black p-8 mb-8 font-mono text-sm leading-tight">
          {/* Header */}
          <div className="border-b border-black pb-2 mb-4">
            <div className="text-center font-bold text-lg mb-1">PAYMENT COLLECTION REPORT</div>
            <div className="text-center text-xs">
              <div>Report Date: {new Date().toLocaleDateString('en-IN')}</div>
              <div>Report Time: {new Date().toLocaleTimeString('en-IN')}</div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-6">
            <div className="font-bold border-b border-black mb-2">SUMMARY</div>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-1/2">Total Vouchers Processed</td>
                  <td className="text-right border-b border-gray-400">{vouchers.length}</td>
                </tr>
                <tr>
                  <td>Total PCS (Pieces)</td>
                  <td className="text-right border-b border-gray-400">{summary.totalQuantity}</td>
                </tr>
                <tr>
                  <td>Total Invoice Amount</td>
                  <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(summary.totalAmount)}</td>
                </tr>
                <tr>
                  <td>(-) Total Discount</td>
                  <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(summary.totalDiscount)}</td>
                </tr>
                <tr>
                  <td>(-) Total Goods Return</td>
                  <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(summary.totalGoodsReturn)}</td>
                </tr>
                <tr className="font-bold">
                  <td>Net Receivable Amount</td>
                  <td className="text-right border-b border-black">₹ {formatIndianNumber(netReceivable)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Collection Section */}
          <div className="mb-6">
            <div className="font-bold border-b border-black mb-2">PAYMENT COLLECTION</div>
            <table className="w-full text-xs">
              <tbody>
                <tr className="font-bold border-b border-black">
                  <td className="w-1/2">Account Holder / Payment Method</td>
                  <td className="text-right">Amount</td>
                </tr>
                <tr>
                  <td>Cash</td>
                  <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(summary.totalCash)}</td>
                </tr>
                {Object.entries(summary.totalByAccount).map(([account, amount]) => (
                  <tr key={account}>
                    <td>{account}</td>
                    <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(amount as number)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td>Total Collected</td>
                  <td className="text-right border-b border-black">₹ {formatIndianNumber(totalReceivedAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Section */}
          <div className="mb-6">
            <div className="font-bold border-b border-black mb-2">BALANCE SUMMARY</div>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-1/2">Net Receivable</td>
                  <td className="text-right border-b border-gray-400">₹ {formatIndianNumber(netReceivable)}</td>
                </tr>
                <tr className="font-bold">
                  <td>Outstanding Amount</td>
                  <td className="text-right border-b border-black">₹ {formatIndianNumber(summary.totalOutstanding)}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-xs mt-2">
              <div>Outstanding Vouchers Count: {summary.outstandingVouchers.length}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-black pt-2 mt-4 text-center text-xs">
            <div>Generated by Payment Tracker</div>
            <div>{new Date().toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Page Separator */}
        <div className="page-break my-8 text-center text-xs text-muted-foreground">
          —— Page 1 of 2 ——
        </div>

        {/* Outstanding Vouchers Report - Page 2 */}
        {summary.outstandingVouchers.length > 0 && (
          <div className="bg-white text-black p-8 font-mono text-sm leading-tight">
            {/* Header */}
            <div className="border-b border-black pb-2 mb-4">
              <div className="text-center font-bold text-lg mb-1">OUTSTANDING VOUCHERS REPORT</div>
              <div className="text-center text-xs">
                <div>Report Date: {new Date().toLocaleDateString('en-IN')}</div>
                <div>Total Outstanding: ₹ {formatIndianNumber(summary.totalOutstanding)}</div>
              </div>
            </div>

            {/* Details Table */}
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="font-bold border-b border-black">
                  <td className="w-2/12">Voucher #</td>
                  <td className="w-3/12">Party Name</td>
                  <td className="w-2/12 text-right">Invoice Amt</td>
                  <td className="w-2/12 text-right">Paid Amt</td>
                  <td className="w-2/12 text-right">Outstd Amt</td>
                </tr>
              </thead>
              <tbody>
                {summary.outstandingVouchers.map((v, idx) => {
                  const paid = v.distributions.reduce((sum, d) => sum + d.amount, 0)
                  const outstanding = v.totalAmount - paid - (v.discount || 0) - (v.goodsReturn || 0)
                  return (
                    <tr key={idx} className="border-b border-gray-400">
                      <td>{v.voucherNumber}</td>
                      <td>{v.partyName}</td>
                      <td className="text-right">₹ {formatIndianNumber(v.totalAmount)}</td>
                      <td className="text-right">₹ {formatIndianNumber(paid)}</td>
                      <td className="text-right">₹ {formatIndianNumber(Math.max(0, outstanding))}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold border-b border-black">
                  <td colSpan={4}>TOTAL OUTSTANDING</td>
                  <td className="text-right">₹ {formatIndianNumber(summary.totalOutstanding)}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="border-t border-black pt-2 mt-4 text-center text-xs">
              <div>Page 2 of 2</div>
              <div>{new Date().toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border bg-card px-4 py-6 print:hidden">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-foreground">Total Quantity Sold (PCS)</label>
              <span className="text-lg font-bold text-accent">{localQuantity} PCS</span>
            </div>
            {quantityConfirmed ? (
              <div className="flex items-center gap-2">
                <span className="text-base text-foreground flex-1">Quantity: <span className="font-bold text-primary">{localQuantity}</span></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuantityEdit}
                  className="gap-1"
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter total quantity"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleQuantityConfirm}
                  className="gap-1"
                >
                  OK
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {quantityConfirmed ? 'Click Edit to change the quantity' : 'Enter quantity and click OK to confirm'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" /> Print Report
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportToExcel}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Export to Excel
            </Button>
            {summary.outstandingVouchers.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleViewOutstanding}
                className="gap-2 border-accent text-accent hover:bg-accent/10"
              >
                <ArrowRight className="w-4 h-4" /> Outstanding Details
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleContinueSession}
              className="gap-2 border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" /> Continue Session
            </Button>
            <Button
              size="lg"
              onClick={handleStartOver}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Start Fresh
            </Button>
          </div>

          <style>{`
            @media print {
              .print\\:hidden { display: none; }
              .page-break { page-break-before: always; break-before: page; }
              body { margin: 0; padding: 0; }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}
