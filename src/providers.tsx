import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { Link, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { authClient } from './lib/auth-client'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(href) => router.navigate({ href })}
      replace={(href) => router.navigate({ href, replace: true })}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
    >
      {children}
    </AuthUIProvider>
  )
}
