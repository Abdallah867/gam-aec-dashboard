import { OrganizationSettingsCards } from '@daveyplate/better-auth-ui'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organization/$settings')({
  component: OrganizationSettingsPage,
})

function OrganizationSettingsPage() {
  return <OrganizationSettingsCards />
}
