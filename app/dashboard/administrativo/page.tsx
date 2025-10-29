"use client";
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, Users, User, Book, Briefcase, PanelLeft, Library, FileCheck, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function AdministrativoDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // La ruta de logout maneja la redirección automáticamente
      // pero agregamos una redirección de respaldo por si acaso
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Redirigir al login aunque haya error
      router.push('/login');
    }
  };

  // Verificar autenticación
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data?.user) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Gestión integral del sistema académico universitario
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6">Gestión de Entidades</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Gestión de Estudiantes */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Gestión de Estudiantes</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Administrar información académica, inscripciones y expedientes de estudiantes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href="/dashboard/administrativo/grillas/alumnos">
                      <Button variant="outline" size="sm" className="hover:scale-105 hover:shadow-md transition-all duration-300">Ver Grilla de Estudiantes</Button>
                    </Link>
                    <span className="text-sm text-gray-500">2,847 registros</span>
                  </div>
                </div>
              </div>

              {/* Gestión de Docentes */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Gestión de Docentes</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Administrar perfiles docentes, asignaciones de cátedras y horarios académicos
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href="/dashboard/administrativo/grillas/docentes">
                      <Button variant="outline" size="sm" className="hover:scale-105 hover:shadow-md transition-all duration-300">Ver Grilla de Docentes</Button>
                    </Link>
                    <span className="text-sm text-gray-500">186 registros</span>
                  </div>
                </div>
              </div>

              {/* Gestión de Carreras */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Gestión de Carreras</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Administrar planes de estudio, materias y estructura curricular de carreras
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href="/dashboard/administrativo/grillas/carreras">
                      <Button variant="outline" size="sm" className="hover:scale-105 hover:shadow-md transition-all duration-300">Ver Grilla de Carreras</Button>
                    </Link>
                    <span className="text-sm text-gray-500">24 registros</span>
                  </div>
                </div>
              </div>

              {/* Gestión de Administradores */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Gestión de Administradores</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Administrar usuarios del sistema, permisos y roles administrativos
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href="/dashboard/administrativo/grillas/administrativos">
                      <Button variant="outline" size="sm" className="hover:scale-105 hover:shadow-md transition-all duration-300">Ver Grilla de Administradores</Button>
                    </Link>
                    <span className="text-sm text-gray-500">12 registros</span>
                  </div>
                </div>
              </div>

              {/* Gestión de Materias */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Gestión de Materias</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Administrar materias, contenidos y asignación de docentes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href="/dashboard/administrativo/crear-materia">
                      <Button variant="outline" size="sm" className="hover:scale-105 hover:shadow-md transition-all duration-300">Registrar Materia</Button>
                    </Link>
                    <span className="text-sm text-gray-500">156 registros</span>
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