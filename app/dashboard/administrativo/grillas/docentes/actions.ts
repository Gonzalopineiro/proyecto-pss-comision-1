'use server'

import { createClient } from '@/utils/supabase/server'

// Función para obtener la lista de docentes con sus materias asignadas
export async function obtenerDocentesConMaterias() {
  const supabase = await createClient()
  
  // Obtener docentes con sus materias relacionadas (incluyendo plan_materia)
  const { data, error } = await supabase
    .from('docentes')
    .select(`
      *,
      materia_docente (
        materia_id,
        created_at,
        materias (
          id,
          nombre,
          codigo_materia
        )
      )
    `)
    .order('apellido', { ascending: true })
  
  if (error) {
    console.error('Error al obtener docentes con materias:', error)
    return []
  }
  
  console.log('=== obtenerDocentesConMaterias ===')
  console.log('Data raw:', JSON.stringify(data?.[0], null, 2)) // Ver el primer docente
  console.log('Campos disponibles en primer docente:', data?.[0] ? Object.keys(data[0]) : 'No hay datos')
  if (data?.[0]) {
    console.log('Telefono:', data[0].telefono)
    console.log('Direccion completa:', data[0].direccion_completa)
  }
  
  // Transformar los datos para incluir un array de nombres de materias
  const docentesConMaterias = data?.map(docente => {
    console.log(`Docente ${docente.nombre}:`)
    console.log('  materia_docente:', docente.materia_docente)
    
    return {
      ...docente,
      materias: docente.materia_docente?.map((md: any) => md.materias?.nombre || 'Sin nombre').filter(Boolean) || [],
      materia_docente_completo: docente.materia_docente // Guardar datos completos para usar después
    }
  }) || []
  
  console.log('Primer docente transformado:', JSON.stringify(docentesConMaterias[0], null, 2))
  
  return docentesConMaterias
}

// Función para asignar una materia a un docente
export async function asignarMateriaADocente(
  docenteId: string, // UUID
  materiaId: string,
  materiaNombre: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // TODO: Implementar validación
    // 1. Verificar que exista una materia con ese ID y nombre
    // const { data: materia, error: errorMateria } = await supabase
    //   .from('materias')
    //   .select('id, nombre, codigo_materia')
    //   .eq('codigo_materia', materiaId)
    //   .eq('nombre', materiaNombre)
    //   .single()
    //
    // if (errorMateria || !materia) {
    //   return { 
    //     success: false, 
    //     error: 'El ID y el Nombre no corresponden a una materia existente' 
    //   }
    // }

    // 2. Verificar cuántos docentes tiene asignada esa materia
    // const { data: docentesAsignados, error: errorCount } = await supabase
    //   .from('materia_docente')
    //   .select('docente_id')
    //   .eq('materia_id', materia.id)
    //
    // if (errorCount) {
    //   return { success: false, error: 'Error al verificar docentes asignados' }
    // }
    //
    // if (docentesAsignados && docentesAsignados.length >= 2) {
    //   return { 
    //     success: false, 
    //     error: 'El cupo de docentes para esta materia está lleno' 
    //   }
    // }

    // 3. Verificar que el docente no esté ya asignado a esta materia
    // const { data: asignacionExistente } = await supabase
    //   .from('materia_docente')
    //   .select('*')
    //   .eq('materia_id', materia.id)
    //   .eq('docente_id', docenteId)
    //   .single()
    //
    // if (asignacionExistente) {
    //   return { 
    //     success: false, 
    //     error: 'El docente ya está asignado a esta materia' 
    //   }
    // }

    // 4. Insertar la asignación
    // const { error: errorInsert } = await supabase
    //   .from('materia_docente')
    //   .insert({
    //     docente_id: docenteId,
    //     materia_id: materia.id
    //   })
    //
    // if (errorInsert) {
    //   return { success: false, error: 'Error al asignar la materia' }
    // }

    // Revalidar la ruta para actualizar la grilla
    // revalidatePath('/dashboard/administrativo/grillas/docentes')

    return { success: true }
  } catch (error: any) {
    console.error('Error en asignarMateriaADocente:', error)
    return { 
      success: false, 
      error: error.message || 'Error inesperado al asignar la materia' 
    }
  }
}

// Interface para materias asignadas con detalles
export interface MateriaAsignadaDetalle {
  id: number
  codigo: string
  nombre: string
  carrera: string
  año: string
  asignado: string
  estudiantes: number
  tieneMesaVigente?: boolean
}

// Función para enriquecer la información de las materias de un docente
export async function obtenerInformacionMaterias(
  docenteId: string // UUID
): Promise<MateriaAsignadaDetalle[]> {
  const supabase = await createClient()

  try {
    console.log('=== obtenerInformacionMaterias ===')
    console.log('docenteId:', docenteId)

    // Consultar directamente materia_docente para este docente
    const { data: materiasDocente, error } = await supabase
      .from('materia_docente')
      .select(`
        materia_id,
        created_at,
        materias (
          id,
          nombre,
          codigo_materia
        )
      `)
      .eq('docente_id', docenteId)

    console.log('Materias obtenidas de BD:', materiasDocente)

    if (error) {
      console.error('Error al obtener materia_docente:', error)
      return []
    }

    if (!materiasDocente || materiasDocente.length === 0) {
      console.log('No hay materias para este docente')
      return []
    }

    // Extraer IDs de materias
    const materiasIds = materiasDocente
      .map((item: any) => {
        return item.materias?.id || item.materia_id
      })
      .filter(Boolean)

    console.log('IDs de materias extraídos:', materiasIds)

    if (materiasIds.length === 0) {
      return []
    }

    // Obtener plan_materia para todas las materias en una sola query
    const { data: planesMateria } = await supabase
      .from('plan-materia')
      .select('materia_id, anio, plan_id')
      .in('materia_id', materiasIds)

    console.log('Planes materia obtenidos:', planesMateria)

    // Obtener IDs únicos de planes
    const planesIds = planesMateria?.map(pm => pm.plan_id).filter(Boolean) || []
    const planesIdsUnicos = [...new Set(planesIds)]

    // Obtener carreras para todos los planes en una sola query
    const { data: carreras } = await supabase
      .from('carreras')
      .select('plan_de_estudio_id, nombre')
      .in('plan_de_estudio_id', planesIdsUnicos)

    console.log('Carreras obtenidas:', carreras)

    // Crear mapas para lookup rápido O(1)
    const planMateriaMap = new Map(
      planesMateria?.map(pm => [pm.materia_id, pm]) || []
    )
    const carreraMap = new Map(
      carreras?.map(c => [c.plan_de_estudio_id, c.nombre]) || []
    )

    // Obtener fecha actual para verificar mesas vigentes
    const fechaActual = new Date().toISOString()

    // Obtener mesas vigentes en una sola consulta
    const { data: mesasVigentes } = await supabase
      .from('mesas_examen')
      .select('materia_id')
      .eq('docente_id', docenteId)
      .in('materia_id', materiasIds)
      .gte('fecha_examen', fechaActual)

    // Crear un Set con los IDs de materias que tienen mesas vigentes
    const materiasConMesaVigente = new Set(
      mesasVigentes?.map(m => m.materia_id) || []
    )

    // Transformar los datos
    const materiasConDetalles = materiasDocente
      .map((item: any) => {
        const materia = item.materias
        
        if (!materia) {
          return null
        }

        // Obtener información del plan
        const planInfo = planMateriaMap.get(materia.id)
        const nombreCarrera = planInfo ? (carreraMap.get(planInfo.plan_id) || 'Sin asignar') : 'Sin asignar'
        const anio = planInfo?.anio ? `${planInfo.anio}° Año` : 'N/A'

        return {
          id: materia.id,
          codigo: materia.codigo_materia || 'N/A',
          nombre: materia.nombre,
          carrera: nombreCarrera,
          año: anio,
          asignado: new Date(item.created_at).toLocaleDateString('es-AR'),
          estudiantes: 0, // Por el momento en 0
          tieneMesaVigente: materiasConMesaVigente.has(materia.id) || false
        } as MateriaAsignadaDetalle
      })
      .filter((m): m is MateriaAsignadaDetalle => m !== null)

    console.log('Materias con detalles:', materiasConDetalles)
    return materiasConDetalles
  } catch (error: any) {
    console.error('Error en obtenerInformacionMaterias:', error)
    return []
  }
}

// Función para desasignar materias de un docente
export async function desasignarMateriasDocente(
  docenteId: number,
  materiasIds: number[]
): Promise<{ success: boolean; error?: string; mensaje?: string }> {
  const supabase = await createClient()

  try {
    // TODO: Implementar validaciones
    // 1. Verificar que el docente exista y esté activo
    // const { data: docente, error: errorDocente } = await supabase
    //   .from('docentes')
    //   .select('id, estado')
    //   .eq('id', docenteId)
    //   .single()
    //
    // if (errorDocente || !docente) {
    //   return { 
    //     success: false, 
    //     error: 'El docente no existe en el sistema' 
    //   }
    // }
    //
    // if (docente.estado !== 'Activo') {
    //   return { 
    //     success: false, 
    //     error: 'Solo se permite desasignar docentes activos' 
    //   }
    // }

    // 2. Verificar que las materias no tengan mesas de examen vigentes
    // for (const materiaId of materiasIds) {
    //   const { data: mesasVigentes } = await supabase
    //     .from('mesas_examen')
    //     .select('*')
    //     .eq('materia_id', materiaId)
    //     .eq('docente_id', docenteId)
    //     .gte('fecha', new Date().toISOString())
    //   
    //   if (mesasVigentes && mesasVigentes.length > 0) {
    //     return {
    //       success: false,
    //       error: 'No puede eliminarse un docente asignado a una mesa de examen vigente'
    //     }
    //   }
    // }

    // 3. Eliminar las asignaciones
    // const { error: errorDelete } = await supabase
    //   .from('materia_docente')
    //   .delete()
    //   .eq('docente_id', docenteId)
    //   .in('materia_id', materiasIds)
    //
    // if (errorDelete) {
    //   return { success: false, error: 'Error al desasignar materias' }
    // }

    // 4. Verificar si el docente quedó sin materias
    // const { data: materiasRestantes } = await supabase
    //   .from('materia_docente')
    //   .select('*')
    //   .eq('docente_id', docenteId)
    //
    // if (!materiasRestantes || materiasRestantes.length === 0) {
    //   // El docente pierde el rol de docente
    //   // TODO: Actualizar el rol del docente o su estado
    //   console.log('El docente quedó sin materias asignadas')
    // }

    // Revalidar la ruta
    // revalidatePath('/dashboard/administrativo/grillas/docentes')

    return { 
      success: true,
      mensaje: `${materiasIds.length} materia(s) desasignada(s) exitosamente`
    }
  } catch (error: any) {
    console.error('Error en desasignarMateriasDocente:', error)
    return { 
      success: false, 
      error: error.message || 'Error inesperado al desasignar materias' 
    }
  }
}
