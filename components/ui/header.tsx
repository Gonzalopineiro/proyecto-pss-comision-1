"use client"
import React from 'react'
import { LogOut, GraduationCap, Briefcase, User } from 'lucide-react'

export default function Header({ name, legajo, role }: { name?: string; legajo?: string; role: string }){
  async function handleLogout(){
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // marcar sesión como inactiva antes de recargar
      try { localStorage.removeItem('siu_session_active') } catch(e) {}
      try { window.dispatchEvent(new Event('siu_session_active_cleared')) } catch(e) {}
      // forzar recarga para limpiar sesión y redirigir al login
      window.location.href = '/'
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  const displayName = name ?? legajo ?? ''
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : ''

  const Icon = role === 'estudiante' ? GraduationCap : role === 'docente' ? Briefcase : User
  const bgClass = role === 'estudiante' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200' : role === 'docente' ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-200' : 'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-200'

  return (
    <div className="max-w-6xl mx-auto mb-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${bgClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
