'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, useHashSync } from '@/lib/store'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HomeView } from '@/components/views/home'
import { AboutView } from '@/components/views/about'
import { ProjectsView } from '@/components/views/projects'
import { ProjectDetailView } from '@/components/views/project-detail'
import { TimelineView } from '@/components/views/timeline-view'
import { NewsView } from '@/components/views/news'
import { SaleView } from '@/components/views/sale'
import { BlogView } from '@/components/views/blog'
import { OfficialsView } from '@/components/views/officials'
import { ConsultingView } from '@/components/views/consulting'
import { CollaborateView } from '@/components/views/collaborate'
import { LoginView } from '@/components/views/login'
import { DashboardView } from '@/components/views/dashboard'

export function App() {
  const { view, user, authChecked, setUser, setAuthChecked, navigate } = useAppStore()
  useHashSync()

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true))
  }, [setUser, setAuthChecked])

  useEffect(() => {
    if (authChecked && (view.name === 'dashboard' || view.name === 'timeline') && !user) {
      navigate('login')
    }
  }, [authChecked, view.name, user, navigate])

  const renderView = () => {
    switch (view.name) {
      case 'about':
        return <AboutView />
      case 'projects':
        return <ProjectsView />
      case 'project':
        return <ProjectDetailView slug={view.param || ''} />
      case 'timeline':
        return <TimelineView slug={view.param || ''} />
      case 'news':
        return <NewsView />
      case 'sale':
        return <SaleView />
      case 'blog':
        return <BlogView />
      case 'officials':
        return <OfficialsView />
      case 'consulting':
        return <ConsultingView />
      case 'collaborate':
        return <CollaborateView />
      case 'login':
        return <LoginView />
      case 'dashboard':
        return user ? <DashboardView /> : null
      default:
        return <HomeView />
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.name + (view.param || '')}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  )
}
