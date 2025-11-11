// app/dashboard/alumno/certificados/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import CertificadosCliente from './CertificadosCliente'

// --- TIPOS DE DATOS ---

// Tipo para los datos de FINALES aprobados
export type FinalAprobadoRow = {
  nota: string | number | null
  mesas_examen: { 
    fecha_examen: string;
    materias: { nombre: string; codigo_materia: string } 
  }
}

// NUEVO: Tipo para los datos de CURSADAS aprobadas
export type CursadaAprobadaRow = {
  estado: string;
  cursadas: {
    materia_docente: {
      materias: {
        codigo_materia: string;
        nombre: string;
      } | null;
    } | null;
  } | null;
};

// Tipo para los datos del alumno
export type AlumnoCompleto = {
    id: string;
    nombre: string;
    apellido: string;
    dni: number | null;
    legajo: number | null;
    nacimiento: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
}

export default async function CertificadosPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    // 1. Obtener información COMPLETA del alumno (sin cambios)
    const { data: alumnoData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, dni, legajo, nacimiento, email, telefono, direccion')
        .eq('email', user.email)
        .single<AlumnoCompleto>()

    if (userError || !alumnoData) {
        return <p>Error al cargar la información del alumno.</p>
    }

    // 2. Obtener los FINALES aprobados (sin cambios)
    const { data: finalesAprobadosData } = await supabase
        .from('inscripciones_mesa_examen')
        .select(`
            nota,
            mesas_examen(
                fecha_examen,
                materias(codigo_materia, nombre)
            )
        `)
        .eq('estudiante_id', user.id)
        .eq('estado', 'aprobado')
        .order('fecha_examen', { foreignTable: 'mesas_examen', ascending: true });

    const finalesAprobados = (finalesAprobadosData as FinalAprobadoRow[] | null) ?? []

    // 3. NUEVO: Obtener las CURSADAS aprobadas
    const { data: cursadasAprobadasData, error: errorCursadas } = await supabase
      .from('inscripciones_cursada')
      .select(`
        estado,
        cursadas!inner(
          materia_docente!inner(
            materias(
              codigo_materia,
              nombre
            )
          )
        )
      `)
      .eq('alumno_id', user.id)
      .eq('estado', 'aprobada');
    
    if (errorCursadas) {
      console.error("Error obteniendo cursadas aprobadas:", errorCursadas);
    }
    
    const cursadasAprobadas = (cursadasAprobadasData as CursadaAprobadaRow[] | null) ?? []


    // 4. Renderizar el componente cliente con TODOS los datos
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="flex">
                <aside className="w-64">
                    <SidebarAlumno />
                </aside>
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <CertificadosCliente
                            alumno={alumnoData}
                            finalesAprobados={finalesAprobados}
                            cursadasAprobadas={cursadasAprobadas}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}