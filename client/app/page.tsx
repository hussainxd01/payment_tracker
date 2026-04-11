'use client'

import { useEffect } from 'react'
import { useAccountingStore } from '@/lib/store'
import UploadStep from '@/components/upload-step'
import VoucherEntryStep from '@/components/voucher-entry-step'
import OutstandingReviewStep from '@/components/outstanding-review-step'
import TallyReportStep from '@/components/tally-report-step'
import OutstandingDetailsStep from '@/components/outstanding-details-step'
import Header from '@/components/header'
import KeyboardHelp from '@/components/keyboard-help'

export default function Home() {
  const currentStep = useAccountingStore((state) => state.currentStep)
  const vouchers = useAccountingStore((state) => state.vouchers)
  const loadSession = useAccountingStore((state) => state.loadSession)

  // Load session on app startup
  useEffect(() => {
    loadSession()
  }, [])

  // Determine which step to show
  let step = currentStep

  // If on summary step and there are outstanding vouchers, go to outstanding review first
  if (currentStep === 'summary' && vouchers.some(v => !v.isComplete || v.isOutstanding)) {
    step = 'outstanding'
  }

  return (
    <>
      <Header />
      {step === 'upload' && <UploadStep />}
      {step === 'entry' && <div className="pt-16"><VoucherEntryStep /></div>}
      {step === 'outstanding' && <div className="pt-16"><OutstandingReviewStep /></div>}
      {step === 'report' && <div className="pt-16"><TallyReportStep /></div>}
      {step === 'outstanding-details' && <div className="pt-16"><OutstandingDetailsStep /></div>}
      {step === 'summary' && <div className="pt-16"><TallyReportStep /></div>}
      <KeyboardHelp />
    </>
  )
}
