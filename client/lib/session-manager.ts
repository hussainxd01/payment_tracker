import { VoucherEntry } from '@/lib/store'

const SESSION_KEY = 'accounting_session'
const SESSION_TIMESTAMP_KEY = 'accounting_session_timestamp'

export interface SessionData {
  vouchers: VoucherEntry[]
  currentVoucherIndex: number
  customAccounts: { name: string; type: 'cash' | 'bank'; bankName?: string }[]
  timestamp: number
  currentStep?: 'upload' | 'entry' | 'outstanding' | 'report' | 'outstanding-details' | 'summary'
  manualQuantity?: number
}

class SessionManager {
  private debounceTimer: NodeJS.Timeout | null = null
  private debounceDelay = 1000 // 1 second debounce

  /**
   * Save session data to localStorage with debouncing
   * Multiple rapid saves will be batched into a single write
   */
  saveSession(data: SessionData): void {
    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      try {
        const sessionData: SessionData = {
          ...data,
          timestamp: Date.now(),
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
        localStorage.setItem(SESSION_TIMESTAMP_KEY, new Date().toISOString())
        console.log('[v0] Session saved:', sessionData.vouchers.length, 'vouchers')
      } catch (error) {
        console.error('[v0] Failed to save session:', error)
      }
    }, this.debounceDelay)
  }

  /**
   * Load session data from localStorage
   */
  loadSession(): SessionData | null {
    try {
      const data = localStorage.getItem(SESSION_KEY)
      if (data) {
        const sessionData: SessionData = JSON.parse(data)
        console.log('[v0] Session loaded:', sessionData.vouchers.length, 'vouchers')
        return sessionData
      }
    } catch (error) {
      console.error('[v0] Failed to load session:', error)
    }
    return null
  }

  /**
   * Check if a session exists
   */
  hasSession(): boolean {
    try {
      return localStorage.getItem(SESSION_KEY) !== null
    } catch {
      return false
    }
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(): {
    voucherCount: number
    lastSaved: string | null
  } | null {
    try {
      const data = localStorage.getItem(SESSION_KEY)
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY)

      if (data) {
        const sessionData: SessionData = JSON.parse(data)
        return {
          voucherCount: sessionData.vouchers.length,
          lastSaved: timestamp,
        }
      }
    } catch (error) {
      console.error('[v0] Failed to get session metadata:', error)
    }
    return null
  }

  /**
   * Clear session data completely
   */
  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(SESSION_TIMESTAMP_KEY)
      console.log('[v0] Session cleared')
    } catch (error) {
      console.error('[v0] Failed to clear session:', error)
    }
  }

  /**
   * Destroy debounce timer
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()
