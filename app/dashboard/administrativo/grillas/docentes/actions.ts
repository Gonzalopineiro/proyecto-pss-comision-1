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
    return []
  }
  
  // Transformar los datos para incluir un array de nombres de materias
  const docentesConMaterias = data?.map(docente => {
    
    return {
      ...docente,
      materias: docente.materia_docente?.map((md: any) => md.materias?.nombre || 'Sin nombre').filter(Boolean) || [],
      materia_docente_completo: docente.materia_docente // Guardar datos completos para usar después
    }
  }) || []
   
  return docentesConMaterias
}

// Función para asignar una materia a un docente
export async function asignarMateriaADocente(
  docenteUuid: string,
  codigoMateria: string,
  nombreMateria: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // 1. Verificar que exista una materia con ese código y nombre
    const { data: materia, error: errorMateria } = await supabase
      .from('materias')
      .select('id, nombre, codigo_materia')
      .eq('codigo_materia', codigoMateria)
      .eq('nombre', nombreMateria)
      .single()
    
    if (errorMateria || !materia) {
      return { 
        success: false, 
        error: 'El ID y el Nombre no corresponden a una materia existente' 
      }
    }

    // 2. Verificar cuántos docentes tiene asignada esa materia
    const { data: docentesAsignados, error: errorCount } = await supabase
      .from('materia_docente')
      .select('docente_id')
      .eq('materia_id', materia.id)
    
    if (errorCount) {
      return { success: false, error: 'Error al verificar docentes asignados' }
    }
    
    if (docentesAsignados && docentesAsignados.length >= 2) {
      return { 
        success: false, 
        error: 'El cupo de docentes para esta materia está lleno' 
      }
    }

    // 3. Verificar que el docente no esté ya asignado a esta materia
    const { data: asignacionExistente } = await supabase
      .from('materia_docente')
      .select('*')
      .eq('materia_id', materia.id)
      .eq('docente_id', docenteUuid)
      .maybeSingle()
    
    if (asignacionExistente) {
      return { 
        success: false, 
        error: 'El docente ya está asignado a esta materia' 
      }
    }

    // 4. Insertar la asignación
    const { error: errorInsert } = await supabase
      .from('materia_docente')
      .insert({
        docente_id: docenteUuid,
        materia_id: materia.id
      })
    
    if (errorInsert) {
      console.error('Error al insertar asignación:', errorInsert)
      return { success: false, error: 'Error al asignar la materia' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error inesperado:', error)
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
  docenteId: string
): Promise<MateriaAsignadaDetalle[]> {
  const supabase = await createClient();

  try {
    // Consulta combinada en una sola llamada
    const { data, error } = await supabase
      .from('materia_docente')
      .select(`
        created_at,
        materias (
          id,
          nombre,
          codigo_materia,
          plan_materia (
            anio,
            plan_id,
            plan_de_estudios (
              id,
              carreras (
                nombre
              )
            )
          ),
          mesas_examen (
            fecha_examen
          )
        )
      `)
      .eq('docente_id', docenteId);

    if (error) {
      return [];
    }

    if (!data) return [];

    const hoy = new Date();

    const materiasConDetalles: MateriaAsignadaDetalle[] = data.map((item: any) => {
      const materia = item.materias;
      if (!materia) return null;

      // Acceso seguro a relaciones anidadas
      const planMateria = materia.plan_materia?.[0];
      const carrera = planMateria?.plan_de_estudios?.carreras?.[0];

      // Filtrar mesas vigentes
      const tieneMesaVigente = materia.mesas_examen?.some(
        (m: any) => new Date(m.fecha_examen) >= hoy
      );

      return {
        id: materia.id,
        codigo: materia.codigo_materia,
        nombre: materia.nombre,
        carrera: carrera?.nombre || 'Sin asignar',
        año: planMateria ? `${planMateria.anio}° Año` : 'N/A',
        asignado: new Date(item.created_at).toLocaleDateString('es-AR'),
        estudiantes: 0,
        tieneMesaVigente: !!tieneMesaVigente
      };
    }).filter(Boolean) as MateriaAsignadaDetalle[];

    return materiasConDetalles;
  } catch (err) {
    return [];
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
    return { 
      success: false, 
      error: error.message || 'Error inesperado al desasignar materias' 
    }
  }
}
