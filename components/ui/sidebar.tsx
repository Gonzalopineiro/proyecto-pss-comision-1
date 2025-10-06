"use client"
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Sidebar(){
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r p-4">
      <nav className="flex flex-col gap-3">
        <Link href="/admin/registrar-administrativo">
          <Button className="w-full text-left">Registrar Administrativo</Button>
        </Link>
        <Link href="/admin/registrar-alumno">
          <Button className="w-full text-left">Registrar Alumno</Button>
        </Link>
        <Link href="/admin/crear-materia">
          <Button className="w-full text-left">Crear Materia</Button>
        </Link>
        <Link href="/admin/crear-plan">
          <Button className="w-full text-left">Crear Plan de Estudio</Button>
        </Link>
        <Link href="/admin/crear-carrera">
          <Button className="w-full text-left">Crear Carrera</Button>
        </Link>
      </nav>
    </aside>
  )
}
