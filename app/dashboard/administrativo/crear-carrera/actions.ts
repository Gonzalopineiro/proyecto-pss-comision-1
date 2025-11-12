'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CarreraData {
  nombre: string
  codigo: string
  departamento: string
  plan_de_estudio_id: number
  descripcion?: string
}

export type CarreraCompleta = {
  id: number;
  nombre: string;
  codigo: string;
  departamento: string | null;
  descripcion?: string | null;
  duracion: string | null;
  inscriptos: number;
};

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

export async function crearCarrera(
  data: CarreraData
): Promise<{ id: number } | { error: string }> {
  try {
    if (!data.nombre || !data.codigo || !data.plan_de_estudio_id) {
      return { 
        error: 'Faltan campos obligatorios: nombre, código y plan de estudio son requeridos' 
      }
    }

    const supabase = await createClient()
    
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
    
    const { data: nuevaCarrera, error } = await supabase
      .from('carreras')
      .insert({
        nombre: data.nombre,
        codigo: data.codigo,
        departamento: data.departamento || null,
        plan_de_estudio_id: data.plan_de_estudio_id,
        descripcion: data.descripcion || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error al crear la carrera:', error)
      return { error: `Error al crear la carrera: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    
    return { id: nuevaCarrera.id }
    
  } catch (e) {
    console.error('Error inesperado al crear la carrera:', e)
    return { error: 'Error inesperado al crear la carrera' }
  }
}

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

export async function obtenerCarreras(): Promise<CarreraCompleta[] | null> {
  try {
    const supabase = await createClient()
    
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

export async function generarCodigoCarrera(departamento: string): Promise<string> {
  const prefijo = departamento
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('carreras')
      .select('*', { count: 'exact', head: true })
      .ilike('departamento', departamento)
    
    if (error) {
      console.error('Error al contar carreras del departamento:', error)
    }
    
    const contador = String((count || 0) + 1).padStart(3, '0')
    const año = new Date().getFullYear()
    
    return `${prefijo}-${año}-${contador}`
  } catch (e) {
    console.error('Error al generar código de carrera:', e)
    
    const random = Math.floor(100 + Math.random() * 900)
    const año = new Date().getFullYear()
    
    return `${prefijo}-${año}-${random}`
  }
}

export async function eliminarCarrera(
  carreraId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    const { data: carrera, error: chequeoError } = await supabase
      .from('vista_grilla_carreras')
      .select('inscriptos')
      .eq('id', carreraId)
      .single();

    if (chequeoError) {
      console.error('Error al verificar estudiantes de la carrera:', chequeoError);
      return { error: 'Error al verificar los datos de la carrera.' };
    }

    if (carrera && carrera.inscriptos > 0) {
      return { error: 'No se puede eliminar la carrera porque tiene estudiantes activos.' };
    }
    
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
        descripcion,
        plan_de_estudio: plan_de_estudios (
          id,
          nombre,
          anio_creacion,
          duracion
        )
      `)
      .eq('id', carreraId)
      .single();

    if (errorCarrera || !carrera) {
      console.error('Error al obtener la carrera:', errorCarrera);
      return null;
    }
    
    const plan = Array.isArray(carrera.plan_de_estudio) 
      ? carrera.plan_de_estudio[0] 
      : carrera.plan_de_estudio;

    if (!plan) {
        return { ...carrera, plan_de_estudio: null, materias_plan: [] };
    }
    
    const { data: materiasPlan, error: errorMaterias } = await supabase
      .from('vista_materias_plan')
      .select('*')
      .eq('plan_id', plan.id)
      .order('anio', { ascending: true })
      .order('cuatrimestre', { ascending: true });

    if (errorMaterias) {
      console.error('Error al obtener las materias del plan:', errorMaterias);
      return { ...carrera, plan_de_estudio: plan, materias_plan: [] };
    }

    return { ...carrera, plan_de_estudio: plan, materias_plan: materiasPlan || [] };

  } catch (e) {
    console.error('Error inesperado al obtener detalles de la carrera:', e);
    return null;
  }
}

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
        descripcion: data.descripcion
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

export async function buscarMateriasDisponibles(planId: number, terminoBusqueda: string) {
    try {
        const supabase = await createClient();

        const { data: materiasEnPlan, error: errorExistentes } = await supabase
            .from('plan_materia')
            .select('materia_id')
            .eq('plan_id', planId);

        if (errorExistentes) {
            console.error("Error al buscar materias existentes en el plan:", errorExistentes);
            return [];
        }

        const idsExcluir = materiasEnPlan.map(m => m.materia_id);

        const query = supabase
            .from('materias')
            .select('id, codigo_materia, nombre, descripcion')
            .or(`codigo_materia.ilike.%${terminoBusqueda}%,nombre.ilike.%${terminoBusqueda}%`);
        
        if (idsExcluir.length > 0) {
            query.not('id', 'in', `(${idsExcluir.join(',')})`);
        }

        const { data: materiasEncontradas, error: errorBusqueda } = await query.limit(10);

        if (errorBusqueda) {
            console.error("Error al buscar materias disponibles:", errorBusqueda);
            return [];
        }

        return materiasEncontradas;

    } catch (e) {
        console.error('Error inesperado al buscar materias:', e);
        return [];
    }
}

export async function actualizarPlanDeEstudios(
  planId: number,
  materiasAAgregar: { materia_id: number, anio: number | null, cuatrimestre: number | null }[],
  planMateriaIdsAEliminar: number[]
): Promise<{ success: boolean } | { error: string }> {
    try {
        const supabase = await createClient();

        if (planMateriaIdsAEliminar.length > 0) {
            const { data: materiasAVerificar, error: checkError } = await supabase
                .from('vista_materias_plan')
                .select('estudiantes_activos, nombre_materia')
                .in('plan_materia_id', planMateriaIdsAEliminar);
            
            if (checkError) throw checkError;

            const materiaConEstudiantes = materiasAVerificar.find(m => m.estudiantes_activos > 0);
            if (materiaConEstudiantes) {
                return { error: `No se puede eliminar "${materiaConEstudiantes.nombre_materia}" porque tiene estudiantes activos.` };
            }

            const { error: deleteError } = await supabase
                .from('plan_materia')
                .delete()
                .in('id', planMateriaIdsAEliminar);

            if (deleteError) throw deleteError;
        }

        if (materiasAAgregar.length > 0) {
            const inserts = materiasAAgregar.map(m => ({
                plan_id: planId,
                materia_id: m.materia_id,
                anio: m.anio,
                cuatrimestre: m.cuatrimestre,
            }));

            const { error: insertError } = await supabase
                .from('plan_materia')
                .insert(inserts);
            
            if (insertError) throw insertError;
        }

        revalidatePath(`/dashboard/administrativo/carreras`);
        revalidatePath(`/dashboard/administrativo/carreras/${planId}`);
        return { success: true };

    } catch (e: any) {
        console.error('Error al actualizar el plan de estudios:', e);
        return { error: `Error en el servidor: ${e.message}` };
    }
}

export async function obtenerMateriasDisponiblesParaPlan(planId: number) {
    try {
        const supabase = await createClient();

        const { data: materiasEnPlan, error: errorExistentes } = await supabase
            .from('plan_materia')
            .select('materia_id')
            .eq('plan_id', planId);

        if (errorExistentes) {
            console.error("Error al obtener las materias existentes en el plan:", errorExistentes);
            return [];
        }

        const idsExcluir = materiasEnPlan.map(m => m.materia_id);

        const query = supabase
            .from('materias')
            .select('id, codigo_materia, nombre, descripcion')
            .order('nombre', { ascending: true });
        
        if (idsExcluir.length > 0) {
            query.not('id', 'in', `(${idsExcluir.join(',')})`);
        }

        const { data: materiasDisponibles, error: errorBusqueda } = await query;

        if (errorBusqueda) {
            console.error("Error al buscar materias disponibles:", errorBusqueda);
            return [];
        }

        return materiasDisponibles;

    } catch (e) {
        console.error('Error inesperado al buscar materias disponibles:', e);
        return [];
    }
}

export async function obtenerCorrelatividades(planId: number, materiaId: number) {
  try {
    const supabase = await createClient();
    const { data: cursadoRows, error: errC } = await supabase
      .from('correlatividades_cursado')
      .select('correlativa_id')
      .eq('plan_id', planId)
      .eq('materia_id', materiaId);

    const { data: finalRows, error: errF } = await supabase
      .from('correlatividades_final')
      .select('correlativa_id')
      .eq('plan_id', planId)
      .eq('materia_id', materiaId);

    if (errC) {
      console.error('Error al obtener correlativas cursado:', errC);
    }
    if (errF) {
      console.error('Error al obtener correlativas final:', errF);
    }

    const idsCursado = (cursadoRows || []).map((r: any) => r.correlativa_id);
    const idsFinal = (finalRows || []).map((r: any) => r.correlativa_id);
    const allIds = Array.from(new Set([...idsCursado, ...idsFinal]));

    let materiasMap: Record<number, any> = {};
    if (allIds.length > 0) {
      const { data: materias, error: errM } = await supabase
        .from('materias')
        .select('id, codigo_materia, nombre')
        .in('id', allIds);
      if (errM) {
        console.error('Error al obtener datos de materias correlativas:', errM);
      } else {
        materiasMap = Object.fromEntries((materias || []).map((m: any) => [m.id, m]));
      }
    }

    return {
      cursado: (cursadoRows || []).map((r: any) => ({ correlativa_id: r.correlativa_id, materia: materiasMap[r.correlativa_id] || null })),
      final: (finalRows || []).map((r: any) => ({ correlativa_id: r.correlativa_id, materia: materiasMap[r.correlativa_id] || null }))
    };
  } catch (e) {
    console.error('Error inesperado al obtener correlatividades:', e);
    return { cursado: [], final: [] };
  }
}

export async function agregarCorrelativa(planId: number, materiaId: number, correlativaId: number, tipo: 'cursado' | 'final') {
  try {
    const supabase = await createClient();
    const table = tipo === 'cursado' ? 'correlatividades_cursado' : 'correlatividades_final';
    const { data, error } = await supabase
      .from(table)
      .insert({ plan_id: planId, materia_id: materiaId, correlativa_id: correlativaId });

    if (error) {
      console.error('Error al insertar correlativa:', error);
      return { error: error.message || 'Error al agregar correlativa' };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error inesperado al agregar correlativa:', e);
    return { error: e.message || 'Error inesperado' };
  }
}

export async function quitarCorrelativa(planId: number, materiaId: number, correlativaId: number, tipo: 'cursado' | 'final') {
  try {
    const supabase = await createClient();
    const table = tipo === 'cursado' ? 'correlatividades_cursado' : 'correlatividades_final';
    const { error } = await supabase
      .from(table)
      .delete()
      .match({ plan_id: planId, materia_id: materiaId, correlativa_id: correlativaId });

    if (error) {
      console.error('Error al eliminar correlativa:', error);
      return { error: error.message || 'Error al eliminar correlativa' };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error inesperado al quitar correlativa:', e);
    return { error: e.message || 'Error inesperado' };
  }
}
