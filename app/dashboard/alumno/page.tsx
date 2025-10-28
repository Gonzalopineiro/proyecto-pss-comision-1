import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import Link from 'next/link'
import SidebarAlumno from '@/components/dashboard/sidebar_alumno'
import { Button } from '@/components/ui/button'
import { TrendingUp, Star, BookOpen } from 'lucide-react'

export default async function AlumnoDashboard() {
    // Verificar autenticación
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/login')
    }

    // Obtener información del alumno desde la tabla usuarios
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('nombre, apellido')
        .eq('email', data.user.email)
        .single()

    // Si hay error o no hay datos, mostramos un saludo genérico
    const nombreCompleto = userData
        ? `${userData.nombre} ${userData.apellido}`
        : 'al Sistema'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
              <div className="flex">
                <SidebarAlumno />
                <main className="flex-1 p-8">
                  <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
                      <h1 className="text-2xl font-bold">Panel de Estudiante</h1>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Bienvenido a tu portal académico
                      </p>
                    </div>
                    
                    {/* Progress Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Progreso Académico */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Progreso Académico</h3>
                          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-slate-500 dark:text-slate-400">Materias Aprobadas</div>
                          <div className="text-lg font-medium">24/36</div>
                          <div className="text-3xl font-bold text-blue-600">67%</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Completado</div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Promedio General */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Promedio General</h3>
                          <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-green-600">8.2</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Promedio de exámenes finales</div>
                        </div>
                      </div>

                      {/* Materias Actuales */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Materias Actuales</h3>
                          <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-purple-600">5</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Cursadas activas</div>
                        </div>
                      </div>
                    </div>

                    {/* Materias Inscriptas */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Materias Inscriptas</h2>
                        <Button className="bg-black dark:bg-white dark:text-black text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                          + Inscribirse
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Álgebra Lineal</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Matemática - 2do Año</div>
                          </div>
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            Cursando
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Base de Datos</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Sistemas - 2do Año</div>
                          </div>
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            Cursando
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Programación II</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Sistemas - 2do Año</div>
                          </div>
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            Cursando
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          )
}