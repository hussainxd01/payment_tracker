'use client'

import { useState, useEffect } from 'react'
import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { exportSummaryToExcel } from '@/lib/excel-parser'
import { Download, RotateCcw, FileDown, Printer, Edit2 } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function SummaryStep() {
  const { getSummary, resetAll, vouchers, setCurrentStep, setCurrentVoucherIndex, currentStep, manualQuantity, updateManualQuantity } = useAccountingStore()
  const [summary, setSummary] = useState(getSummary())
  const [localQuantity, setLocalQuantity] = useState(manualQuantity)
  const [quantityConfirmed, setQuantityConfirmed] = useState(true)
  const [tempQuantity, setTempQuantity] = useState(manualQuantity)

  // Refresh summary when returning from edit
  useEffect(() => {
    if (currentStep === 'summary') {
      setSummary(getSummary())
      setLocalQuantity(manualQuantity)
      setTempQuantity(manualQuantity)
      setQuantityConfirmed(true)
    }
  }, [currentStep, getSummary, manualQuantity])

  const handleQuantityEdit = () => {
    setQuantityConfirmed(false)
  }

  const handleQuantityConfirm = () => {
    updateManualQuantity(tempQuantity)
    setLocalQuantity(tempQuantity)
    setQuantityConfirmed(true)
  }

  const handleExport = () => {
    exportSummaryToExcel({
      ...summary,
      timestamp: new Date().toLocaleString(),
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleStartOver = () => {
    resetAll()
    setCurrentStep('upload')
  }

  const exportOutstanding = () => {
    const data = summary.outstandingVouchers.map((v) => ({
      'Voucher Number': v.voucherNumber,
      'Party Name': v.partyName,
      'Amount': v.totalAmount,
      'Outstanding Amount': v.outstandingAmount || v.totalAmount,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding')
    XLSX.writeFile(wb, `outstanding-vouchers-${Date.now()}.xlsx`)
  }

  const handleEditVoucher = (voucherNumber: string) => {
    const index = vouchers.findIndex((v) => v.voucherNumber === voucherNumber)
    if (index !== -1) {
      setCurrentVoucherIndex(index)
      setCurrentStep('entry')
      window.scrollTo(0, 0)
    }
  }

  const refreshSummary = () => {
    setSummary(getSummary())
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payment Summary Report</h1>
          <p className="text-muted-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Total Amount */}
          <Card className="bg-card border border-border p-6">
            <p className="text-sm text-muted-foreground font-semibold mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-foreground">₹{summary.totalAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">{vouchers.length} vouchers</p>
          </Card>

          {/* Total Quantity */}
          <Card className="bg-card border border-border p-6">
            <p className="text-sm text-muted-foreground font-semibold mb-2">Total PCS</p>
            <p className="text-3xl font-bold text-accent">{summary.totalQuantity}</p>
            <p className="text-xs text-muted-foreground mt-2">Quantity (Pieces)</p>
          </Card>

          {/* Cash Received */}
          <Card className="bg-card border border-border p-6">
            <p className="text-sm text-muted-foreground font-semibold mb-2">Cash Received</p>
            <p className="text-3xl font-bold text-accent">₹{summary.totalCash.toFixed(2)}</p>
            <div className="w-full bg-border rounded-full h-1 mt-4">
              <div
                className="bg-accent h-1 rounded-full"
                style={{ width: `${(summary.totalCash / summary.totalAmount) * 100}%` }}
              />
            </div>
          </Card>

          {/* Bank Total */}
          <Card className="bg-card border border-border p-6">
            <p className="text-sm text-muted-foreground font-semibold mb-2">Bank Total</p>
            <p className="text-3xl font-bold text-primary">
              ₹{Object.values(summary.totalByBank).reduce((a, b) => a + b, 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{Object.keys(summary.totalByBank).length} bank(s)</p>
          </Card>

          {/* Outstanding */}
          <Card className="bg-card border border-border p-6">
            <p className="text-sm text-muted-foreground font-semibold mb-2">Outstanding</p>
            <p
              className={`text-3xl font-bold ${
                summary.totalOutstanding > 0 ? 'text-destructive' : 'text-primary'
              }`}
            >
              ₹{summary.totalOutstanding.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{summary.outstandingVouchers.length} voucher(s)</p>
          </Card>
        </div>

        {/* Account Details Table */}
        {Object.keys(summary.totalByAccount).length > 0 && (
          <Card className="bg-card border border-border p-6 mb-8 overflow-x-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account-wise Breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Account Holder Name</th>
                  <th className="text-right py-3 px-4 text-foreground font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.totalByAccount).map(([account, amount]) => (
                  <tr key={account} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="py-3 px-4 text-foreground">{account}</td>
                    <td className="py-3 px-4 text-right text-primary font-semibold">₹{amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-secondary/30">
                  <td className="py-3 px-4 font-semibold text-foreground">Total</td>
                  <td className="py-3 px-4 text-right font-bold text-primary">
                    ₹{Object.values(summary.totalByAccount).reduce((a, b) => a + b, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        )}

        {/* Outstanding Vouchers Table */}
        {summary.outstandingVouchers.length > 0 && (
          <Card className="bg-card border border-border p-6 mb-8 overflow-x-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">Outstanding Vouchers</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Voucher Number</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Party Name</th>
                  <th className="text-right py-3 px-4 text-foreground font-semibold">Amount</th>
                  <th className="text-center py-3 px-4 text-foreground font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {summary.outstandingVouchers.map((voucher) => (
                  <tr key={voucher.voucherNumber} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="py-3 px-4 text-foreground font-medium">{voucher.voucherNumber}</td>
                    <td className="py-3 px-4 text-foreground">{voucher.partyName}</td>
                    <td className="py-3 px-4 text-right text-destructive font-semibold">
                      ₹{(voucher.outstandingAmount || voucher.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVoucher(voucher.voucherNumber)}
                        className="gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {summary.outstandingVouchers.length === 0 && (
          <Card className="bg-primary/5 border border-primary p-8 mb-8 text-center">
            <p className="text-lg font-semibold text-primary">All payments collected!</p>
            <p className="text-sm text-muted-foreground mt-2">No outstanding vouchers remain.</p>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border bg-card px-4 py-6 print:hidden">
        <div className="max-w-6xl mx-auto space-y-4">
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
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Export Summary
            </Button>
            {summary.outstandingVouchers.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={exportOutstanding}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" /> Export Outstanding
              </Button>
            )}
            <Button
              size="lg"
              onClick={handleStartOver}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Process New File
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
