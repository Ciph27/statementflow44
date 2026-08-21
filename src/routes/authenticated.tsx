import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Layout } from '#/components/layout'
import { getSession } from '#/lib/auth'

export const Route = createFileRoute('/authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async () => {
    const { session, error } = await getSession()
    
    if (error || !session) {
      throw redirect({
        to: '/auth',
      })
    }
    
    return { userId: session.user.id }
  },
})

function AuthenticatedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}