'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface AlumnoData {
  id: string
  nombre: string
  apellido: string
  dni: string
  legajo: string
  email: string
  carrera: {
    id: number
    nombre: string
    universidad: string
  }
}

export interface CursadaActiva {
  id: number
  materia_nombre: string
  codigo_materia: string
  anio: number
  cuatrimestre: number
  estado: string
}

export interface ConstanciaData {
  alumno: AlumnoData
  cursadas_activas: CursadaActiva[]
  fecha_generacion: string
  codigo_verificacion: string
  total_cursadas_activas: number
}

// Función para generar código de verificación único
function generarCodigoVerificacion(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `AR-${timestamp}-${random}`.toUpperCase()
}

// Verificar si el alumno tiene cursadas activas en el último año
export async function verificarElegibilidadConstancia() {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  try {
    // Obtener datos del alumno
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombre,
        apellido,
        dni,
        legajo,
        email,
        carrera_id,
        carreras!carrera_id (
          id,
          nombre
        )
      `)
      .eq('email', user.email)
      .single()

    if (usuarioError || !usuarioData) {
      return { 
        success: false, 
        error: 'No se encontró información del alumno',
        data: null
      }
    }

    // Verificar cursadas activas en el último año
    const añoActual = new Date().getFullYear()
    const { data: cursadasActivas, error: cursadasError } = await supabase
      .from('inscripciones_cursada')
      .select(`
        cursadas (
          id,
          anio,
          cuatrimestre,
          materia_docente (
            materias (
              nombre,
              codigo_materia
            )
          )
        )
      `)
      .eq('alumno_id', user.id)
      .in('estado', ['pendiente', 'regular', 'aprobada'])
      .gte('cursadas.anio', añoActual - 1) // Último año

    if (cursadasError) {
      return { 
        success: false, 
        error: 'Error al verificar cursadas activas',
        data: null
      }
    }

    const cursadasFormateadas = (cursadasActivas || []).map((inscripcion: any) => ({
      id: inscripcion.cursadas.id,
      materia_nombre: inscripcion.cursadas.materia_docente.materias.nombre,
      codigo_materia: inscripcion.cursadas.materia_docente.materias.codigo_materia,
      anio: inscripcion.cursadas.anio,
      cuatrimestre: inscripcion.cursadas.cuatrimestre,
      estado: 'activa'
    }))

    // Verificar si tiene al menos una cursada activa
    if (cursadasFormateadas.length === 0) {
      return {
        success: false,
        error: 'No tienes cursadas activas en el último año. Para obtener la constancia de alumno regular debes tener al menos una cursada activa.',
        data: null
      }
    }

    // Preparar datos para la constancia
    const constanciaData: ConstanciaData = {
      alumno: {
        id: usuarioData.id,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        dni: usuarioData.dni,
        legajo: usuarioData.legajo,
        email: usuarioData.email,
        carrera: {
          id: (usuarioData.carreras as any).id,
          nombre: (usuarioData.carreras as any).nombre,
          universidad: 'Universidad Nacional de Córdoba' // Valor por defecto
        }
      },
      cursadas_activas: cursadasFormateadas,
      fecha_generacion: new Date().toISOString(),
      codigo_verificacion: generarCodigoVerificacion(),
      total_cursadas_activas: cursadasFormateadas.length
    }

    return {
      success: true,
      data: constanciaData,
      error: null
    }

  } catch (error: any) {
    console.error('Error verificando elegibilidad:', error)
    return {
      success: false,
      error: 'Error interno al verificar elegibilidad',
      data: null
    }
  }
}

