// app/dashboard/alumno/certificados/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import CertificadosCliente from './CertificadosCliente' // Importamos el nuevo componente cliente

// Tipos para los datos que vamos a pasar
type MateriaInfo = { nombre: string; codigo_materia: string }
type MesaExamenCompleta = { 
  fecha_examen: string;
  materias: MateriaInfo 
}
export type MateriaAprobadaRow = {
  nota: string | number | null
  mesas_examen: MesaExamenCompleta
}

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
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    // 2. Obtener información COMPLETA del alumno (misma consulta que antes)
    const { data: alumnoData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, carrera_id, dni, legajo, nacimiento, email, telefono, direccion')
        .eq('email', user.email)
        .single<AlumnoCompleto>()

    if (userError || !alumnoData) {
        console.error('Error obteniendo datos del usuario:', userError)
        return <p>Error al cargar la información del alumno para el certificado.</p>
    }

    // 3. Obtener SÓLO las materias aprobadas
    const { data: materiasAprobadas, error: errorAprobadas } = await supabase
        .from('inscripciones_mesa_examen')
        .select(`
            nota,
            mesas_examen(
                fecha_examen,
                materias(codigo_materia, nombre)
            )
        `)
        .eq('estudiante_id', user.id)
        .eq('estado', 'aprobado') // Filtramos directamente las aprobadas
        .order('fecha_examen', { foreignTable: 'mesas_examen', ascending: false });


    const materiasAprobadasTyped = (materiasAprobadas as MateriaAprobadaRow[] | null) ?? []

    // 4. Renderizar el componente cliente con los datos
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
                            materiasAprobadas={materiasAprobadasTyped}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}