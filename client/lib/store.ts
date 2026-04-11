import { create } from "zustand";
import { sessionManager } from "@/lib/session-manager";

export interface PredefinedAccount {
  id: string;
  name: string;
  type: "cash" | "bank";
  bankName?: string;
}

export interface PaymentDistribution {
  accountId: string;
  accountName: string;
  amount: number;
  bankName?: string;
  type?: "cash" | "bank";
}

export interface VoucherEntry {
  voucherNumber: string;
  partyName: string;
  totalAmount: number;
  distributions: PaymentDistribution[];
  isComplete: boolean;
  isOutstanding?: boolean;
  outstandingAmount?: number;
  discount?: number;
  goodsReturn?: number;
  isManual?: boolean;
  quantity?: number;
}

export interface AccountingStore {
  // Vouchers
  vouchers: VoucherEntry[];
  currentVoucherIndex: number;
  addVouchers: (
    vouchers: Omit<VoucherEntry, "distributions" | "isComplete">[],
  ) => void;
  updateCurrentVoucher: (distributions: PaymentDistribution[]) => void;
  moveToNextVoucher: () => void;
  moveToPreviousVoucher: () => void;
  setCurrentVoucherIndex: (index: number) => void;
  markVoucherOutstanding: (index: number, isOutstanding: boolean) => void;
  updateVoucherDeductions: (index: number, discount: number, goodsReturn: number) => void;
  resetVouchers: () => void;

  // Predefined Accounts
  predefinedAccounts: PredefinedAccount[];
  customAccounts: PredefinedAccount[];
  initializePredefinedAccounts: () => void;
  addCustomAccount: (
    name: string,
    type: "cash" | "bank",
    bankName?: string,
  ) => void;
  getAllAccounts: () => PredefinedAccount[];

  // UI State
  currentStep: "upload" | "entry" | "outstanding" | "report" | "outstanding-details" | "summary";
  setCurrentStep: (step: "upload" | "entry" | "outstanding" | "report" | "outstanding-details" | "summary") => void;
  manualQuantity: number;

  // Manual Vouchers
  addManualVoucher: (voucherData: Omit<VoucherEntry, "distributions" | "isComplete">) => void;
  removeManualVoucher: (index: number) => void;
  updateManualQuantity: (quantity: number) => void;

  // Summary
  getSummary: () => {
    totalCash: number;
    totalByBank: { [key: string]: number };
    totalByAccount: { [key: string]: number };
    totalOutstanding: number;
    outstandingVouchers: VoucherEntry[];
    totalAmount: number;
    totalDiscount: number;
    totalGoodsReturn: number;
    totalQuantity: number;
  };

  // Reset
  resetAll: () => void;

  // Session Management
  sessionActive: boolean;
  loadSession: () => void;
  clearSession: () => void;
  continueSession: () => void;
}

const DEFAULT_ACCOUNTS: PredefinedAccount[] = [
  { id: "cash", name: "Cash", type: "cash" },
  { id: "bank-1", name: "MGP", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-2", name: "MZUP", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-3", name: "ZEDZONE", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-4", name: "DAZZLE FIT", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-5", name: "ARSHAD", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-6", name: "UNITED 4", type: "bank", bankName: "AXIS BANK" },
  { id: "bank-7", name: "D TRENDS", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-8", name: "ARSH GARMENTS", type: "bank", bankName: "ICICI BANK" },
  { id: "bank-9", name: "OTHERS", type: "bank", bankName: "OTHERS" },
  { id: "bank-10", name: "JAVED", type: "bank", bankName: "ICICI BANK" },
];

export const useAccountingStore = create<AccountingStore>((set, get) => {
  // Load from localStorage on initialization
  const savedState =
    typeof window !== "undefined"
      ? localStorage.getItem("accounting-store")
      : null;
  const initialState = savedState ? JSON.parse(savedState) : {};

  return {
    // Initial state
    vouchers: initialState.vouchers || [],
    currentVoucherIndex: initialState.currentVoucherIndex || 0,
    predefinedAccounts: initialState.predefinedAccounts || DEFAULT_ACCOUNTS,
    customAccounts: initialState.customAccounts || [],
    currentStep: initialState.currentStep || "upload",
    sessionActive: false,
    manualQuantity: initialState.manualQuantity || 0,

    // Voucher methods
    addVouchers: (newVouchers) => {
      const vouchersWithDefaults = newVouchers.map((v) => ({
        ...v,
        distributions: [] as PaymentDistribution[],
        isComplete: false,
      }));
      set({
        vouchers: vouchersWithDefaults,
        currentVoucherIndex: 0,
        currentStep: "entry",
      });
    },

    updateCurrentVoucher: (distributions) => {
      set((state) => {
        const updatedVouchers = [...state.vouchers];
        if (updatedVouchers[state.currentVoucherIndex]) {
          const totalDistributed = distributions.reduce(
            (sum, d) => sum + d.amount,
            0,
          );
          updatedVouchers[state.currentVoucherIndex] = {
            ...updatedVouchers[state.currentVoucherIndex],
            distributions,
            isComplete:
              Math.abs(
                totalDistributed -
                  updatedVouchers[state.currentVoucherIndex].totalAmount,
              ) < 0.01,
          };
        }
        return { vouchers: updatedVouchers };
      });
    },

    moveToNextVoucher: () => {
      set((state) => ({
        currentVoucherIndex: Math.min(
          state.currentVoucherIndex + 1,
          state.vouchers.length - 1,
        ),
      }));
    },

    moveToPreviousVoucher: () => {
      set((state) => ({
        currentVoucherIndex: Math.max(state.currentVoucherIndex - 1, 0),
      }));
    },

    setCurrentVoucherIndex: (index) => {
      set((state) => ({
        currentVoucherIndex: Math.max(
          0,
          Math.min(index, state.vouchers.length - 1),
        ),
      }));
    },

    markVoucherOutstanding: (index, isOutstanding) => {
      set((state) => {
        const updatedVouchers = [...state.vouchers];
        if (updatedVouchers[index]) {
          const totalDistributed = updatedVouchers[index].distributions.reduce(
            (sum, d) => sum + d.amount,
            0,
          );
          const outstandingAmount = Math.max(
            0,
            updatedVouchers[index].totalAmount - totalDistributed,
          );
          updatedVouchers[index] = {
            ...updatedVouchers[index],
            isOutstanding,
            outstandingAmount: isOutstanding ? outstandingAmount : 0,
          };
        }
        return { vouchers: updatedVouchers };
      });
    },

    updateVoucherDeductions: (index, discount, goodsReturn) => {
      set((state) => {
        const updatedVouchers = [...state.vouchers];
        if (updatedVouchers[index]) {
          updatedVouchers[index] = {
            ...updatedVouchers[index],
            discount,
            goodsReturn,
          };
        }
        return { vouchers: updatedVouchers };
      });
    },

    resetVouchers: () => {
      set({ vouchers: [], currentVoucherIndex: 0 });
    },

    // Account methods
    initializePredefinedAccounts: () => {
      set({ predefinedAccounts: DEFAULT_ACCOUNTS });
    },

    addCustomAccount: (name, type, bankName) => {
      set((state) => {
        const newAccount: PredefinedAccount = {
          id: `custom-${Date.now()}`,
          name,
          type,
          bankName,
        };
        return { customAccounts: [...state.customAccounts, newAccount] };
      });
    },

    getAllAccounts: () => {
      const state = get();
      return [...state.predefinedAccounts, ...state.customAccounts];
    },

    // UI methods
    setCurrentStep: (step) => {
      set({ currentStep: step });
    },

    // Manual Voucher methods
    addManualVoucher: (voucherData) => {
      set((state) => {
        const newVoucher: VoucherEntry = {
          ...voucherData,
          distributions: [],
          isComplete: false,
          isManual: true,
        };
        return { vouchers: [...state.vouchers, newVoucher] };
      });
    },

    removeManualVoucher: (index) => {
      set((state) => {
        const updatedVouchers = state.vouchers.filter((_, i) => i !== index);
        return { vouchers: updatedVouchers };
      });
    },

    updateManualQuantity: (quantity) => {
      set({ manualQuantity: Math.max(0, quantity) });
    },

    // Summary methods
    getSummary: () => {
      const state = get();
      const completeVouchers = state.vouchers.filter(
        (v) => v.isComplete && !v.isOutstanding,
      );
      const outstandingVouchers = state.vouchers.filter(
        (v) => !v.isComplete || v.isOutstanding,
      );

      let totalCash = 0;
      const totalByBank: { [key: string]: number } = {};
      const totalByAccount: { [key: string]: number } = {};
      let totalAmount = 0;
      let totalOutstanding = 0;
      let totalDiscount = 0;
      let totalGoodsReturn = 0;
      let totalQuantity = 0;

      completeVouchers.forEach((voucher) => {
        totalAmount += voucher.totalAmount;
        totalDiscount += voucher.discount || 0;
        totalGoodsReturn += voucher.goodsReturn || 0;
        totalQuantity += voucher.quantity || 0;
        voucher.distributions.forEach((dist) => {
          if (dist.type === "cash" || dist.accountName === "Cash") {
            totalCash += dist.amount;
          } else {
            const bankKey = dist.bankName || dist.accountName;
            totalByBank[bankKey] = (totalByBank[bankKey] || 0) + dist.amount;
            // Group by account holder name
            totalByAccount[dist.accountName] = (totalByAccount[dist.accountName] || 0) + dist.amount;
          }
        });
      });

      outstandingVouchers.forEach((voucher) => {
        // Only count discount and goods return for outstanding if the voucher is not settled
        const totalDistributed = voucher.distributions.reduce(
          (sum, d) => sum + d.amount,
          0,
        );
        const netAmount = voucher.totalAmount - (voucher.discount || 0) - (voucher.goodsReturn || 0);
        const outstanding = Math.max(0, netAmount - totalDistributed);

        // Only add to outstanding if there's actually an outstanding amount
        if (outstanding > 0) {
          totalOutstanding += outstanding;
          totalDiscount += voucher.discount || 0;
          totalGoodsReturn += voucher.goodsReturn || 0;
        } else {
          // If settled (balance is zero), don't count it as outstanding but do count deductions
          totalDiscount += voucher.discount || 0;
          totalGoodsReturn += voucher.goodsReturn || 0;
        }
        totalQuantity += voucher.quantity || 0;
      });

      return {
        totalCash,
        totalByBank,
        totalByAccount,
        totalOutstanding,
        outstandingVouchers: outstandingVouchers.filter((v) => {
          const totalDistributed = v.distributions.reduce((sum, d) => sum + d.amount, 0);
          const netAmount = v.totalAmount - (v.discount || 0) - (v.goodsReturn || 0);
          return Math.max(0, netAmount - totalDistributed) > 0;
        }),
        totalAmount,
        totalDiscount,
        totalGoodsReturn,
        totalQuantity,
      };
    },

    // Reset all
    resetAll: () => {
      set({
        vouchers: [],
        currentVoucherIndex: 0,
        customAccounts: [],
        currentStep: "upload",
        sessionActive: false,
        manualQuantity: 0,
      });
      sessionManager.clearSession();
    },

    // Session methods
    loadSession: () => {
      const sessionData = sessionManager.loadSession();
      if (sessionData) {
        set({
          vouchers: sessionData.vouchers,
          currentVoucherIndex: sessionData.currentVoucherIndex,
          customAccounts: sessionData.customAccounts,
          currentStep: sessionData.currentStep || "entry",
          sessionActive: true,
          manualQuantity: sessionData.manualQuantity || 0,
        });
      }
    },

    clearSession: () => {
      sessionManager.clearSession();
      set({
        vouchers: [],
        currentVoucherIndex: 0,
        customAccounts: [],
        currentStep: "upload",
        sessionActive: false,
      });
    },

    continueSession: () => {
      set({ currentStep: "upload" });
    },
  };
});

// Persist state to localStorage
if (typeof window !== "undefined") {
  useAccountingStore.subscribe((state) => {
    localStorage.setItem("accounting-store", JSON.stringify(state));
    
    // Also save to session manager if there are vouchers
    if (state.vouchers.length > 0) {
      sessionManager.saveSession({
        vouchers: state.vouchers,
        currentVoucherIndex: state.currentVoucherIndex,
        customAccounts: state.customAccounts,
        timestamp: Date.now(),
        currentStep: state.currentStep,
        manualQuantity: state.manualQuantity,
      });
    }
  });

  // Check if session exists on app load
  if (sessionManager.hasSession()) {
    useAccountingStore.setState({ sessionActive: true });
  }
}
