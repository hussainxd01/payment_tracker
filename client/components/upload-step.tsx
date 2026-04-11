'use client'

import { useState } from 'react'
import { useAccountingStore } from '@/lib/store'
import { parseExcelFile } from '@/lib/excel-parser'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import ManualVoucherDialog from '@/components/manual-voucher-dialog'

export default function UploadStep() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const { addVouchers, sessionActive, vouchers, setCurrentStep } = useAccountingStore()

  const handleFile = async (file: File) => {
    setError(null)
    setIsLoading(true)

    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        throw new Error('Please upload an Excel file (.xlsx, .xls) or CSV file')
      }

      const vouchers = await parseExcelFile(file)
      addVouchers(vouchers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while parsing the file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background pt-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        {sessionActive && vouchers.length > 0 && (
          <div className="mb-8 p-4 bg-primary/10 border border-primary rounded-lg flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-primary">Session Active</p>
              <p className="text-sm text-primary/80">
                You have {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} in your current session. Upload more files to add to this session.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('entry')}
              className="text-primary hover:bg-primary/20"
            >
              Continue Processing
            </Button>
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Payment Tracker</h1>
          <p className="text-lg text-muted-foreground">
            {sessionActive && vouchers.length > 0 ? 'Add more vouchers to your session' : 'Upload your voucher data to get started'}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-12">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-muted-foreground"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-8v16m0 0l-4-4m4 4l4-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">Drop your Excel file here</p>
            <p className="text-sm text-muted-foreground mb-6">or click to browse</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              disabled={isLoading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button
                variant="default"
                size="lg"
                disabled={isLoading}
                onClick={() => document.getElementById('file-input')?.click()}
                className="cursor-pointer"
              >
                {isLoading ? 'Processing...' : 'Select File'}
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">Expected columns: Voucher Number, Party Name, Amount</p>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-secondary-foreground">
                <span className="font-semibold">File Format:</span> Your Excel file should contain columns named: Voucher Number, Party Name, and Amount. Headers are case-insensitive.
              </p>
            </div>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Or add vouchers manually</p>
              <Button
                variant="outline"
                onClick={() => setShowManualDialog(true)}
              >
                + Add Voucher Manually
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ManualVoucherDialog
        isOpen={showManualDialog}
        onClose={() => setShowManualDialog(false)}
      />
    </div>
  )
}
