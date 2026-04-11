'use client'

import { useState, useEffect } from 'react'
import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { formatIndianNumber } from '@/lib/utils'

export default function OutstandingReviewStep() {
  const {
    vouchers,
    currentVoucherIndex,
    setCurrentVoucherIndex,
    setCurrentStep,
    updateCurrentVoucher,
    moveToNextVoucher,
    moveToPreviousVoucher,
    updateVoucherDeductions,
  } = useAccountingStore()

  const outstandingVouchers = vouchers.filter((v) => !v.isComplete || v.isOutstanding)

  const [localIndex, setLocalIndex] = useState(0)
  const [discounts, setDiscounts] = useState<{ [key: number]: number }>({})
  const [goodsReturns, setGoodsReturns] = useState<{ [key: number]: number }>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize discount and goods return values from vouchers
    const discountMap: { [key: number]: number } = {}
    const returnsMap: { [key: number]: number } = {}

    outstandingVouchers.forEach((voucher, idx) => {
      discountMap[idx] = voucher.discount || 0
      returnsMap[idx] = voucher.goodsReturn || 0
    })

    setDiscounts(discountMap)
    setGoodsReturns(returnsMap)
  }, [outstandingVouchers])

  if (outstandingVouchers.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md p-8 text-center bg-card border border-border">
            <p className="text-lg font-semibold text-foreground mb-2">All set!</p>
            <p className="text-sm text-muted-foreground mb-6">
              All vouchers have been completed. Ready to view the report?
            </p>
            <Button
              size="lg"
              onClick={() => setCurrentStep('summary')}
              className="w-full"
            >
              View Report
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const currentVoucher = outstandingVouchers[localIndex]
  const currentDiscount = discounts[localIndex] || 0
  const currentReturn = goodsReturns[localIndex] || 0
  const totalDeductions = currentDiscount + currentReturn
  const totalDistributed = currentVoucher.distributions.reduce((sum, d) => sum + d.amount, 0)
  // Deductions reduce the invoice amount, not added separately
  const netAmount = currentVoucher.totalAmount - totalDeductions
  const balanceAmount = Math.max(0, netAmount - totalDistributed)

  const handleUpdateDiscount = (value: number) => {
    setDiscounts({ ...discounts, [localIndex]: Math.max(0, value) })
    setError(null)
  }

  const handleUpdateReturn = (value: number) => {
    setGoodsReturns({ ...goodsReturns, [localIndex]: Math.max(0, value) })
    setError(null)
  }

  const handleMarkAndContinue = () => {
    // Update the voucher with discount and goods return values
    const voucherToUpdate = outstandingVouchers[localIndex]
    const voucherIndex = vouchers.findIndex(v => v.voucherNumber === voucherToUpdate.voucherNumber)

    if (voucherIndex !== -1) {
      updateVoucherDeductions(voucherIndex, currentDiscount, currentReturn)
    }

    if (localIndex < outstandingVouchers.length - 1) {
      setLocalIndex(localIndex + 1)
      window.scrollTo(0, 0)
    } else {
      // Save the last voucher and go to report
      setCurrentStep('report')
    }
  }

  const handleSkipToReport = () => {
    // Save the current voucher's discount and goods return before skipping
    const voucherToUpdate = outstandingVouchers[localIndex]
    const voucherIndex = vouchers.findIndex(v => v.voucherNumber === voucherToUpdate.voucherNumber)

    if (voucherIndex !== -1) {
      updateVoucherDeductions(voucherIndex, currentDiscount, currentReturn)
    }

    // Jump directly to report
    setCurrentStep('report')
  }

  const handlePrevious = () => {
    if (localIndex > 0) {
      setLocalIndex(localIndex - 1)
      window.scrollTo(0, 0)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Outstanding Vouchers Review</h1>
            <div className="text-sm text-muted-foreground">
              {localIndex + 1} of {outstandingVouchers.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((localIndex + 1) / outstandingVouchers.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Voucher Info Card */}
        <Card className="bg-card border border-border mb-8 p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Voucher Number</p>
              <p className="text-xl font-semibold text-foreground">{currentVoucher.voucherNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Party Name</p>
              <p className="text-xl font-semibold text-foreground">{currentVoucher.partyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold text-accent">₹{formatIndianNumber(currentVoucher.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid Amount</p>
              <p className="text-lg font-semibold text-foreground">₹{formatIndianNumber(totalDistributed)}</p>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-foreground mb-4">Deductions & Adjustments</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Discount
                </label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentDiscount || ''}
                    onChange={(e) => handleUpdateDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Goods Return
                </label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentReturn || ''}
                    onChange={(e) => handleUpdateReturn(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 grid grid-cols-4 gap-4 p-4 bg-secondary rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Total Deductions</p>
                <p className="text-lg font-semibold text-foreground">₹{formatIndianNumber(totalDeductions)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Amount</p>
                <p className="text-lg font-semibold text-foreground">₹{formatIndianNumber(netAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-lg font-semibold ${balanceAmount > 0 ? 'text-destructive' : 'text-primary'}`}>
                  ₹{formatIndianNumber(balanceAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`text-sm font-semibold ${balanceAmount === 0 ? 'text-primary' : 'text-accent'}`}>
                  {balanceAmount === 0 ? 'Settled' : 'Outstanding'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive font-semibold">{error}</p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border bg-card px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={localIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleSkipToReport}
              className="gap-2 border-accent text-accent hover:bg-accent/10"
            >
              <SkipForward className="w-4 h-4" /> Skip to Report
            </Button>

            <Button
              size="lg"
              onClick={handleMarkAndContinue}
              className="gap-2"
            >
              {localIndex === outstandingVouchers.length - 1 ? 'View Report' : 'Next Voucher'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Add discount or goods return adjustments, then continue
          </p>
        </div>
      </div>
    </div>
  )
}
