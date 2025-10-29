'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

interface PlanDeEstudiosData {
  nombre: string
  anio_creacion: number
  duracion: string
  descripcion?: string
  codigo?: string
}

export interface MateriaData {
  id: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
  created_at?: string
}

interface PlanMateriaData {
  materia_id: number
  anio: number
  cuatrimestre: number
  codigo_plan_materia?: string
}

/**
 * Crea un nuevo plan de estudios en Supabase
 * 
 * @param {PlanDeEstudiosData} data - Datos del plan de estudios
 * @returns {Promise<{ id: number } | { error: string }>} - ID del plan creado o mensaje de error
 */
export async function crearPlanDeEstudios(data: PlanDeEstudiosData): Promise<{ id: number } | { error: string }> {
  try {
    // Validar que los campos requeridos existan
    if (!data.nombre || !data.anio_creacion || !data.duracion) {
      return { error: 'Faltan campos requeridos para crear el plan de estudios' }
    }

    // Crear cliente de Supabase
    const supabase = await createClient()

    // Insertar en la tabla plan_de_estudios
    const { data: planCreado, error } = await supabase
      .from('plan_de_estudios')
      .insert({
        nombre: data.nombre,
        anio_creacion: data.anio_creacion,
        duracion: data.duracion
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear plan de estudios:', error)
      return { error: `Error al crear plan de estudios: ${error.message}` }
    }

    if (!planCreado) {
      return { error: 'No se pudo crear el plan de estudios' }
    }

    // Revalidar la ruta después de la actualización
    revalidatePath('/dashboard/administrativo')
    
    return { id: planCreado.id }
    
  } catch (e) {
    console.error('Error inesperado al crear plan de estudios:', e)
    return { error: 'Error inesperado al crear plan de estudios' }
  }
}

/**
 * Verifica si ya existe un plan de estudios con el nombre dado
 * 
 * @param {string} nombre - Nombre del plan de estudios a verificar
 * @returns {Promise<boolean>} - true si existe, false si no existe
 */
export async function verificarPlanExistente(nombre: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error, count } = await supabase
      .from('plan_de_estudios')
      .select('*', { count: 'exact', head: true })
      .eq('nombre', nombre)
    
    if (error) {
      console.error('Error al verificar plan existente:', error)
      return false
    }
    
    return count !== null && count > 0
  } catch (e) {
    console.error('Error inesperado al verificar plan existente:', e)
    return false
  }
}

/**
 * Obtiene todos los planes de estudio
 * 
 * @returns {Promise<Array<Object> | null>} - Lista de planes de estudio o null en caso de error
 */
export async function obtenerPlanesDeEstudio() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('plan_de_estudios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al obtener planes de estudio:', error)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Error inesperado al obtener planes de estudio:', e)
    return null
  }
}

/**
 * Obtiene todas las materias disponibles
 * 
 * @returns {Promise<MateriaData[] | null>} - Lista de materias o null en caso de error
 */
export async function obtenerMaterias(): Promise<MateriaData[] | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error al obtener materias:', error)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Error inesperado al obtener materias:', e)
    return null
  }
}

/**
 * Genera un código único para una materia dentro de un plan
 * 
 * @param {string} codigoPlan - Código del plan (ej: DCIC-01)
 * @param {number} contador - Contador de materias para este plan
 * @returns {string} - Código único en formato DCIC-01-MAT001
 */
export async function generarCodigoMateriaPlan(codigoPlan: string, contador: number): Promise<string> {
  const numeroMateria = contador.toString().padStart(3, '0')
  return `${codigoPlan}-MAT${numeroMateria}`
}

/**
 * Asocia una materia a un plan de estudios
 * 
 * @param {number} planId - ID del plan de estudios
 * @param {string} codigoPlan - Código del plan de estudios
 * @param {PlanMateriaData} materiaData - Datos de la materia a asociar
 * @param {number} ordenMateria - Orden de la materia dentro del plan
 * @returns {Promise<{ id: number } | { error: string }>} - ID de la relación creada o mensaje de error
 */
export async function asociarMateriaAPlan(
  planId: number, 
  codigoPlan: string,
  materiaData: PlanMateriaData,
  ordenMateria: number
): Promise<{ id: number } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Verificar si la materia ya está asociada al plan
    const { data: existente, error: errorCheck } = await supabase
      .from('plan_materia')
      .select('id')
      .eq('plan_id', planId)
      .eq('materia_id', materiaData.materia_id)
      .maybeSingle()
    
    if (errorCheck) {
      console.error('Error al verificar materia existente:', errorCheck)
      return { error: 'Error al verificar materia existente' }
    }
    
    if (existente) {
      return { error: 'Esta materia ya está asociada al plan' }
    }
    
    // Generar código único para la materia en este plan
    const codigoMateriaEnPlan = generarCodigoMateriaPlan(codigoPlan, ordenMateria)
    
    // Insertar la relación plan-materia
    const { data, error } = await supabase
      .from('plan_materia')
      .insert({
        plan_id: planId,
        materia_id: materiaData.materia_id,
        codigo_plan_materia: codigoMateriaEnPlan,
        anio: materiaData.anio,
        cuatrimestre: materiaData.cuatrimestre
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error al asociar materia al plan:', error)
      return { error: `Error al asociar materia al plan: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { id: data.id }
    
  } catch (e) {
    console.error('Error inesperado al asociar materia:', e)
    return { error: 'Error inesperado al asociar materia al plan' }
  }
}

/**
 * Obtiene las materias asociadas a un plan específico
 * 
 * @param {number} planId - ID del plan de estudios
 * @returns {Promise<Array<Object> | null>} - Lista de materias asociadas o null en caso de error
 */
export async function obtenerMateriasDePlan(planId: number) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('plan_materia')
      .select(`
        id,
        codigo_plan_materia,
        anio,
        cuatrimestre,
        materias (
          id,
          nombre,
          descripcion,
          duracion
        )
      `)
      .eq('plan_id', planId)
      .order('anio', { ascending: true })
      .order('cuatrimestre', { ascending: true })
    
    if (error) {
      console.error('Error al obtener materias del plan:', error)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Error inesperado al obtener materias del plan:', e)
    return null
  }
}

/**
 * Crea cursadas automáticamente para todas las materias de un plan
 * 
 * @param {number} planId - ID del plan de estudios
 * @param {number} anioAcademico - Año académico para las cursadas (por defecto el año actual)
 * @returns {Promise<{ success: boolean; cursadasCreadas: number } | { error: string }>}
 */
export async function crearCursadasParaPlan(
  planId: number,
  anioAcademico?: number
): Promise<{ success: boolean; cursadasCreadas: number } | { error: string }> {
  try {
    const supabase = await createClient();
    const anio = anioAcademico || new Date().getFullYear();

    // 1. Obtener todas las materias del plan
    const { data: materiasPlan, error: errorMaterias } = await supabase
      .from('plan_materia')
      .select(`
        id,
        materia_id,
        anio,
        cuatrimestre,
        materias (
          id,
          nombre,
          codigo_materia
        )
      `)
      .eq('plan_id', planId);

    if (errorMaterias || !materiasPlan) {
      console.error('Error al obtener materias del plan:', errorMaterias);
      return { error: 'No se pudieron obtener las materias del plan' };
    }

    if (materiasPlan.length === 0) {
      return { error: 'El plan no tiene materias asociadas' };
    }

    // 2. Para cada materia, buscar si tiene docentes asignados
    const cursadasParaCrear = [];
    
    for (const materiaPlan of materiasPlan) {
      // Buscar docentes asignados a esta materia
      const { data: materiasDocente, error: errorDocentes } = await supabase
        .from('materia_docente')
        .select('id')
        .eq('materia_id', materiaPlan.materia_id);

      if (errorDocentes) {
        console.error(`Error al buscar docentes para materia ${materiaPlan.materia_id}:`, errorDocentes);
        continue;
      }

      // Si tiene docentes asignados, crear cursadas para cada uno
      if (materiasDocente && materiasDocente.length > 0) {
        for (const materiaDocente of materiasDocente) {
          // Verificar que no exista ya una cursada para este año y cuatrimestre
          const { data: cursadaExistente } = await supabase
            .from('cursadas')
            .select('id')
            .eq('materia_docente_id', materiaDocente.id)
            .eq('anio', anio)
            .eq('cuatrimestre', materiaPlan.cuatrimestre)
            .maybeSingle();

          if (!cursadaExistente) {
            cursadasParaCrear.push({
              materia_docente_id: materiaDocente.id,
              anio: anio,
              cuatrimestre: materiaPlan.cuatrimestre,
              cupo_maximo: 50, // Valor por defecto
              estado: 'activa'
            });
          }
        }
      } else {
        console.warn(`Materia ID: ${materiaPlan.materia_id} no tiene docentes asignados. No se creará cursada.`);
      }
    }

    // 3. Crear todas las cursadas de una vez
    if (cursadasParaCrear.length === 0) {
      return { error: 'No se pudieron crear cursadas. Asegúrate de que las materias tengan docentes asignados.' };
    }

    const { data: cursadasCreadas, error: errorCreacion } = await supabase
      .from('cursadas')
      .insert(cursadasParaCrear)
      .select();

    if (errorCreacion) {
      console.error('Error al crear cursadas:', errorCreacion);
      return { error: `Error al crear cursadas: ${errorCreacion.message}` };
    }

    console.log(`Cursadas creadas exitosamente: ${cursadasCreadas?.length || 0}`);
    revalidatePath('/dashboard/administrativo');
    
    return { 
      success: true, 
      cursadasCreadas: cursadasCreadas?.length || 0 
    };

  } catch (e) {
    console.error('Error inesperado al crear cursadas:', e);
    return { error: 'Error inesperado al crear cursadas para el plan' };
  }
}

/**
 * Obtiene información sobre las cursadas existentes para un plan específico
 * 
 * @param {number} planId - ID del plan de estudios
 * @param {number} anioAcademico - Año académico a consultar
 * @returns {Promise<{ materiasConCursadas: number; materiasTotal: number; cursadasTotal: number } | { error: string }>}
 */
export async function obtenerInfoCursadasPlan(
  planId: number,
  anioAcademico?: number
): Promise<{ materiasConCursadas: number; materiasTotal: number; cursadasTotal: number } | { error: string }> {
  try {
    const supabase = await createClient();
    const anio = anioAcademico || new Date().getFullYear();

    // 1. Obtener todas las materias del plan
    const { data: materiasPlan, error: errorMaterias } = await supabase
      .from('plan_materia')
      .select('materia_id')
      .eq('plan_id', planId);

    if (errorMaterias || !materiasPlan) {
      return { error: 'No se pudieron obtener las materias del plan' };
    }

    // 2. Para cada materia, verificar si tiene cursadas activas para el año
    let materiasConCursadas = 0;
    let cursadasTotal = 0;

    for (const materiaPlan of materiasPlan) {
      const { data: cursadas, error: errorCursadas } = await supabase
        .from('cursadas')
        .select(`
          id,
          materia_docente!inner(materia_id)
        `)
        .eq('materia_docente.materia_id', materiaPlan.materia_id)
        .eq('anio', anio);

      if (!errorCursadas && cursadas && cursadas.length > 0) {
        materiasConCursadas++;
        cursadasTotal += cursadas.length;
      }
    }

    return {
      materiasConCursadas,
      materiasTotal: materiasPlan.length,
      cursadasTotal
    };

  } catch (e) {
    console.error('Error al obtener información de cursadas:', e);
    return { error: 'Error inesperado al obtener información de cursadas' };
  }
}

/**
 * Desasocia una materia de un plan de estudios.
 * 
 * @param {number} planMateriaId - El ID de la relación en la tabla 'plan_materia'
 * @returns {Promise<{ success: boolean } | { error: string }>}
 */
export async function desasociarMateriaDePlan(
  planMateriaId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient();
    
    // Antes de eliminar, necesitamos verificar si la materia tiene alumnos inscriptos
    const { data: materiaPlan, error: fetchError } = await supabase
      .from('vista_materias_plan')
      .select('estudiantes_activos')
      .eq('plan_materia_id', planMateriaId)
      .single();

    if (fetchError || !materiaPlan) {
      return { error: 'No se encontró la materia en el plan.' };
    }

    // Regla de negocio: No se puede eliminar si hay estudiantes.
    if (materiaPlan.estudiantes_activos > 0) {
      return { error: 'No se puede eliminar una materia con estudiantes activos.' };
    }
    
    // Si no hay estudiantes, proceder a eliminar la asociación.
    const { error: deleteError } = await supabase
      .from('plan_materia')
      .delete()
      .eq('id', planMateriaId);

    if (deleteError) {
      console.error('Error al desasociar la materia:', deleteError);
      return { error: `Error al desasociar la materia: ${deleteError.message}` };
    }

    revalidatePath('/dashboard/administrativo'); // Revalida para refrescar los datos
    return { success: true };

  } catch (e) {
    console.error('Error inesperado al desasociar materia:', e);
    return { error: 'Error inesperado al desasociar materia del plan.' };
  }
}