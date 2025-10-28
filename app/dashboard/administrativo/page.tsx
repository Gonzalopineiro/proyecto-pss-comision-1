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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Panel Administrativo</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Gestión de usuarios, carreras, materias y planes de estudio
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