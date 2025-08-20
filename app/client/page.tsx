import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ClientPortalLayout } from "@/components/client/ClientPortalLayout"
import { ClientDashboard } from "@/components/client/ClientDashboard"

export default async function ClientPortalPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <ClientPortalLayout currentPage="dashboard">
      <ClientDashboard />
    </ClientPortalLayout>
  )
}