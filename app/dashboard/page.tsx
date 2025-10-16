/*import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/dashboard/sidebar'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { ChevronRight, Users, User, Book } from 'lucide-react'


export default async function AdministrativoDashboard(){
  // Verificar autenticación
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Panel superior con información de sesión */
          {/* Header cliente con legajo, rol y logout */}/*
          <div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow mb-6">
              <h1 className="text-2xl font-bold">¡Bienvenido al Sistema!</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/administrativo/registrar-administrativo" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Registrar Administrativo</div>
                      <div className="text-sm text-slate-500 mt-1">Dar de alta a nuevos administradores en el sistema.</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/registrar-alumno" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Registrar Alumno</div>
                      <div className="text-sm text-slate-500 mt-1">Dar de alta a nuevos alumnos y asociarlos a una carrera.</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/crear-materia" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Book className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Materia</div>
                      <div className="text-sm text-slate-500 mt-1">Definir nuevas materias que se ofrecerán a los estudiantes.</div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/administrativo/crear-plan" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Plan de Estudio</div>
                      <div className="text-sm text-slate-500 mt-1">Crear nuevos planes de estudio y sus materias asociadas.</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/crear-carrera" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Carrera</div>
                      <div className="text-sm text-slate-500 mt-1">Agregar una nueva carrera al sistema.</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
*/