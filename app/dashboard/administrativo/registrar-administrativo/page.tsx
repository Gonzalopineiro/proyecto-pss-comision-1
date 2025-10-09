import Sidebar from '@/components/ui/sidebar'
import HeaderClient from '@/components/ui/HeaderClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import RegistrarAdminForm from '@/components/admin/RegistrarAdminForm'

async function parseSession() {
  const ck = await cookies()
  const c = ck.get('session')?.value
  if (!c) return null
  try {
    const s = JSON.parse(Buffer.from(c, 'base64').toString('utf8'))
    return s as any
  } catch {
    return null
  }
}

export default async function RegistrarAdministrativoPage() {
  const session = await parseSession()
  if (!session) redirect('/login?role=administrativo')
  if (session?.role !== 'administrativo') redirect(`/login?role=${session?.role ?? 'estudiante'}`)

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <HeaderClient name={"Juan Pérez"} role={session.role} />
  
            <div className="max-w-6xl mx-auto mt-6">
              <RegistrarAdminForm />
            </div>
          </main>
        </div>
      </div>
    )
}