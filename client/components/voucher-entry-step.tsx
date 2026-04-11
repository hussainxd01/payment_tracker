'use client'

import { useState, useEffect } from 'react'
import { useAccountingStore, PaymentDistribution, PredefinedAccount } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatIndianNumber } from '@/lib/utils'

export default function VoucherEntryStep() {
  const {
    vouchers,
    currentVoucherIndex,
    updateCurrentVoucher,
    moveToNextVoucher,
    moveToPreviousVoucher,
    setCurrentVoucherIndex,
    markVoucherOutstanding,
    setCurrentStep,
    getAllAccounts,
    addCustomAccount,
    updateVoucherDeductions,
  } = useAccountingStore()

  const [distributions, setDistributions] = useState<PaymentDistribution[]>([])
  const [accounts, setAccounts] = useState<PredefinedAccount[]>([])
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<'cash' | 'bank'>('bank')
  const [newBankName, setNewBankName] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [goodsReturn, setGoodsReturn] = useState(0)

  useEffect(() => {
    setAccounts(getAllAccounts())
    if (vouchers[currentVoucherIndex]) {
      setDistributions(vouchers[currentVoucherIndex].distributions)
      setDiscount(vouchers[currentVoucherIndex].discount || 0)
      setGoodsReturn(vouchers[currentVoucherIndex].goodsReturn || 0)
    }
  }, [currentVoucherIndex, vouchers, getAllAccounts])

  const currentVoucher = vouchers[currentVoucherIndex]
  if (!currentVoucher) return null

  const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0)
  const totalDeductions = discount + goodsReturn
  const adjustedAmount = currentVoucher.totalAmount - totalDeductions
  const remaining = adjustedAmount - totalDistributed
  const isBalanced = Math.abs(remaining) < 0.01

  const handleAddDistribution = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return

    const newDistribution: PaymentDistribution = {
      accountId,
      accountName: account.name,
      amount: 0,
      bankName: account.bankName,
      type: account.type,
    }

    setDistributions([...distributions, newDistribution])
    setError(null)
  }

  const handleUpdateDistribution = (index: number, amount: number) => {
    const updated = [...distributions]
    updated[index].amount = amount
    setDistributions(updated)
    setError(null)
  }

  const handleRemoveDistribution = (index: number) => {
    const updated = distributions.filter((_, i) => i !== index)
    setDistributions(updated)
  }

  const handleAddCustomAccount = () => {
    if (!newAccountName.trim()) {
      setError('Account name is required')
      return
    }

    if (newAccountType === 'bank' && !newBankName.trim()) {
      setError('Bank name is required for bank accounts')
      return
    }

    addCustomAccount(newAccountName, newAccountType, newBankName || undefined)
    const newAccounts = getAllAccounts()
    setAccounts(newAccounts)

    setNewAccountName('')
    setNewBankName('')
    setNewAccountType('bank')
    setShowAddAccount(false)
    setError(null)
  }

  const handleSaveAndNext = () => {
    if (!isBalanced) {
      setError(`Amount not balanced. Remaining: ${remaining.toFixed(2)}`)
      return
    }

    updateCurrentVoucher(distributions)
    updateVoucherDeductions(currentVoucherIndex, discount, goodsReturn)

    if (currentVoucherIndex < vouchers.length - 1) {
      moveToNextVoucher()
      setDistributions([])
      setDiscount(0)
      setGoodsReturn(0)
      window.scrollTo(0, 0)
    } else {
      setCurrentStep('summary')
    }
  }

  const handlePrevious = () => {
    if (currentVoucherIndex > 0) {
      updateCurrentVoucher(distributions)
      moveToPreviousVoucher()
      window.scrollTo(0, 0)
    }
  }

  const handleSearchVoucher = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return

    const foundIndex = vouchers.findIndex(
      (v) => v.voucherNumber.toLowerCase().includes(query) || v.partyName.toLowerCase().includes(query)
    )

    if (foundIndex !== -1) {
      updateCurrentVoucher(distributions)
      setCurrentVoucherIndex(foundIndex)
      setSearchQuery('')
      setShowSearch(false)
      window.scrollTo(0, 0)
    } else {
      setError('Voucher not found')
    }
  }

  const handleMarkOutstanding = () => {
    updateCurrentVoucher(distributions)
    updateVoucherDeductions(currentVoucherIndex, discount, goodsReturn)
    markVoucherOutstanding(currentVoucherIndex, true)

    if (currentVoucherIndex < vouchers.length - 1) {
      moveToNextVoucher()
      setDistributions([])
      setDiscount(0)
      setGoodsReturn(0)
      window.scrollTo(0, 0)
    } else {
      setCurrentStep('summary')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Payment Distribution</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-3 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
              >
                🔍 Search
              </button>
              <div className="text-sm text-muted-foreground">
                Voucher {currentVoucherIndex + 1} of {vouchers.length}
              </div>
            </div>
          </div>

          {/* Search Box */}
          {showSearch && (
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Search by voucher number or party name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setError(null)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearchVoucher()
                }}
                className="flex-1"
                autoFocus
              />
              <Button variant="default" size="sm" onClick={handleSearchVoucher}>
                Find
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSearch(false)}>
                Close
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentVoucherIndex + 1) / vouchers.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Voucher Info */}
        <Card className="bg-card border border-border mb-8 p-6">
          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xl font-semibold text-accent">₹{formatIndianNumber(currentVoucher.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-xl font-semibold ${
                  isBalanced ? 'text-primary' : remaining > 0 ? 'text-destructive' : 'text-destructive'
                }`}
              >
                ₹{formatIndianNumber(Math.max(0, remaining))}
              </p>
            </div>
          </div>
        </Card>

        {/* Deductions & Adjustments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Deductions & Adjustments</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-2 block">Discount</label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-2 block">Goods Return</label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goodsReturn || ''}
                  onChange={(e) => setGoodsReturn(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          {totalDeductions > 0 && (
            <div className="p-3 bg-secondary rounded-lg mb-6">
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span className="font-semibold">₹{formatIndianNumber(currentVoucher.totalAmount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Total Deductions:</span>
                  <span className="font-semibold text-primary">-₹{formatIndianNumber(totalDeductions)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold">Adjusted Amount:</span>
                  <span className="font-bold text-foreground">₹{formatIndianNumber(adjustedAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Distributions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Distribution Details</h2>

          <div className="space-y-3 mb-4">
            {distributions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No distributions added yet</p>
            ) : (
              distributions.map((dist, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground font-semibold">{dist.accountName}</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dist.amount || ''}
                      onChange={(e) => handleUpdateDistribution(idx, parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDistribution(idx)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add Distribution Dropdown */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDistribution(e.target.value)
                    e.target.value = ''
                  }
                }}
                defaultValue=""
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="">Add payment method...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.bankName ? `(${acc.bankName})` : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAccount(!showAddAccount)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> New Account
              </Button>
            </div>

            {/* Add Custom Account Form */}
            {showAddAccount && (
              <Card className="p-4 bg-secondary border-border space-y-3">
                <Input
                  placeholder="Account Name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="bg-background"
                />
                <div className="flex gap-2">
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as 'cash' | 'bank')}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                {newAccountType === 'bank' && (
                  <Input
                    placeholder="Bank Name"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="bg-background"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleAddCustomAccount}
                    className="flex-1"
                  >
                    Add Account
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddAccount(false)
                      setNewAccountName('')
                      setNewBankName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

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
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentVoucherIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            <div className="text-sm text-muted-foreground text-center">
              {distributions.length > 0 && (
                <>
                  Total distributed: <span className="font-semibold text-foreground">₹{formatIndianNumber(totalDistributed)}</span>
                </>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleSaveAndNext}
              disabled={distributions.length === 0 || !isBalanced}
              className="gap-2"
            >
              {currentVoucherIndex === vouchers.length - 1 ? 'View Summary' : 'Next Voucher'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Outstanding Button */}
          {remaining > 0 && (
            <div className="text-center">
              <Button
                variant="outline"
                size="md"
                onClick={handleMarkOutstanding}
                className="gap-2 border-accent text-accent hover:bg-accent/10"
              >
                Mark as Outstanding & Continue
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Outstanding: ₹{formatIndianNumber(Math.max(0, remaining))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
