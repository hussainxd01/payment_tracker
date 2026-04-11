'use client'

import { useState, useEffect } from 'react'
import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatIndianNumber } from '@/lib/utils'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function OutstandingDetailsStep() {
  const { getSummary, setCurrentStep } = useAccountingStore()
  const [summary, setSummary] = useState(getSummary())

  useEffect(() => {
    setSummary(getSummary())
  }, [getSummary])

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const data = summary.outstandingVouchers.map((v) => {
      const paid = v.distributions.reduce((sum, d) => sum + d.amount, 0)
      const outstanding = v.totalAmount - paid - (v.discount || 0) - (v.goodsReturn || 0)
      return {
        'Voucher Number': v.voucherNumber,
        'Party Name': v.partyName,
        'Invoice Amount': v.totalAmount,
        'Discount': v.discount || 0,
        'Goods Return': v.goodsReturn || 0,
        'Adjusted Amount': v.totalAmount - (v.discount || 0) - (v.goodsReturn || 0),
        'Paid Amount': paid,
        'Outstanding Amount': Math.max(0, outstanding),
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding')
    XLSX.writeFile(wb, `outstanding-vouchers-${Date.now()}.xlsx`)
  }

  const handleBackToReport = () => {
    setCurrentStep('report')
  }

  if (summary.outstandingVouchers.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md p-8 text-center bg-card border border-border">
            <p className="text-lg font-semibold text-foreground mb-2">No Outstanding Vouchers</p>
            <p className="text-sm text-muted-foreground mb-6">All payments have been collected.</p>
            <Button size="lg" onClick={handleBackToReport}>
              Back to Report
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToReport}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Report
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Outstanding Vouchers Details</h1>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold">Total Outstanding</p>
              <p className="text-2xl font-bold text-destructive">₹{formatIndianNumber(summary.totalOutstanding)}</p>
            </Card>
            <Card className="bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold">Outstanding Count</p>
              <p className="text-2xl font-bold text-foreground">{summary.outstandingVouchers.length}</p>
            </Card>
            <Card className="bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold">Avg Per Voucher</p>
              <p className="text-2xl font-bold text-accent">
                ₹{formatIndianNumber(summary.totalOutstanding / summary.outstandingVouchers.length)}
              </p>
            </Card>
            <Card className="bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold">Total Deductions</p>
              <p className="text-2xl font-bold text-primary">
                ₹{formatIndianNumber(summary.totalDiscount + summary.totalGoodsReturn)}
              </p>
            </Card>
          </div>
        </div>

        {/* Outstanding Vouchers Table */}
        <Card className="bg-card border border-border p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-foreground font-semibold">Voucher #</th>
                <th className="text-left py-3 px-4 text-foreground font-semibold">Party Name</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Invoice Amt</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Discount</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Goods Return</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Adjusted</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Paid</th>
                <th className="text-right py-3 px-4 text-foreground font-semibold">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {summary.outstandingVouchers.map((voucher, idx) => {
                const paid = voucher.distributions.reduce((sum, d) => sum + d.amount, 0)
                const discount = voucher.discount || 0
                const goodsReturn = voucher.goodsReturn || 0
                const adjusted = voucher.totalAmount - discount - goodsReturn
                const outstanding = Math.max(0, adjusted - paid)

                return (
                  <tr key={idx} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="py-3 px-4 text-foreground font-medium">{voucher.voucherNumber}</td>
                    <td className="py-3 px-4 text-foreground">{voucher.partyName}</td>
                    <td className="py-3 px-4 text-right">₹{formatIndianNumber(voucher.totalAmount)}</td>
                    <td className="py-3 px-4 text-right text-primary">{discount > 0 ? `₹${formatIndianNumber(discount)}` : '-'}</td>
                    <td className="py-3 px-4 text-right text-primary">{goodsReturn > 0 ? `₹${formatIndianNumber(goodsReturn)}` : '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold">₹{formatIndianNumber(adjusted)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-accent">₹{formatIndianNumber(paid)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${outstanding > 0 ? 'text-destructive' : 'text-primary'}`}>
                      ₹{formatIndianNumber(outstanding)}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-secondary/30 border-b border-border font-semibold">
                <td colSpan={2} className="py-3 px-4 text-foreground">TOTAL</td>
                <td className="py-3 px-4 text-right">₹{formatIndianNumber(summary.outstandingVouchers.reduce((sum, v) => sum + v.totalAmount, 0))}</td>
                <td className="py-3 px-4 text-right text-primary">₹{formatIndianNumber(summary.totalDiscount)}</td>
                <td className="py-3 px-4 text-right text-primary">₹{formatIndianNumber(summary.totalGoodsReturn)}</td>
                <td className="py-3 px-4 text-right">₹{formatIndianNumber(summary.outstandingVouchers.reduce((sum, v) => sum + (v.totalAmount - (v.discount || 0) - (v.goodsReturn || 0)), 0))}</td>
                <td className="py-3 px-4 text-right text-accent">₹{formatIndianNumber(summary.outstandingVouchers.reduce((sum, v) => sum + v.distributions.reduce((s, d) => s + d.amount, 0), 0))}</td>
                <td className="py-3 px-4 text-right text-destructive">₹{formatIndianNumber(summary.totalOutstanding)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Deductions Summary */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Card className="bg-card border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Discount Summary</h3>
            <div className="space-y-2 text-sm">
              {summary.outstandingVouchers.filter(v => v.discount && v.discount > 0).length > 0 ? (
                <>
                  {summary.outstandingVouchers
                    .filter(v => v.discount && v.discount > 0)
                    .map((v) => (
                      <div key={v.voucherNumber} className="flex justify-between">
                        <span className="text-muted-foreground">{v.voucherNumber}</span>
                        <span className="font-semibold">₹{formatIndianNumber(v.discount || 0)}</span>
                      </div>
                    ))}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{formatIndianNumber(summary.totalDiscount)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">No discounts applied</p>
              )}
            </div>
          </Card>

          <Card className="bg-card border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Goods Return Summary</h3>
            <div className="space-y-2 text-sm">
              {summary.outstandingVouchers.filter(v => v.goodsReturn && v.goodsReturn > 0).length > 0 ? (
                <>
                  {summary.outstandingVouchers
                    .filter(v => v.goodsReturn && v.goodsReturn > 0)
                    .map((v) => (
                      <div key={v.voucherNumber} className="flex justify-between">
                        <span className="text-muted-foreground">{v.voucherNumber}</span>
                        <span className="font-semibold">₹{formatIndianNumber(v.goodsReturn || 0)}</span>
                      </div>
                    ))}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{formatIndianNumber(summary.totalGoodsReturn)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">No goods returns applied</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border bg-card px-4 py-6 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center">
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
            <Download className="w-4 h-4" /> Export to Excel
          </Button>
          <Button
            size="lg"
            onClick={handleBackToReport}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Report
          </Button>
        </div>
      </div>
    </div>
  )
}
