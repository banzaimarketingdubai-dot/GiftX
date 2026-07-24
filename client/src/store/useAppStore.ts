import { create } from 'zustand';
import { StaffMember, Partner, ClaimedVoucher } from '../types';

interface AppState {
  role: 'WAITER' | 'GUEST' | 'WALLET' | 'MAP' | 'ADMIN';
  setRole: (role: 'WAITER' | 'GUEST' | 'WALLET' | 'MAP' | 'ADMIN') => void;

  // Waiter B2B state
  partners: Partner[];
  selectedStaff: StaffMember | null;
  activeQrToken: string | null;
  tokenExpiresAt: string | null;
  activeBoxLevel: string | null;
  claimedByGuestName: string | null;
  
  setPartners: (partners: Partner[]) => void;
  setSelectedStaff: (staff: StaffMember | null) => void;
  setActiveQrToken: (token: string | null, expiresAt: string | null, boxLevel: string | null) => void;
  setClaimedByGuestName: (name: string | null) => void;

  // Guest B2C state
  wallet: ClaimedVoucher[];
  setWallet: (wallet: ClaimedVoucher[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'GUEST',
  setRole: (role) => set({ role }),

  partners: [],
  selectedStaff: null,
  activeQrToken: null,
  tokenExpiresAt: null,
  activeBoxLevel: null,
  claimedByGuestName: null,

  setPartners: (partners) => set({ partners }),
  setSelectedStaff: (staff) => set({ selectedStaff: staff }),
  setActiveQrToken: (token, expiresAt, boxLevel) => set({ 
    activeQrToken: token, 
    tokenExpiresAt: expiresAt, 
    activeBoxLevel: boxLevel,
    claimedByGuestName: null 
  }),
  setClaimedByGuestName: (name) => set({ claimedByGuestName: name }),

  wallet: [],
  setWallet: (wallet) => set({ wallet })
}));
