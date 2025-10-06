"use client"
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Sidebar(){
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r p-4">
      {/* bajar los botones con margin-top y colorearlos por rol */}
      <nav className="flex flex-col gap-3 mt-10">
        <Link href="/dashboard/administrativo/registrar-administrativo">
          <Button className="w-full text-left bg-red-600 hover:bg-red-700 text-white">Registrar Administrativo</Button>
        </Link>
        <Link href="/dashboard/administrativo/registrar-alumno">
          <Button className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white">Registrar Alumno</Button>
        </Link>
        <Link href="/dashboard/administrativo/crear-materia">
          <Button className="w-full text-left bg-green-600 hover:bg-green-700 text-white">Crear Materia</Button>
        </Link>
        <Link href="/dashboard/administrativo/crear-plan">
          <Button className="w-full text-left bg-yellow-600 hover:bg-yellow-700 text-white">Crear Plan de Estudio</Button>
        </Link>
        <Link href="/dashboard/administrativo/crear-carrera">
          <Button className="w-full text-left bg-purple-600 hover:bg-purple-700 text-white">Crear Carrera</Button>
        </Link>
      </nav>
    </aside>
  )
}
