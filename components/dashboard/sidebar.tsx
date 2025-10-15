"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Users, Book, FileText, GraduationCap, Grid, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function Sidebar(){
  const router = useRouter()
  
  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (!error) {
      router.push('/login')
      router.refresh()
    } else {
      console.error("Error al cerrar sesión:", error)
    }
  }
  
  return (
    <aside className="w-64 bg-slate-900 text-white h-screen sticky top-0">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center">
            <Grid className="w-5 h-5 text-white" />
          </div>
          <div className="font-semibold text-lg">Dashboard</div>
        </div>

        <nav className="flex flex-col gap-3 mt-4">
          <Link href="/dashboard/administrativo/registrar-administrativo" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60">
            <div className="p-2 bg-slate-800 rounded-md"><User className="w-5 h-5 text-white" /></div>
            <span>Registrar Administrativo</span>
          </Link>

          <Link href="/dashboard/administrativo/registrar-alumno" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60">
            <div className="p-2 bg-slate-800 rounded-md"><Users className="w-5 h-5 text-white" /></div>
            <span>Registrar Alumno</span>
          </Link>

          <Link href="/dashboard/administrativo/crear-materia" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60">
            <div className="p-2 bg-slate-800 rounded-md"><Book className="w-5 h-5 text-white" /></div>
            <span>Crear Materia</span>
          </Link>

          <Link href="/dashboard/administrativo/crear-plan" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60">
            <div className="p-2 bg-slate-800 rounded-md"><FileText className="w-5 h-5 text-white" /></div>
            <span>Crear Plan de Estudios</span>
          </Link>

          <Link href="/dashboard/administrativo/crear-carrera" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60">
            <div className="p-2 bg-slate-800 rounded-md"><GraduationCap className="w-5 h-5 text-white" /></div>
            <span>Crear Carrera</span>
          </Link>
        </nav>
        
        {/* Botón de logout */}
        <div className="absolute bottom-8 left-0 w-full px-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md w-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <div className="p-2 bg-red-700 rounded-md">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}