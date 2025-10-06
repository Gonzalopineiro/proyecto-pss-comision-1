import React from 'react'
import Link from 'next/link'

export default function RegistrarAlumno(){
  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Registrar Alumno</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Formulario para registrar alumnos (placeholder).</p>
        <div className="mt-6">
          <Link href="/dashboard/administrativo" className="text-blue-600">Volver al panel administrativo</Link>
        </div>
      </div>
    </div>
  )
}
