'use client'

import { useState } from 'react'
import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface ManualVoucherDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManualVoucherDialog({ isOpen, onClose }: ManualVoucherDialogProps) {
  const { vouchers, addVouchers } = useAccountingStore()

  const [voucherNumber, setVoucherNumber] = useState('')
  const [partyName, setPartyName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleAddVoucher = () => {
    setError(null)
    setSuccess(false)

    // Validation
    if (!voucherNumber.trim()) {
      setError('Voucher number is required')
      return
    }

    if (!partyName.trim()) {
      setError('Party name is required')
      return
    }

    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount))) {
      setError('Valid total amount is required')
      return
    }

    // Check if voucher number already exists
    const voucherExists = vouchers.some(
      (v) => v.voucherNumber.toLowerCase() === voucherNumber.trim().toLowerCase()
    )

    if (voucherExists) {
      setError(`Voucher number "${voucherNumber}" already exists. Please use a different number.`)
      return
    }

    // Add the new voucher
    const newVoucher = {
      voucherNumber: voucherNumber.trim(),
      partyName: partyName.trim(),
      totalAmount: parseFloat(totalAmount),
    }

    // Get current vouchers and add the new one
    const updatedVouchers = [...vouchers, newVoucher]
    addVouchers(updatedVouchers)

    setSuccess(true)
    setTimeout(() => {
      setVoucherNumber('')
      setPartyName('')
      setTotalAmount('')
      setSuccess(false)
      onClose()
    }, 1500)
  }

  const handleClose = () => {
    setVoucherNumber('')
    setPartyName('')
    setTotalAmount('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Add Voucher Manually</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-secondary rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-lg">
              <p className="text-sm text-green-600 font-semibold">✓ Voucher added successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Voucher Number
              </label>
              <Input
                placeholder="e.g., V001, INV-2024-001"
                value={voucherNumber}
                onChange={(e) => {
                  setVoucherNumber(e.target.value)
                  setError(null)
                }}
                disabled={success}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Party Name
              </label>
              <Input
                placeholder="e.g., ABC Traders, XYZ Pvt Ltd"
                value={partyName}
                onChange={(e) => {
                  setPartyName(e.target.value)
                  setError(null)
                }}
                disabled={success}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Total Amount
              </label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">₹</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(e.target.value)
                    setError(null)
                  }}
                  disabled={success}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={success}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddVoucher}
              disabled={success}
            >
              {success ? '✓ Added' : 'Add Voucher'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            You will be able to add payment distribution details next
          </p>
        </div>
      </Card>
    </div>
  )
}
