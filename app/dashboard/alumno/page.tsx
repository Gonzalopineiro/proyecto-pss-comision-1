import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'

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
                {/* aca iria el side bar del alumno ver sprint siguiente */}
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
                            <h1 className="text-2xl font-bold">¡Bienvenido {nombreCompleto}!</h1>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                Has ingresado con rol de <span className="font-semibold">Alumno</span>
                            </p>
                        </div>

                        {/* Contenido principal del dashboard actualizar siguiente sprint */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
                                <h2 className="text-lg font-semibold mb-4">Mis Materias</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Accede a tus materias actuales y contenidos
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
                                <h2 className="text-lg font-semibold mb-4">Inscripciones</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Gestiona tus inscripciones a materias
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
                                <h2 className="text-lg font-semibold mb-4">Mi Progreso</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Revisa tu historial académico y calificaciones
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}