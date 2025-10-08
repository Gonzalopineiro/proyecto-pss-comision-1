import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/ui/sidebar'
import HeaderClient from '@/components/ui/HeaderClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AltaUsuarioForm from './AltaUsuarioForm'

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

export default async function RegistrarAlumno(){
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Registrar Alumno</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Complete la información del alumno para registrarlo en el sistema</p>
                </div>
                <Link href="/dashboard/administrativo">
                  <Button variant="outline">Volver al panel administrativo</Button>
                </Link>
              </div>
              
              {/* Formulario de alta de usuario */}
              <AltaUsuarioForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
