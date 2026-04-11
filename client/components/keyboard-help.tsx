'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, HelpCircle } from 'lucide-react'

export default function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 gap-2 print:hidden"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">Help</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <Card className="bg-card border border-border max-w-md p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-4">Keyboard Shortcuts</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">Ctrl + ? (or Cmd + ?)</p>
                <p className="text-muted-foreground">Open this help menu</p>
              </div>

              <div>
                <p className="font-semibold text-foreground">Tab</p>
                <p className="text-muted-foreground">Navigate between inputs</p>
              </div>

              <div>
                <p className="font-semibold text-foreground">Enter</p>
                <p className="text-muted-foreground">Submit or proceed to next step</p>
              </div>

              <div>
                <p className="font-semibold text-foreground">Escape</p>
                <p className="text-muted-foreground">Close dialogs and modals</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Tip: Clear your browser data to reset the app completely.</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
