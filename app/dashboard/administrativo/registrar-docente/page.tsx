import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AltaDocenteForm from './altaDocenteForm'
import { createClient } from '@/utils/supabase/server'

export default async function RegistrarDocente(){
  // Verificar permisos
  const supabase = await createClient()
  
  // Obtener el usuario autenticado
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData.user) {
    redirect('/login')
  }
  
  // Obtener el perfil del usuario
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  
  if (error || !profile || (profile.role !== 'admin' && profile.role !== 'super')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">

          <div className="max-w-6xl mx-auto mt-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Registrar Docente</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Complete la información del docente para registrarlo en el sistema</p>
                </div>
                <Link href="/dashboard/administrativo">
                  <Button variant="outline">Volver al panel administrativo</Button>
                </Link>
              </div>
              
              {/* Formulario de alta de docente */}
              <AltaDocenteForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}