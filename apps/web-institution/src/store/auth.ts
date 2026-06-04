import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  orgId: string | null
  orgName: string | null
  setAuth: (token: string, orgId: string, orgName: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      orgId: null,
      orgName: null,
      setAuth: (token, orgId, orgName) => set({ token, orgId, orgName }),
      logout: () => set({ token: null, orgId: null, orgName: null }),
    }),
    { name: 'institution-auth' },
  ),
)
