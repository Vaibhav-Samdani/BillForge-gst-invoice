import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ClientPortalLayout } from "@/components/client/ClientPortalLayout"

export default async function ClientProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <ClientPortalLayout currentPage="profile">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-gray-500">
            Profile management functionality will be implemented in a future task.
          </p>
        </div>
      </div>
    </ClientPortalLayout>
  )
}