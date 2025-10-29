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
  
  console.log('=== obtenerDocentesConMaterias ===')
  console.log('Data raw:', JSON.stringify(data?.[0], null, 2)) // Ver el primer docente
  console.log('Campos disponibles en primer docente:', data?.[0] ? Object.keys(data[0]) : 'No hay datos')
  if (data?.[0]) {
    console.log('Telefono:', data[0].telefono)
    console.log('Direccion completa:', data[0].direccion_completa)
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
  fechaMesaVigente?: string  // Fecha de la mesa de examen vigente en formato legible
}

// Función para enriquecer la información de las materias de un docente
export async function obtenerInformacionMaterias(
  docenteId: string
): Promise<MateriaAsignadaDetalle[]> {
  const supabase = await createClient();

  try {
    // 1. Obtener el email del docente primero
    const { data: docenteInfo, error: errorDocenteInfo } = await supabase
      .from('docentes')
      .select('email')
      .eq('id', docenteId)
      .single();

    if (errorDocenteInfo || !docenteInfo) {
      console.error('Error al obtener info del docente:', errorDocenteInfo);
      return [];
    }

    // 2. Buscar el auth user id del docente usando su email en profiles
    const { data: profileDocente } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', docenteInfo.email)
      .single();

    if (!profileDocente) {
      console.error('No se encontró el profile para el email:', docenteInfo.email);
    }

    // 3. Consultar materias asignadas al docente
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
          )
        )
      `)
      .eq('docente_id', docenteId);

    if (error) {
      console.error('Error al obtener materias del docente:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // 4. Obtener mesas de examen vigentes del docente (solo si tiene profile)
    const hoy = new Date().toISOString().split('T')[0];
    let mesasVigentes: any[] = [];
    
    if (profileDocente) {
      const { data: mesas, error: errorMesas } = await supabase
        .from('mesas_examen')
        .select('materia_id, fecha_examen, estado')
        .eq('docente_id', profileDocente.id)
        .gte('fecha_examen', hoy)
        .eq('estado', 'programada');

      if (!errorMesas && mesas) {
        mesasVigentes = mesas;
      }
    }

    // 5. Crear mapa de mesas por materia
    const mesasPorMateria = new Map<number, any[]>();
    mesasVigentes.forEach((mesa: any) => {
      if (!mesasPorMateria.has(mesa.materia_id)) {
        mesasPorMateria.set(mesa.materia_id, []);
      }
      mesasPorMateria.get(mesa.materia_id)!.push(mesa);
    });

    // 6. Contar estudiantes por materia (inscripciones en cursadas)
    const materiasIds = data.map((item: any) => item.materias?.id).filter(Boolean);
    const estudiantesPorMateria = new Map<number, number>();

    if (materiasIds.length > 0) {
      // Obtener cursadas activas de las materias del docente
      const { data: cursadasActivas } = await supabase
        .from('cursadas')
        .select(`
          id,
          materia_docente!inner (
            materia_id
          )
        `)
        .eq('estado', 'activa')
        .in('materia_docente.materia_id', materiasIds);

      if (cursadasActivas && cursadasActivas.length > 0) {
        const cursadasIds = cursadasActivas.map(c => c.id);
        
        // Contar inscripciones aprobadas por cursada
        const { data: inscripciones } = await supabase
          .from('inscripciones_cursada')
          .select('cursada_id')
          .in('cursada_id', cursadasIds)
          .eq('estado', 'aprobada');

        if (inscripciones) {
          // Agrupar por materia_id
          cursadasActivas.forEach(cursada => {
            const materiaId = (cursada.materia_docente as any).materia_id;
            const count = inscripciones.filter(i => i.cursada_id === cursada.id).length;
            estudiantesPorMateria.set(materiaId, (estudiantesPorMateria.get(materiaId) || 0) + count);
          });
        }
      }
    }

    // 7. Construir resultado final
    const materiasConDetalles: MateriaAsignadaDetalle[] = data.map((item: any) => {
      const materia = item.materias;
      if (!materia) return null;

      const planMateria = materia.plan_materia?.[0];
      const carrera = planMateria?.plan_de_estudios?.carreras?.[0];

      // Verificar si tiene mesas vigentes
      const mesasVigentesMateria = mesasPorMateria.get(materia.id) || [];
      const tieneMesaVigente = mesasVigentesMateria.length > 0;
      
      let fechaMesaVigente: string | undefined = undefined;
      if (tieneMesaVigente) {
        const mesaMasCercana = mesasVigentesMateria.reduce((closest: any, current: any) => {
          const closestDate = new Date(closest.fecha_examen);
          const currentDate = new Date(current.fecha_examen);
          return currentDate < closestDate ? current : closest;
        });
        fechaMesaVigente = new Date(mesaMasCercana.fecha_examen).toLocaleDateString('es-AR');
      }

      return {
        id: materia.id,
        codigo: materia.codigo_materia,
        nombre: materia.nombre,
        carrera: carrera?.nombre || 'Sin asignar',
        año: planMateria ? `${planMateria.anio}° Año` : 'N/A',
        asignado: new Date(item.created_at).toLocaleDateString('es-AR'),
        estudiantes: estudiantesPorMateria.get(materia.id) || 0,
        tieneMesaVigente,
        fechaMesaVigente
      };
    }).filter(Boolean) as MateriaAsignadaDetalle[];

    return materiasConDetalles;
  } catch (err) {
    console.error('Error inesperado en obtenerInformacionMaterias:', err);
    return [];
  }
}


// Función para desasignar materias de un docente
export async function desasignarMateriasDocente(
  docenteId: string, // UUID del docente en tabla docentes
  materiasIds: number[]
): Promise<{ success: boolean; error?: string; mensaje?: string }> {
  const supabase = await createClient()

  try {
    // 1. Verificar que el docente exista y obtener su email
    const { data: docente, error: errorDocente } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('id', docenteId)
      .single()
    
    if (errorDocente || !docente) {
      return { 
        success: false, 
        error: 'El docente no existe en el sistema' 
      }
    }

    // 2. Buscar el auth user id del docente usando su email en profiles
    const { data: profileDocente } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', docente.email)
      .single();

    // 3. Verificar mesas de examen vigentes SOLO si encontramos el profile
    const hoy = new Date().toISOString().split('T')[0];
    
    if (profileDocente) {
      for (const materiaId of materiasIds) {
        const { data: mesasVigentes, error: errorMesas } = await supabase
          .from('mesas_examen')
          .select('id, fecha_examen, materia_id, estado')
          .eq('materia_id', materiaId)
          .eq('docente_id', profileDocente.id)
          .gte('fecha_examen', hoy)
          .eq('estado', 'programada')
        
        if (errorMesas) {
          console.error('Error al verificar mesas vigentes:', errorMesas)
          return { 
            success: false, 
            error: 'Error al verificar mesas de examen vigentes' 
          }
        }
        
        if (mesasVigentes && mesasVigentes.length > 0) {
          // Obtener información de la materia para mensaje descriptivo
          const { data: materia } = await supabase
            .from('materias')
            .select('nombre')
            .eq('id', materiaId)
            .single()
          
          const nombreMateria = materia?.nombre || 'la materia seleccionada';
          const fechaMesa = new Date(mesasVigentes[0].fecha_examen).toLocaleDateString('es-AR');
          
          return {
            success: false,
            error: `No puede desasignar "${nombreMateria}" porque el docente tiene una mesa de examen programada para el ${fechaMesa}`
          }
        }
      }
    }

    // 4. Eliminar las asignaciones de materia_docente
    const { error: errorDelete } = await supabase
      .from('materia_docente')
      .delete()
      .eq('docente_id', docenteId)
      .in('materia_id', materiasIds)
    
    if (errorDelete) {
      console.error('Error al eliminar asignaciones:', errorDelete)
      return { success: false, error: 'Error al desasignar materias' }
    }

    // 5. Verificar si el docente quedó sin materias
    const { data: materiasRestantes, error: errorRestantes } = await supabase
      .from('materia_docente')
      .select('id')
      .eq('docente_id', docenteId)
    
    if (errorRestantes) {
      console.error('Error al verificar materias restantes:', errorRestantes)
    }
    
    let mensajeFinal = `${materiasIds.length} materia(s) desasignada(s) exitosamente`
    
    if (!materiasRestantes || materiasRestantes.length === 0) {
      // El docente quedó sin materias, debe ser eliminado
      
      // 5.1. Eliminar de la tabla docentes
      const { error: errorDeleteDocente } = await supabase
        .from('docentes')
        .delete()
        .eq('id', docenteId)
      
      if (errorDeleteDocente) {
        console.error('Error al eliminar el docente:', errorDeleteDocente)
        return {
          success: true,
          mensaje: `${mensajeFinal}. Advertencia: No se pudo eliminar el registro del docente`
        }
      }

      // 5.2. Actualizar el rol en profiles a 'user' (si existe el profile)
      if (profileDocente) {
        const { error: errorRole } = await supabase
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', profileDocente.id)
        
        if (errorRole) {
          console.error('Error al actualizar rol del docente:', errorRole)
        }
      }
      
      mensajeFinal += '. El docente ha sido eliminado del sistema al quedar sin materias asignadas'
    }

    return { 
      success: true,
      mensaje: mensajeFinal
    }
  } catch (error: any) {
    console.error('Error inesperado en desasignarMateriasDocente:', error)
    return { 
      success: false, 
      error: error.message || 'Error inesperado al desasignar materias' 
    }
  }
}

// Función para eliminar un docente del sistema
export async function eliminarDocente(
  docenteId: string
): Promise<{ success: boolean; error?: string; mensaje?: string }> {
  const supabase = await createClient()

  try {
    // 1. Verificar que el docente exista y obtener su email
    const { data: docente, error: errorDocente } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('id', docenteId)
      .single()
    
    if (errorDocente || !docente) {
      return { 
        success: false, 
        error: 'El docente no existe en el sistema' 
      }
    }

    // 2. Buscar el auth user id del docente usando su email en profiles
    const { data: profileDocente } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', docente.email)
      .single();

    // 3. Eliminar todas las asignaciones de materia_docente
    const { error: errorDeleteAsignaciones } = await supabase
      .from('materia_docente')
      .delete()
      .eq('docente_id', docenteId)
    
    if (errorDeleteAsignaciones) {
      console.error('Error al eliminar asignaciones:', errorDeleteAsignaciones)
      return { 
        success: false, 
        error: 'Error al eliminar las asignaciones del docente' 
      }
    }

    // 4. Eliminar de la tabla docentes
    const { error: errorDeleteDocente } = await supabase
      .from('docentes')
      .delete()
      .eq('id', docenteId)
    
    if (errorDeleteDocente) {
      console.error('Error al eliminar el docente:', errorDeleteDocente)
      return { 
        success: false, 
        error: 'Error al eliminar el registro del docente' 
      }
    }

    // 5. Actualizar el rol en profiles a 'user' (si existe el profile)
    if (profileDocente) {
      const { error: errorRole } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', profileDocente.id)
      
      if (errorRole) {
        console.error('Error al actualizar rol del docente:', errorRole)
      }
    }

    return { 
      success: true,
      mensaje: `El docente ${docente.nombre} ${docente.apellido} ha sido eliminado del sistema exitosamente`
    }
  } catch (error: any) {
    console.error('Error inesperado en eliminarDocente:', error)
    return { 
      success: false, 
      error: error.message || 'Error inesperado al eliminar el docente' 
    }
  }
}
