import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/ui/sidebar'
import HeaderClient from '@/components/ui/HeaderClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function parseSession() {
  const ck = await cookies()
  const c = ck.get('session')?.value
  if (!c) return null
  try {
    const s = JSON.parse(Buffer.from(c, 'base64').toString('utf8'))
    return s as { legajo: string; role: string }
  } catch {
    return null
  }
}

export default async function AdministrativoDashboard(){
  const session = await parseSession()
  if (!session) redirect('/login?role=administrativo')
  if (session?.role !== 'administrativo') redirect(`/login?role=${session?.role ?? 'estudiante'}`)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Panel superior con información de sesión */}
          {/* Header cliente con legajo, rol y logout */}
          <div>
            <HeaderClient legajo={session.legajo} role={session.role} />
          </div>

          <div className="max-w-6xl bg-white dark:bg-slate-800 p-6 rounded-xl shadow mx-auto">
            <h1 className="text-2xl font-bold">Panel Administrativo</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Bienvenido al sistema, ha iniciado correctamente como <span className="font-medium text-gray-900 dark:text-gray-100">{session.role?.charAt(0).toUpperCase() + session.role?.slice(1)}</span>.</p>
            <div className="mt-6 space-y-2">
              <Link href="/" className="text-sm text-blue-600">Volver al inicio</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
