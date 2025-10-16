import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { ChevronRight, Users, User, Book, Briefcase, PanelLeft, Library, FileCheck } from 'lucide-react'

export default async function AdministrativoDashboard() {
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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
              <h1 className="text-2xl font-bold">Panel Administrativo</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Gestión de usuarios, carreras, materias y planes de estudio
              </p>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">Gestión Académica</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/administrativo/registrar-administrativo" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Registrar Administrativo</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dar de alta a nuevos administradores en el sistema</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/registrar-alumno" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Registrar Alumno</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dar de alta a nuevos alumnos y asociarlos a una carrera</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/crear-materia" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Book className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Materia</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Definir nuevas materias para los planes de estudio</div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/administrativo/crear-plan" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Plan de Estudio</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crear nuevos planes de estudio y sus materias asociadas</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/crear-carrera" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Crear Carrera</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agregar una nueva carrera al sistema</div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/administrativo" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <PanelLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Panel Principal</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Volver al panel principal del sistema</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            
            <h2 className="text-xl font-semibold mt-10 mb-4">Reportes y Visualización</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/administrativo/visualizar-planes" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                      <Library className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Planes de Estudio</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ver y administrar los planes de estudio existentes</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/administrativo/carreras" className="block">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Gestionar Carreras</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ver y administrar las carreras disponibles</div>
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