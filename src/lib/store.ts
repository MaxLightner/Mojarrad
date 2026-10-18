import { create } from 'zustand'
import { useEffect } from 'react'

export type ViewName =
  | 'home'
  | 'about'
  | 'projects'
  | 'project'
  | 'timeline'
  | 'sale'
  | 'news'
  | 'blog'
  | 'officials'
  | 'consulting'
  | 'collaborate'
  | 'login'
  | 'dashboard'

export type AppView = { name: ViewName; param?: string }

export type ThemeName = 'dark' | 'light' | 'pastel' | 'navy'

export type AuthUser = {
  id: string
  username: string
  fullName: string
  role: string
}

type AppState = {
  view: AppView
  user: AuthUser | null
  authChecked: boolean
  theme: ThemeName
  navigate: (name: ViewName, param?: string, replace?: boolean) => void
  setUser: (u: AuthUser | null) => void
  setAuthChecked: (v: boolean) => void
  setTheme: (t: ThemeName) => void
}

function viewToHash(v: AppView) {
  if (v.name === 'home') return '#/'
  if (v.param) return `#/${v.name}/${encodeURIComponent(v.param)}`
  return `#/${v.name}`
}

function hashToView(hash: string): AppView {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((p) => decodeURIComponent(p))
  const known: ViewName[] = ['home', 'about', 'projects', 'project', 'timeline', 'sale', 'news', 'blog', 'officials', 'consulting', 'collaborate', 'login', 'dashboard']
  const name = (parts[0] as ViewName) || 'home'
  if (!known.includes(name)) return { name: 'home' }
  return { name, param: parts[1] }
}

const initialView: AppView = { name: 'home' }

export const useAppStore = create<AppState>((set, get) => ({
  view: initialView,
  user: null,
  authChecked: false,
  theme: 'navy',
  navigate: (name, param, replace) => {
    const view = { name, param }
    set({ view })
    if (typeof window !== 'undefined') {
      const h = viewToHash(view)
      if (replace) window.history.replaceState(null, '', h)
      else window.location.hash = h
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  },
  setUser: (user) => set({ user }),
  setAuthChecked: (authChecked) => set({ authChecked }),
  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.classList.remove('theme-dark', 'theme-light', 'theme-pastel', 'theme-navy')
      root.classList.add(`theme-${theme}`)
      try {
        localStorage.setItem('nikabana-theme', theme)
      } catch {}
      window.dispatchEvent(new CustomEvent('nikabana-theme-change', { detail: theme }))
    }
  },
}))

export function useHashSync() {
  useEffect(() => {
    const next = hashToView(window.location.hash)
    if (next.name !== 'home' || next.param) {
      useAppStore.getState().navigate(next.name, next.param, true)
    }
    const onHashChange = () => {
      const current = useAppStore.getState().view
      const next = hashToView(window.location.hash)
      if (next.name !== current.name || next.param !== current.param) {
        useAppStore.setState({ view: next })
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}
