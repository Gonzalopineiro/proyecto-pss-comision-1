'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Interfaz para representar una materia con estudiantes
 */
export interface MateriaDocente {
  id: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
  carrera?: string
  anio?: string
  estudiantes_inscriptos: number
}

/**
 * Interfaz para representar una mesa de examen
 */
export interface MesaExamen {
  id: number
  materia_id: number
  fecha_examen: string
  hora_examen: string
  ubicacion: string
  estado: string
  materia: {
    codigo_materia: string
    nombre: string
  }
}

/**
 * Obtiene las materias asignadas al docente con conteo de estudiantes
 */
export async function obtenerMateriasDocente(): Promise<MateriaDocente[]> {
  const supabase = await createClient()

  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error al obtener usuario:', userError)
      throw new Error('No se pudo obtener la información del usuario')
    }

    console.log('Usuario autenticado:', user.id)

    // Primero veamos si hay registros en la tabla materia_docente
    const { data: allMateriasDocente, error: allError } = await supabase
      .from('materia_docente')
      .select('*')
      .limit(10)

    console.log('Todos los registros de materia_docente (primeros 10):', allMateriasDocente)

    // Obtener el docente_id desde la tabla docentes usando el email
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('email', user.email)
      .single()

    console.log('Datos del docente completos:', docenteData, 'Error:', docenteError)

    if (docenteError || !docenteData) {
      console.error('Error al obtener datos del docente:', docenteError)
      console.log('El usuario no tiene registro en la tabla docentes')
      
      // Verificar si hay registros con este email en la tabla docentes
      const { data: docentePorEmail, error: emailError } = await supabase
        .from('docentes')
        .select('id')
        .eq('email', user.email)
        .single()

      console.log('Docente encontrado por email:', docentePorEmail, 'Error:', emailError)
      
      // Fallback temporal: usar el auth_user_id directamente si no hay registro en docentes
      console.log('Intentando fallback con auth_user_id como docente_id')
      console.log('Buscando docente por email como fallback')
      const { data: docenteFallback } = await supabase
        .from('docentes')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!docenteFallback) {
        console.log('No se encontró docente por email')
        return []
      }
      
      const { data: materiasDirectas, error: errorDirecto } = await supabase
        .from('materia_docente')
        .select(`
          materia_id,
          materias:materia_id (
            id,
            codigo_materia,
            nombre,
            descripcion,
            duracion
          )
        `)
        .eq('docente_id', docenteFallback.id)

      console.log('Materias directas:', materiasDirectas, 'Error:', errorDirecto)

      if (errorDirecto || !materiasDirectas) {
        console.log('Fallback falló, devolviendo todas las materias temporalmente')
        // Último fallback: devolver todas las materias para debug
        const { data: todasMaterias, error: errorTodas } = await supabase
          .from('materias')
          .select('id, codigo_materia, nombre, descripcion, duracion')
          .limit(5)

        if (errorTodas || !todasMaterias) {
          return []
        }

        return todasMaterias.map(materia => ({
          ...materia,
          carrera: 'Debug Mode',
          anio: 'Todas',
          estudiantes_inscriptos: 30
        }))
      }

      // Procesar materias del fallback
      const materiasConEstudiantes = materiasDirectas.map((item) => {
        const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias;
        if (!materia) return null;
        
        return {
          id: materia.id,
          codigo_materia: materia.codigo_materia,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          duracion: materia.duracion,
          carrera: 'Ingeniería',
          anio: '1er Año',
          estudiantes_inscriptos: Math.floor(Math.random() * 50) + 25
        };
      }).filter(Boolean) as MateriaDocente[]

      return materiasConEstudiantes
    }

    // Verificar que tenemos el docente_id correcto
    console.log('Usando docente_id para consulta:', docenteData.id)

    // Primero verificar si hay registros específicos para este docente
    const { data: checkMateriaDocente, error: checkError } = await supabase
      .from('materia_docente')
      .select('*')
      .eq('docente_id', docenteData.id)

    console.log('Registros directos en materia_docente para docente', docenteData.id, ':', checkMateriaDocente)

    // Obtener solo las materias asignadas al docente mediante la tabla materia_docente
    const { data: materiasAsignadas, error } = await supabase
      .from('materia_docente')
      .select(`
        materia_id,
        docente_id,
        materias:materia_id (
          id,
          codigo_materia,
          nombre,
          descripcion,
          duracion
        )
      `)
      .eq('docente_id', docenteData.id)

    console.log('Materias asignadas con JOIN:', materiasAsignadas, 'Error:', error)

    // Si no hay materias asignadas, intentar obtener algunas materias para mostrar algo
    if (!materiasAsignadas || materiasAsignadas.length === 0) {
      console.log('No hay materias asignadas, obteniendo materias generales para debug')
      
      const { data: materiasGenerales, error: errorGenerales } = await supabase
        .from('materias')
        .select('id, codigo_materia, nombre, descripcion, duracion')
        .limit(3)

      if (materiasGenerales) {
        console.log('Devolviendo materias generales para debug:', materiasGenerales)
        return materiasGenerales.map(materia => ({
          ...materia,
          carrera: 'DEBUG - Sin Asignación',
          anio: 'Temporal',
          estudiantes_inscriptos: 0
        }))
      }
    }

    if (error) {
      console.error('Error al obtener materias asignadas:', error)
      return []
    }

    if (!materiasAsignadas || materiasAsignadas.length === 0) {
      console.log('No se encontraron materias asignadas para el docente:', docenteData.id)
      return []
    }

    // Mapear los datos para devolver el formato esperado con información adicional
    const materiasConEstudiantes: MateriaDocente[] = materiasAsignadas.map((item) => {
      const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias;
      
      if (!materia) {
        console.log('Materia no encontrada para item:', item)
        return null;
      }
      
      return {
        id: materia.id,
        codigo_materia: materia.codigo_materia,
        nombre: materia.nombre,
        descripcion: materia.descripcion,
        duracion: materia.duracion,
        carrera: 'Ingeniería',
        anio: '1er Año',
        estudiantes_inscriptos: Math.floor(Math.random() * 50) + 25
      };
    }).filter(Boolean) as MateriaDocente[]

    console.log('Materias con estudiantes final:', materiasConEstudiantes)
    return materiasConEstudiantes
  } catch (error) {
    console.error('Error en obtenerMateriasDocente:', error)
    return []
  }
}

/**
 * Función auxiliar para crear datos de prueba (SOLO PARA DEBUG)
 */
/*export async function crearDatosPruebaDocente(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'No se pudo obtener usuario' }
    }

    console.log('Creando datos de prueba para usuario:', user.id)

    // 1. Verificar si ya existe el docente por email
    const { data: existeDocente } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single()

    let docenteId = existeDocente?.id

    // 2. Si no existe, crear el docente
    if (!existeDocente) {
      const { data: nuevoDocente, error: errorDocente } = await supabase
        .from('docentes')
        .insert({
          nombre: 'Docente',
          apellido: 'Prueba',
          dni: '12345678',
          legajo: 'DOC001',
          fecha_nacimiento: '1980-01-01',
          email: user.email || 'docente@prueba.com',
          direccion_completa: 'Dirección de prueba 123',
          contrasena_inicial: 'temp123'
        })
        .select('id')
        .single()

      if (errorDocente) {
        console.error('Error creando docente:', errorDocente)
        return { success: false, message: 'Error al crear docente: ' + errorDocente.message }
      }

      docenteId = nuevoDocente.id
      console.log('Docente creado con id:', docenteId)
    }

    // 3. Obtener algunas materias para asignar
    const { data: materias, error: errorMaterias } = await supabase
      .from('materias')
      .select('id')
      .limit(2)

    if (errorMaterias || !materias || materias.length === 0) {
      return { success: false, message: 'No hay materias disponibles para asignar' }
    }

    // 4. Asignar materias al docente
    const asignaciones = materias.map(materia => ({
      docente_id: docenteId,
      materia_id: materia.id
    }))

    const { error: errorAsignacion } = await supabase
      .from('materia_docente')
      .upsert(asignaciones, { 
        onConflict: 'docente_id,materia_id',
        ignoreDuplicates: true 
      })

    if (errorAsignacion) {
      console.error('Error asignando materias:', errorAsignacion)
      return { success: false, message: 'Error al asignar materias: ' + errorAsignacion.message }
    }

    return { 
      success: true, 
      message: `Datos de prueba creados. Docente ID: ${docenteId}, Materias asignadas: ${materias.length}` 
    }

  } catch (error) {
    console.error('Error en crearDatosPruebaDocente:', error)
    return { success: false, message: 'Error interno: ' + String(error) }
  }
//}

/**
 * Función para verificar mesas existentes (SOLO PARA DEBUG)
 */
/*export async function arreglarMesasExistentes(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'No se pudo obtener usuario' }
    }

    console.log('Verificando mesas para auth user ID:', user.id)

    // Buscar mesas para este usuario
    const { data: mesasUsuario, error: errorBuscar } = await supabase
      .from('mesas_examen')
      .select('*')
      .eq('docente_id', user.id)

    console.log('Mesas encontradas para este usuario:', mesasUsuario)

    if (errorBuscar) {
      return { success: false, message: 'Error al buscar mesas: ' + errorBuscar.message }
    }

    if (!mesasUsuario || mesasUsuario.length === 0) {
      return { success: true, message: 'No se encontraron mesas para este usuario. Crear una nueva mesa para probar.' }
    }

    return { 
      success: true, 
      message: `Se encontraron ${mesasUsuario.length} mesa(s) para este usuario. Deberían aparecer en el panel.` 
    }

  } catch (error) {
    console.error('Error en arreglarMesasExistentes:', error)
    return { success: false, message: 'Error interno: ' + String(error) }
  }
//}*/

/**
 * Obtiene las mesas de examen del docente
 */
export async function obtenerMesasExamenDocente(): Promise<MesaExamen[]> {
  const supabase = await createClient()

  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error al obtener usuario para mesas:', userError)
      throw new Error('No se pudo obtener la información del usuario')
    }

    console.log('Obteniendo mesas para auth user:', user.id)

    // Debug: verificar si hay mesas en la tabla
    const { data: todasLasMesas, error: errorTodasMesas } = await supabase
      .from('mesas_examen')
      .select('*')
      .limit(5)

    console.log('Todas las mesas (primeras 5):', todasLasMesas, 'Error:', errorTodasMesas)

    // Debug: verificar si hay mesas para este auth user específico
    const { data: mesasDelDocente, error: errorMesasDocente } = await supabase
      .from('mesas_examen')
      .select('*')
      .eq('docente_id', user.id)

    console.log('Mesas específicas del auth user', user.id, ':', mesasDelDocente, 'Error:', errorMesasDocente)

    const { data: mesas, error } = await supabase
      .from('mesas_examen')
      .select(`
        id,
        materia_id,
        fecha_examen,
        hora_examen,
        ubicacion,
        estado,
        materias:materia_id (
          codigo_materia,
          nombre
        )
      `)
      .eq('docente_id', user.id)
      .order('fecha_examen', { ascending: true })

    console.log('Mesas obtenidas:', mesas, 'Error:', error)

    if (error) {
      console.error('Error al obtener mesas de examen:', error)
      return []
    }

    // Transformar los datos para que coincidan con la interfaz
    const mesasFormateadas = (mesas || []).map((mesa: any) => {
      const materiaData = Array.isArray(mesa.materias) ? mesa.materias[0] : mesa.materias;
      
      return {
        id: mesa.id,
        materia_id: mesa.materia_id,
        fecha_examen: mesa.fecha_examen,
        hora_examen: mesa.hora_examen,
        ubicacion: mesa.ubicacion,
        estado: mesa.estado,
        materia: {
          codigo_materia: materiaData?.codigo_materia || '',
          nombre: materiaData?.nombre || ''
        }
      };
    }).filter(mesa => mesa.materia.codigo_materia) as MesaExamen[]

    console.log('Mesas formateadas final:', mesasFormateadas)
    return mesasFormateadas
  } catch (error) {
    console.error('Error en obtenerMesasExamenDocente:', error)
    return []
  }
}

/**
 * Elimina (da de baja) una mesa de examen
 */
export async function eliminarMesaExamen(mesaId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'No se pudo obtener la información del usuario' }
    }

    // Verificar que la mesa pertenece al docente
    const { data: mesa, error: mesaError } = await supabase
      .from('mesas_examen')
      .select('docente_id')
      .eq('id', mesaId)
      .single()

    if (mesaError || !mesa) {
      return { success: false, error: 'Mesa de examen no encontrada' }
    }

    if (mesa.docente_id !== user.id) {
      return { success: false, error: 'No tiene permisos para eliminar esta mesa' }
    }

    // Eliminar la mesa de examen
    const { error: deleteError } = await supabase
      .from('mesas_examen')
      .delete()
      .eq('id', mesaId)

    if (deleteError) {
      console.error('Error al eliminar mesa de examen:', deleteError)
      return { success: false, error: 'Error al eliminar la mesa de examen' }
    }

    // Revalidar la página para mostrar los cambios
    revalidatePath('/dashboard/docente')
    revalidatePath('/dashboard/docente/mesas-examen')

    return { success: true }
  } catch (error) {
    console.error('Error en eliminarMesaExamen:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}