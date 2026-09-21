import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      setActiveCompanyId: (activeCompanyId) => set({ activeCompanyId }),
    }),
    { name: 'unyx-company' }
  )
);
