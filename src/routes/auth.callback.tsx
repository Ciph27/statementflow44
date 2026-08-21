import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.navigate({ to: '/auth' })
        return
      }

      if (data.session) {
        router.navigate({ to: '/dashboard' })
      } else {
        router.navigate({ to: '/auth' })
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-text-secondary">Processing authentication...</p>
      </div>
    </div>
  )
}