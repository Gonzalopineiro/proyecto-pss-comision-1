import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import React from 'react'
import Link from 'next/link'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import { Button } from '@/components/ui/button'
import { TrendingUp, Star, BookOpen } from 'lucide-react'

// Tipos locales mínimos para resolver discrepancias de inferencia de Supabase
type MesaExamen = { id: number; materia_id: number }
type InscripcionMesaRow = { mesa_examen_id: number; mesas_examen: MesaExamen }

type PlanMateriaRow = { materia_id: number }

type MateriaInfo = { nombre: string; codigo_materia: string }
type MateriaDocente = { materias: MateriaInfo }
type CursadaInfo = { anio: number; cuatrimestre: number; materia_docente: MateriaDocente }
type InscripcionCursadaRow = { cursadas: CursadaInfo }

type MesasExamenInfo = { fecha_examen: string; hora_examen: string; ubicacion: string; materias: MateriaInfo }
type InscripcionExamenRow = { mesas_examen: MesasExamenInfo }

type ExamenAprobadoRow = { nota: string | number | null }

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

    // Obtener materias actuales que está cursando (inscripciones a cursadas)
    const añoActual = new Date().getFullYear()
  const { data: materiasActuales, error: errorActuales } = await supabase
        .from('inscripciones_cursada')
        .select(`
            cursadas(
                anio,
                cuatrimestre,
                materia_docente(
                    materias(nombre, codigo_materia)
                )
            )
        `)
        .eq('alumno_id', data.user.id)
        .in('estado', ['pendiente', 'aprobada', 'regular'])
        .eq('cursadas.anio', añoActual)



  const materiasActualesTyped = materiasActuales as InscripcionCursadaRow[] | null
  const cantidadMateriasActuales = materiasActualesTyped?.length || 0

    // Obtener exámenes inscriptos para mostrar en la sección de exámenes
    const { data: examenesInscriptos, error: errorExamenes } = await supabase
        .from('inscripciones_mesa_examen')
        .select(`
            mesas_examen(
                fecha_examen,
                hora_examen,
                ubicacion,
                materias(nombre, codigo_materia)
            )
        `)
        .eq('estudiante_id', data.user.id)
        .eq('estado', 'inscripto')
        .gte('mesas_examen.fecha_examen', `${añoActual}-01-01`)
        .lte('mesas_examen.fecha_examen', `${añoActual}-12-31`)
        .order('mesas_examen.fecha_examen', { ascending: true })

  const examenesInscriptosTyped = examenesInscriptos as InscripcionExamenRow[] | null

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          <SidebarAlumno />
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
                <h1 className="text-2xl font-bold">Panel de Estudiante</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Bienvenido a tu portal académico
                </p>
              </div>

              {/* Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Progreso Académico */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Progreso Académico
                    </h3>
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Materias Aprobadas
                    </div>
                    <div className="text-lg font-medium">
                      {cantidadMateriasAprobadas}/{totalMateriasEnPlan}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {porcentajeCompletado}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Completado
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${porcentajeCompletado}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Promedio General */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Promedio General
                    </h3>
                    <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-600">
                      {promedio}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Promedio de exámenes finales
                    </div>
                  </div>
                </div>

                {/* Materias Actuales */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Materias Actuales
                    </h3>
                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-600">
                      {cantidadMateriasActuales}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Cursadas activas
                    </div>
                  </div>
                </div>
              </div>

              {/* Materias Inscriptas */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Materias Cursando</h2>
                  <Link href="/dashboard/alumno/materias/inscripcion/">
                    <Button className="bg-black dark:bg-white dark:text-black text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                      + Inscribirse
                    </Button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {materiasActualesTyped && materiasActualesTyped.length > 0 ? (
                    materiasActualesTyped.map((inscripcion, index) => {
                      // Acceso correcto a la estructura de datos (tipo local)
                      const cursada = inscripcion.cursadas as CursadaInfo;
                      const materiaDocente =
                        cursada?.materia_docente as MateriaDocente;
                      const materia = materiaDocente?.materias as MateriaInfo;

                      if (!materia) {
                        return (
                          <div
                            key={index}
                            className="p-4 border border-red-200 rounded-lg"
                          >
                            <div className="text-red-600">
                              Error: Estructura de datos incompleta
                            </div>
                            <div className="text-xs text-gray-500">
                              Ver consola para detalles
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {materia.nombre}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {materia.codigo_materia}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {cursada.anio} - {cursada.cuatrimestre}°
                              Cuatrimestre
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                            Cursando
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No estás cursando materias este año
                    </div>
                  )}

                  {/* Mostrar también exámenes inscriptos si los hay */}
                  {examenesInscriptosTyped &&
                    examenesInscriptosTyped.length > 0 && (
                      <>
                        <div className="border-t pt-4 mt-6">
                          <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
                            Exámenes Inscriptos
                          </h3>
                          {examenesInscriptosTyped.map((examen, index) => {
                            const mesa = examen.mesas_examen as MesasExamenInfo;
                            const materia = mesa?.materias as MateriaInfo;

                            return (
                              <div
                                key={`examen-${index}`}
                                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg mb-3"
                              >
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {materia?.nombre || "Materia no encontrada"}
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {materia?.codigo_materia ||
                                      "Código no disponible"}
                                  </div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                    {mesa?.fecha_examen
                                      ? new Date(
                                          mesa.fecha_examen
                                        ).toLocaleDateString()
                                      : "Fecha no disponible"}{" "}
                                    -{" "}
                                    {mesa?.hora_examen || "Hora no disponible"}{" "}
                                    -{" "}
                                    {mesa?.ubicacion ||
                                      "Ubicación no disponible"}
                                  </div>
                                </div>
                                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                  Inscripto
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
}