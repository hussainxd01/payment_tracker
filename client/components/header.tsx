'use client'

import { useAccountingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Home, RotateCcw, AlertCircle } from 'lucide-react'

export default function Header() {
  const { currentStep, setCurrentStep, resetAll, sessionActive, clearSession, vouchers, loadSession } = useAccountingStore()

  if (currentStep === 'upload') return null

  const handleContinueSession = () => {
    loadSession()
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">₹</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground hidden sm:inline">Payment Tracker</span>
            {sessionActive && vouchers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Session active • {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep('upload')}
            className="gap-2 hidden sm:flex"
          >
            <Home className="w-4 h-4" /> Home
          </Button>
          {sessionActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearSession()}
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              title="Clear current session and start fresh"
            >
              <AlertCircle className="w-4 h-4" /> Clear Session
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetAll()
              setCurrentStep('upload')
            }}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
