'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Interfaz para los datos de la carrera
 */
export interface CarreraData {
  nombre: string
  codigo: string
  departamento: string
  plan_de_estudio_id: number
}

export type CarreraCompleta = {
  id: number;
  nombre: string;
  codigo: string;
  departamento: string | null;
  duracion: string | null;
  inscriptos: number;
};



/**
 * Obtiene la lista de departamentos disponibles
 * 
 * @returns {Promise<string[]>} - Lista de departamentos disponibles
 */
export async function obtenerDepartamentos(): Promise<string[]> {
  return [
    'Agronomía',
    'Biología, Bioquímica y Farmacia',
    'Ciencias de la Administración',
    'Ciencias de la Educación',
    'Ciencias de la Salud',
    'Ciencias e Ingeniería de Computación',
    'Derecho',
    'Economía',
    'Física',
    'Geografía y Turismo',
    'Geología',
    'Humanidades',
    'Ingeniería',
    'Ingeniería Eléctrica y de Computadoras',
    'Ingeniería Química',
    'Matemática',
    'Química'
  ]
}

/**
 * Crea una nueva carrera en la base de datos
 * 
 * @param {CarreraData} data - Datos de la carrera a crear
 * @returns {Promise<{ id: number } | { error: string }>} - ID de la carrera creada o mensaje de error
 */
export async function crearCarrera(
  data: CarreraData
): Promise<{ id: number } | { error: string }> {
  try {
    // Validar datos obligatorios
    if (!data.nombre || !data.codigo || !data.plan_de_estudio_id) {
      return { 
        error: 'Faltan campos obligatorios: nombre, código y plan de estudio son requeridos' 
      }
    }

    const supabase = await createClient()
    
    // Verificar si ya existe una carrera con el mismo código
    const { data: existente, error: errorVerificacion } = await supabase
      .from('carreras')
      .select('id')
      .eq('codigo', data.codigo)
      .maybeSingle()
    
    if (errorVerificacion) {
      console.error('Error al verificar la existencia de la carrera:', errorVerificacion)
      return { error: 'Error al verificar si la carrera ya existe' }
    }
    
    if (existente) {
      return { error: 'Ya existe una carrera con el código especificado' }
    }

    // Verificar que el plan de estudio exista
    const { data: planExistente, error: errorPlan } = await supabase
      .from('plan_de_estudios')
      .select('id')
      .eq('id', data.plan_de_estudio_id)
      .maybeSingle()
    
    if (errorPlan) {
      console.error('Error al verificar el plan de estudios:', errorPlan)
      return { error: 'Error al verificar el plan de estudios' }
    }
    
    if (!planExistente) {
      return { error: 'El plan de estudios seleccionado no existe' }
    }
    
    // Insertar la nueva carrera
    const { data: nuevaCarrera, error } = await supabase
      .from('carreras')
      .insert({
        nombre: data.nombre,
        codigo: data.codigo,
        departamento: data.departamento || null,
        plan_de_estudio_id: data.plan_de_estudio_id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error al crear la carrera:', error)
      return { error: `Error al crear la carrera: ${error.message}` }
    }
    
    // Revalidar las rutas que podrían mostrar la nueva carrera
    revalidatePath('/dashboard/administrativo')
    
    return { id: nuevaCarrera.id }
    
  } catch (e) {
    console.error('Error inesperado al crear la carrera:', e)
    return { error: 'Error inesperado al crear la carrera' }
  }
}

/**
 * Verifica si ya existe una carrera con el nombre dado
 * 
 * @param {string} nombre - Nombre de la carrera a verificar
 * @returns {Promise<boolean>} - true si existe, false si no existe
 */
export async function verificarCarreraExistente(nombre: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('carreras')
      .select('*', { count: 'exact', head: true })
      .ilike('nombre', nombre)
    
    if (error) {
      console.error('Error al verificar carrera existente:', error)
      return false
    }
    
    return count !== null && count > 0
  } catch (e) {
    console.error('Error inesperado al verificar carrera existente:', e)
    return false
  }
}

/**
 * Verifica si ya existe una carrera con el código dado
 * 
 * @param {string} codigo - Código de la carrera a verificar
 * @returns {Promise<boolean>} - true si existe, false si no existe
 */
export async function verificarCodigoExistente(codigo: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('carreras')
      .select('*', { count: 'exact', head: true })
      .eq('codigo', codigo)
    
    if (error) {
      console.error('Error al verificar código existente:', error)
      return false
    }
    
    return count !== null && count > 0
  } catch (e) {
    console.error('Error inesperado al verificar código existente:', e)
    return false
  }
}

/**
 * Obtiene todas las carreras desde la vista definitiva 'vista_grilla_carreras'
 * 
 * @returns {Promise<CarreraCompleta[] | null>} - Lista de carreras o null en caso de error
 */
export async function obtenerCarreras(): Promise<CarreraCompleta[] | null> {
  try {
    const supabase = await createClient()
    
    // Consultamos la nueva y única vista 'vista_grilla_carreras'
    const { data, error } = await supabase
      .from('vista_grilla_carreras')
      .select('id, nombre, codigo, departamento, duracion, inscriptos')
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error al obtener carreras desde la vista:', error)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Error inesperado al obtener carreras:', e)
    return null
  }
}

/**
 * Obtiene los detalles de una carrera por su ID
 * 
 * @param {number} carreraId - ID de la carrera
 * @returns {Promise<Object | null>} - Datos de la carrera o null en caso de error
 */
export async function obtenerCarreraPorId(carreraId: number) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('carreras')
      .select(`
        *,
        plan_de_estudio:plan_de_estudios(*)
      `)
      .eq('id', carreraId)
      .single()
    
    if (error) {
      console.error('Error al obtener la carrera:', error)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Error inesperado al obtener carrera:', e)
    return null
  }
}

/**
 * Obtiene todos los planes de estudio disponibles
 * 
 * @returns {Promise<Array<Object> | null>} - Lista de planes de estudio o null en caso de error
 */
export async function obtenerPlanesDeEstudio() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('plan_de_estudios')
      .select('id, nombre, anio_creacion, duracion')
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
 * Genera un código único para la carrera basado en el departamento y un contador
 * 
 * @param {string} departamento - Nombre del departamento
 * @returns {Promise<string>} - Código generado para la carrera
 */
export async function generarCodigoCarrera(departamento: string): Promise<string> {
  // Obtener el prefijo del departamento (primeras letras de cada palabra)
  const prefijo = departamento
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3); // Tomar máximo 3 letras
  
  try {
    // Obtener el número de carreras existentes para ese departamento
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('carreras')
      .select('*', { count: 'exact', head: true })
      .ilike('departamento', departamento)
    
    if (error) {
      console.error('Error al contar carreras del departamento:', error)
    }
    
    // Número de carreras + 1, formateado con ceros a la izquierda (001, 002, etc.)
    const contador = String((count || 0) + 1).padStart(3, '0')
    const año = new Date().getFullYear()
    
    return `${prefijo}-${año}-${contador}`
  } catch (e) {
    console.error('Error al generar código de carrera:', e)
    
    // En caso de error, crear un código con un número aleatorio
    const random = Math.floor(100 + Math.random() * 900) // Número aleatorio entre 100 y 999
    const año = new Date().getFullYear()
    
    return `${prefijo}-${año}-${random}`
  }
}

/**
 * Elimina una carrera por su ID, verificando que no tenga estudiantes activos.
 * 
 * @param {number} carreraId - ID de la carrera a eliminar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function eliminarCarrera(
  carreraId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // 1. Verificar si la carrera tiene estudiantes activos usando la vista
    const { data: carrera, error: chequeoError } = await supabase
      .from('vista_grilla_carreras')
      .select('inscriptos')
      .eq('id', carreraId)
      .single();

    if (chequeoError) {
      console.error('Error al verificar estudiantes de la carrera:', chequeoError);
      return { error: 'Error al verificar los datos de la carrera.' };
    }

    // 2. Aplicar el criterio de aceptación
    if (carrera && carrera.inscriptos > 0) {
      return { error: 'No se puede eliminar la carrera porque tiene estudiantes activos.' };
    }
    
    // 3. Si no hay inscriptos, proceder con la eliminación desde la tabla original 'carreras'
    const { error: deleteError } = await supabase
      .from('carreras')
      .delete()
      .eq('id', carreraId)
    
    if (deleteError) {
      console.error('Error al eliminar la carrera:', deleteError)
      return { error: `Error al eliminar la carrera: ${deleteError.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al eliminar carrera:', e)
    return { error: 'Error inesperado al eliminar la carrera' }
  }
}

/**
 * Obtiene los detalles completos de una carrera, incluyendo su plan de estudios y las materias del plan.
 * 
 * @param {number} carreraId - ID de la carrera
 * @returns {Promise<Object | null>} - Datos completos de la carrera o null si no se encuentra.
 */
export async function obtenerDetallesCompletosCarrera(carreraId: number) {
  try {
    const supabase = await createClient();

    const { data: carrera, error: errorCarrera } = await supabase
      .from('carreras')
      .select(`
        id,
        nombre,
        codigo,
        departamento,
        plan_de_estudio: plan_de_estudios (
          id,
          nombre,
          anio_creacion
        )
      `)
      .eq('id', carreraId)
      .single();

    if (errorCarrera || !carrera) {
      console.error('Error al obtener la carrera:', errorCarrera);
      return null;
    }
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Verificamos si plan_de_estudio es un array y obtenemos el primer elemento.
    const plan = Array.isArray(carrera.plan_de_estudio) && carrera.plan_de_estudio.length > 0
      ? carrera.plan_de_estudio[0]
      : null;

    // Si la carrera no tiene un plan de estudios válido, devolvemos la info básica.
    if (!plan) {
        return { ...carrera, plan_de_estudio: null, materias_plan: [] };
    }
    
    const { data: materiasPlan, error: errorMaterias } = await supabase
      .from('vista_materias_plan')
      .select('*')
      // Usamos el 'id' del objeto 'plan' que extrajimos de forma segura.
      .eq('plan_id', plan.id)
      .order('anio', { ascending: true })
      .order('cuatrimestre', { ascending: true });
    // --- FIN DE LA CORRECCIÓN ---

    if (errorMaterias) {
      console.error('Error al obtener las materias del plan:', errorMaterias);
      return { ...carrera, plan_de_estudio: plan, materias_plan: [] };
    }

    // Devolvemos el objeto de carrera, pero reemplazando el array del plan con el objeto único.
    return { ...carrera, plan_de_estudio: plan, materias_plan: materiasPlan };

  } catch (e) {
    console.error('Error inesperado al obtener detalles de la carrera:', e);
    return null;
  }
}


/**
 * Actualiza los datos de una carrera existente.
 * 
 * @param {number} carreraId - ID de la carrera a actualizar
 * @param {{ departamento?: string; descripcion?: string }} data - Datos a actualizar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function actualizarCarrera(
  carreraId: number,
  data: { departamento?: string; descripcion?: string }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('carreras')
      .update({
        departamento: data.departamento,
        // Asumiendo que tu tabla 'carreras' tiene una columna 'descripcion'
        // Si no la tiene, puedes eliminar la línea siguiente.
        // descripcion: data.descripcion 
      })
      .eq('id', carreraId);

    if (error) {
      console.error('Error al actualizar la carrera:', error);
      return { error: `Error al actualizar la carrera: ${error.message}` };
    }

    revalidatePath(`/dashboard/administrativo/carreras`);
    revalidatePath(`/dashboard/administrativo/carreras/${carreraId}`);
    return { success: true };

  } catch (e) {
    console.error('Error inesperado al actualizar la carrera:', e);
    return { error: 'Error inesperado al actualizar la carrera' };
  }
}