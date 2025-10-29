import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import Link from 'next/link'
import SidebarAlumno from '@/components/ui/sidebar_alumno'

// Tipos locales mínimos para resolver discrepancias de inferencia de Supabase
type MesaExamen = { id: number; materia_id: number }
type InscripcionMesaRow = { mesa_examen_id: number; mesas_examen: MesaExamen }
type PlanMateriaRow = { materia_id: number }
type ExamenAprobadoRow = { nota: string | number | null }

// Tipo específico para las calificaciones con información completa
type MateriaInfo = { nombre: string; codigo_materia: string }
type MesaExamenCompleta = { 
  fecha_examen: string; 
  notas_cargadas: boolean;
  materias: MateriaInfo 
}
type CalificacionRow = {
  nota: string | number | null
  estado: string
  mesa_examen_id: number
  mesas_examen: MesaExamenCompleta
}

export default async function HistorialAcademico() {
    // Verificar autenticación
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/login')
    }

    // Obtener información del alumno desde la tabla usuarios
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
            id,
            nombre, 
            apellido,
            carrera_id
        `)
        .eq('email', data.user.email)
        .single()

    // Obtener información de la carrera por separado
    let carreraData = null
    if (userData && userData.carrera_id) {
        const { data: carrera, error: carreraError } = await supabase
            .from('carreras')
            .select('id, plan_de_estudio_id')
            .eq('id', userData.carrera_id)
            .single()
        
        carreraData = carrera
        
        if (carreraError) {
            console.error('Error obteniendo carrera:', carreraError)
        }
    }

    if (userError || !userData) {
        console.error('Error obteniendo datos del usuario:', userError)
        redirect('/login')
    }



    // Verificar que tenemos la información de carrera
    if (!carreraData || !carreraData.plan_de_estudio_id) {
        console.error('No se encontró información de carrera para el usuario')
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error</h1>
                    <p className="text-gray-600 mt-2">No se encontró información de carrera para tu usuario</p>
                    <p className="text-sm text-gray-500 mt-1">Carrera ID: {userData?.carrera_id || 'No definido'}</p>
                </div>
            </div>
        )
    }

    // Si hay error o no hay datos, mostramos un saludo genérico
    const nombreCompleto = userData
        ? `${userData.nombre} ${userData.apellido}`
        : 'al Sistema'

    // Obtener progreso académico: materias aprobadas vs total del plan
    const { data: materiasAprobadas, error: errorAprobadas } = await supabase
        .from('inscripciones_mesa_examen')
        .select(`
            mesa_examen_id,
            mesas_examen(
                id,
                materia_id
            )
        `)
        .eq('estudiante_id', data.user.id)
        .eq('estado', 'aprobado')

  // Contar materias únicas aprobadas que pertenecen al plan del alumno
  const materiasUnicasAprobadas = new Set()
    
  // Primero obtener las materias del plan del alumno
  const { data: materiasDelPlan } = await supabase
    .from('plan_materia')
    .select('materia_id')
    .eq('plan_id', carreraData.plan_de_estudio_id)
    
  // casteo local a tipo conocido
  const materiasDelPlanTyped = materiasDelPlan as PlanMateriaRow[] | null
  const materiasDelPlanSet = new Set(materiasDelPlanTyped?.map(m => m.materia_id) || [])
    
  // casteo local para inscripciones a mesa
  const materiasAprobadasTyped = materiasAprobadas as InscripcionMesaRow[] | null
  // Filtrar solo las materias aprobadas que están en el plan del alumno
  materiasAprobadasTyped?.forEach(inscripcion => {
    // Verificar que mesas_examen existe
    if (inscripcion.mesas_examen && inscripcion.mesas_examen.materia_id) {
      const materiaId = inscripcion.mesas_examen.materia_id
      if (materiasDelPlanSet.has(materiaId)) {
        materiasUnicasAprobadas.add(materiaId)
      }
    }
  })
    const cantidadMateriasAprobadas = materiasUnicasAprobadas.size

  // Obtener total de materias del plan de estudios
  const { data: totalMaterias, error: errorTotal } = await supabase
    .from('plan_materia')
    .select('materia_id')
    .eq('plan_id', carreraData.plan_de_estudio_id)

  const totalMateriasTyped = totalMaterias as PlanMateriaRow[] | null
  const totalMateriasEnPlan = totalMateriasTyped?.length || 1
    const porcentajeCompletado = Math.round((cantidadMateriasAprobadas / totalMateriasEnPlan) * 100)

  // Obtener promedio general de exámenes finales aprobados
  const { data: examenesAprobados, error: errorPromedio } = await supabase
    .from('inscripciones_mesa_examen')
    .select('nota')
    .eq('estudiante_id', data.user.id)
    .eq('estado', 'aprobado')
    .not('nota', 'is', null)
    .gte('nota', 4)

  const examenesAprobadosTyped = examenesAprobados as ExamenAprobadoRow[] | null
  const promedio = examenesAprobadosTyped && examenesAprobadosTyped.length > 0
    ? (examenesAprobadosTyped.reduce((sum, exam) => sum + parseFloat(String(exam.nota)), 0) / examenesAprobadosTyped.length).toFixed(1)
    : '0.0'

  // --- Consulta principal para historial de calificaciones ---
  // Aplicando el mismo patrón exitoso del dashboard principal
  const { data: calificaciones, error: errorCalificaciones } = await supabase
    .from('inscripciones_mesa_examen')
    .select(`
      nota,
      estado,
      mesa_examen_id,
      mesas_examen(
        fecha_examen,
        notas_cargadas,
        materias(codigo_materia, nombre)
      )
    `)
    .eq('estudiante_id', data.user.id)
    .not('nota', 'is', null)
    // .eq('mesas_examen.notas_cargadas', true)  // <- Comentado: permite ver notas no publicadas

  // Casteo local para resolver discrepancias de inferencia (mismo patrón del dashboard)
  const calificacionesTyped = calificaciones as CalificacionRow[] | null

  // Aplicar el mismo patrón defensivo del dashboard principal
  const calificacionesArray = calificacionesTyped ?? []
  
  // Ordenar por fecha de examen (desc) en memoria - mismo patrón del dashboard
  const calificacionesSorted = calificacionesArray.slice().sort((a, b) => {
    const ta = a.mesas_examen?.fecha_examen ? new Date(a.mesas_examen.fecha_examen).getTime() : 0
    const tb = b.mesas_examen?.fecha_examen ? new Date(b.mesas_examen.fecha_examen).getTime() : 0
    return tb - ta
  })

  const aprobadasCount = calificacionesSorted.filter(c => c.estado === 'aprobado').length || 0
  const reprobadasCount = calificacionesSorted.filter(c => c.estado === 'reprobado').length || 0

  // Nota: No solicitamos aquí las "materias cursando" ni los "exámenes inscriptos"
  // para mantener esta página minimalista (solo historial publicado).

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
              <div className="flex">
                <SidebarAlumno />
                <main className="flex-1 p-8">
                  <div className="max-w-6xl mx-auto">
                    {/* Header corto: (panel de bienvenida eliminado por requerimiento) */}

                    {/* Resumen: Totales y Promedio (Historial) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                        <div className="text-sm text-slate-500">Total Materias</div>
                        <div className="text-2xl font-bold">{totalMateriasEnPlan}</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                        <div className="text-sm text-slate-500">Aprobadas</div>
                        <div className="text-2xl font-bold text-green-600">{aprobadasCount}</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                        <div className="text-sm text-slate-500">Reprobadas</div>
                        <div className="text-2xl font-bold text-red-600">{reprobadasCount}</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                        <div className="text-sm text-slate-500">Promedio General</div>
                        <div className="text-2xl font-bold text-green-600">{promedio}</div>
                      </div>
                    </div>

                    {/* Tabla: Calificaciones Finales */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow mb-6">
                      <h2 className="text-xl font-bold mb-4">Calificaciones Finales</h2>
                      {calificacionesSorted && calificacionesSorted.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-sm text-slate-500">
                                <th className="py-2">CÓDIGO</th>
                                <th className="py-2">MATERIA</th>
                                <th className="py-2">FECHA</th>
                                <th className="py-2">NOTA</th>
                                <th className="py-2">CONDICIÓN</th>
                                <th className="py-2">ACCIONES</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calificacionesSorted.map((calificacion, index) => {
                                // Acceso correcto a la estructura de datos (tipo local) - mismo patrón del dashboard
                                const mesa = calificacion.mesas_examen as MesaExamenCompleta
                                const materia = mesa?.materias as MateriaInfo
                                const fecha = mesa?.fecha_examen
                                const notaNum = calificacion.nota !== null ? Number(calificacion.nota) : null
                                const condicion = (calificacion.estado === 'aprobado' || (notaNum !== null && notaNum >= 4)) ? 'Aprobado' : 'Reprobado'
                                
                                return (
                                  <tr key={index} className="border-t">
                                    <td className="py-3">{materia?.codigo_materia || '—'}</td>
                                    <td className="py-3 font-medium">{materia?.nombre || '—'}</td>
                                    <td className="py-3">{fecha ? new Date(fecha).toLocaleDateString() : '—'}</td>
                                    <td className="py-3">{notaNum !== null ? notaNum : '—'}</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-1 rounded-full text-sm ${condicion === 'Aprobado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                                        {condicion}
                                      </span>
                                    </td>
                                    <td className="py-3">
                                      <Link href="#" className="text-sm text-slate-500 hover:underline">Ver</Link>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">No hay calificaciones publicadas aún</div>
                      )}
                    </div>

                    {/* Fin - contenido simplificado: no mostramos materias cursando ni exámenes inscriptos en esta página */}
                  </div>
                </main>
              </div>
            </div>
          )
}