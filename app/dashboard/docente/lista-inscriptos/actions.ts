'use server'

import { createClient } from '@/utils/supabase/server'

export interface Carrera {
  id: number
  nombre: string
  codigo: string
}

export interface Materia {
  id: number
  nombre: string
  codigo_materia: string
}

export interface InscriptoData {
  legajo: string
  nombre: string
  email: string
  estado: string
}

export interface FiltrosReporte {
  carrera: string
  materia: string
  anio: number
  cuatrimestre: string
}

export interface ExportData {
  inscriptos: InscriptoData[]
  filtros: FiltrosReporte
}

/**
 * Obtiene la lista de carreras disponibles
 */
export async function obtenerCarreras(): Promise<Carrera[]> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Obteniendo carreras...')
    
    // Intentar primero con la vista carreras_con_inscriptos
    let { data, error } = await supabase
      .from('carreras_con_inscriptos')
      .select('id, nombre, codigo')
      .order('nombre')

    if (error) {
      console.warn('⚠️ Error con carreras_con_inscriptos, intentando con tabla carreras:', error)
      
      // Fallback: usar tabla carreras directamente
      const result = await supabase
        .from('carreras')
        .select('id, nombre, codigo')
        .order('nombre')
      
      data = result.data
      
      if (result.error) {
        console.error('❌ Error al obtener carreras:', result.error)
        throw new Error('Error al cargar las carreras')
      }
    }

    console.log('✅ Carreras obtenidas:', data?.length || 0)
    return data || []
    
  } catch (error) {
    console.error('❌ Error en obtenerCarreras:', error)
    return []
  }
}

/**
 * Obtiene las materias disponibles según la carrera y el rol del usuario
 */
export async function obtenerMateriasPorCarrera(
  carreraId: string, 
  userRole: 'docente' | 'administrativo'
): Promise<Materia[]> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Obteniendo materias para carrera:', carreraId, 'Role:', userRole)
    
    // Si no hay carrera específica, no podemos obtener materias
    if (!carreraId) {
      console.log('❌ No hay carrera seleccionada')
      return []
    }

    // PASO 1: Obtener plan_de_estudio_id de la carrera
    let planEstudioId: number | null = null
    
    const { data: carreraData, error: carreraError } = await supabase
      .from('carreras_con_inscriptos')
      .select('plan_de_estudio_id')
      .eq('id', carreraId)
      .single()

    if (carreraError || !carreraData?.plan_de_estudio_id) {
      console.error('❌ Error al obtener plan de la carrera:', carreraError)
      console.log('Intentando con tabla carreras directamente...')
      
      // Fallback: intentar con tabla carreras directamente
      const { data: carreraDirecta, error: carreraDirectaError } = await supabase
        .from('carreras')
        .select('plan_de_estudio_id')
        .eq('id', carreraId)
        .single()
        
      if (carreraDirectaError || !carreraDirecta?.plan_de_estudio_id) {
        console.error('❌ Error en fallback carreras:', carreraDirectaError)
        return []
      }
      
      planEstudioId = carreraDirecta.plan_de_estudio_id
    } else {
      planEstudioId = carreraData.plan_de_estudio_id
    }

    console.log('✅ Plan de estudio encontrado:', planEstudioId)

    // PASO 2: Obtener materias del plan de estudio
    const { data: planMateriaData, error: planMateriaError } = await supabase
      .from('plan_materia')
      .select(`
        materia_id,
        materias:materia_id (
          id,
          nombre,
          codigo_materia
        )
      `)
      .eq('plan_id', planEstudioId)
      .order('materias(codigo_materia)')

    if (planMateriaError) {
      console.error('❌ Error al obtener materias del plan:', planMateriaError)
      return []
    }

    console.log('📋 Materias encontradas en plan:', planMateriaData?.length || 0)

    if (!planMateriaData || planMateriaData.length === 0) {
      console.log('⚠️ No hay materias en el plan de estudio')
      return []
    }

    // PASO 3: Filtrar por rol del usuario
    if (userRole === 'docente') {
      // Para docentes: solo materias que él dicta dentro del plan
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('❌ Error al obtener usuario:', userError)
        return []
      }

      const { data: docenteData, error: docenteError } = await supabase
        .from('docentes')
        .select('id')
        .eq('email', user.email)
        .single()

      if (docenteError || !docenteData) {
        console.log('❌ No se encontró perfil de docente para:', user.email)
        return []
      }

      console.log('✅ Docente encontrado:', docenteData.id)

      // Obtener materias que dicta el docente y que están en el plan
      const materiasIds = planMateriaData.map(pm => pm.materia_id)
      
      const { data: materiasDocenteData, error: materiasDocenteError } = await supabase
        .from('materia_docente')
        .select('materia_id')
        .eq('docente_id', docenteData.id)
        .in('materia_id', materiasIds)

      if (materiasDocenteError) {
        console.error('❌ Error al obtener materias del docente:', materiasDocenteError)
        return []
      }

      console.log('👨‍🏫 Materias que dicta el docente:', materiasDocenteData?.length || 0)

      if (!materiasDocenteData || materiasDocenteData.length === 0) {
        console.log('⚠️ El docente no dicta materias en esta carrera')
        return []
      }

      // Filtrar solo las materias que dicta el docente
      const materiasDocenteIds = new Set(materiasDocenteData.map(md => md.materia_id))
      
      const materiasFiltradasDocente = planMateriaData.filter(pm => 
        materiasDocenteIds.has(pm.materia_id)
      )

      const materiasFinalesDocente = materiasFiltradasDocente
        .map(item => {
          const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias
          return materia ? {
            id: materia.id,
            nombre: materia.nombre,
            codigo_materia: materia.codigo_materia
          } : null
        })
        .filter(Boolean) as Materia[]

      console.log('✅ Materias finales para docente:', materiasFinalesDocente.length)
      return materiasFinalesDocente

    } else {
      // Para administrativos: todas las materias del plan
      const materiasFinalesAdmin = planMateriaData
        .map(item => {
          const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias
          return materia ? {
            id: materia.id,
            nombre: materia.nombre,
            codigo_materia: materia.codigo_materia
          } : null
        })
        .filter(Boolean) as Materia[]

      console.log('✅ Materias finales para administrativo:', materiasFinalesAdmin.length)
      return materiasFinalesAdmin
    }
    
  } catch (error) {
    console.error('❌ Error general en obtenerMateriasPorCarrera:', error)
    return []
  }
}

/**
 * Función principal: Obtiene inscriptos de una cursada específica
 * Basada en la estructura real: cursadas -> materia_docente -> inscripciones_cursada
 */
export async function obtenerListaInscriptos(filtros: {
  carreraId: string
  materiaId: string
  anio: number
  cuatrimestre: string
}): Promise<InscriptoData[]> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Buscando inscriptos con filtros:', filtros)
    
    // Convertir cuatrimestre a número
    const cuatrimestreNumero = parseInt(filtros.cuatrimestre)
    
    // PASO 1: Buscar la relación materia-docente correcta
    // Primero necesitamos verificar que la materia pertenece a la carrera seleccionada
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    console.log('🔗 Verificando relación Carrera → Plan → Materia...')
    
    // Obtener el plan de estudio de la carrera
    const { data: carreraData, error: carreraError } = await supabase
      .from('carreras_con_inscriptos')
      .select('plan_de_estudio_id')
      .eq('id', parseInt(filtros.carreraId))
      .single()

    if (carreraError || !carreraData) {
      console.log('❌ No se encontró la carrera o su plan de estudio')
      return []
    }

    console.log('📋 Plan de estudio de la carrera:', carreraData.plan_de_estudio_id)

    // Verificar que la materia pertenece a este plan de estudio
    const { data: planMateriaData, error: planMateriaError } = await supabase
      .from('plan_materia')
      .select('materia_id')
      .eq('plan_id', carreraData.plan_de_estudio_id)
      .eq('materia_id', parseInt(filtros.materiaId))
      .single()

    if (planMateriaError || !planMateriaData) {
      console.log('❌ La materia no pertenece al plan de estudio de la carrera seleccionada')
      return []
    }

    console.log('✅ La materia pertenece al plan de estudio')

    // Obtener el docente actual
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('email', user.email)
      .single()

    console.log('👨‍🏫 Docente logueado:', docenteData ? 
      `${docenteData.nombre} ${docenteData.apellido} (ID: ${docenteData.id})` : 
      'No encontrado o no es docente')

    // Buscar la relación materia_docente
    let materiaDocenteQuery = supabase
      .from('materia_docente')
      .select('id, materia_id, docente_id')
      .eq('materia_id', parseInt(filtros.materiaId))

    // Si es docente, filtrar por su ID
    if (!docenteError && docenteData) {
      console.log('🔍 Filtrando por docente_id:', docenteData.id)
      materiaDocenteQuery = materiaDocenteQuery.eq('docente_id', docenteData.id)
    }

    const { data: materiaDocenteData, error: materiaDocenteError } = await materiaDocenteQuery

    // Debug: mostrar todas las relaciones materia_docente para esta materia
    const { data: todasRelaciones, error: relacionesError } = await supabase
      .from('materia_docente')
      .select(`
        id, materia_id, docente_id,
        docentes:docente_id (nombre, apellido, email),
        materias:materia_id (nombre, codigo_materia)
      `)
      .eq('materia_id', parseInt(filtros.materiaId))

    console.log('📋 Todas las relaciones materia_docente para esta materia:')
    todasRelaciones?.forEach(r => {
      const materia = Array.isArray(r.materias) ? r.materias[0] : r.materias
      const docente = Array.isArray(r.docentes) ? r.docentes[0] : r.docentes
      console.log(`  - ID: ${r.id}, Docente: ${docente?.nombre} ${docente?.apellido} (ID: ${r.docente_id})`)
    })

    // Determinar qué materia_docente_id usar
    let materiaDocenteId: number

    if (materiaDocenteError || !materiaDocenteData || materiaDocenteData.length === 0) {
      console.log('❌ No se encontró relación materia-docente para el docente actual')
      
      // Si es administrativo, usar la primera relación disponible
      if (docenteError || !docenteData) {
        console.log('🔄 Como es administrativo, usando la primera relación disponible...')
        if (todasRelaciones && todasRelaciones.length > 0) {
          materiaDocenteId = todasRelaciones[0].id
          console.log('📌 Usando relación:', materiaDocenteId)
        } else {
          console.log('❌ No hay ninguna relación materia-docente disponible')
          return []
        }
      } else {
        console.log('💡 El docente actual no está asignado a esta materia')
        return []
      }
    } else {
      // Relación encontrada para el docente
      materiaDocenteId = materiaDocenteData[0].id
      console.log('✅ Usando relación del docente logueado:', materiaDocenteId)
    }

    // PASO 2: Buscar cursada (sin filtrar por estado)
    // Primero, veamos qué cursadas existen para esta materia_docente
    
    const { data: todasCursadas, error: todasCursadasError } = await supabase
      .from('cursadas')
      .select('id, anio, cuatrimestre, estado, materia_docente_id')
      .eq('materia_docente_id', materiaDocenteId)

    console.log('📅 Todas las cursadas para materia_docente_id', materiaDocenteId + ':', 
      todasCursadas?.map(c => `Año ${c.anio} - Cuatr ${c.cuatrimestre} (${c.estado})`) || 'ninguna')
    
    const { data: cursadaData, error: cursadaError } = await supabase
      .from('cursadas')
      .select('id, estado')
      .eq('materia_docente_id', materiaDocenteId)
      .eq('anio', filtros.anio)
      .eq('cuatrimestre', cuatrimestreNumero)
      .single()

    if (cursadaError || !cursadaData) {
      console.log('❌ No se encontró cursada para los parámetros especificados')
      console.log('Parámetros de búsqueda:', {
        materia_docente_id: materiaDocenteId,
        anio: filtros.anio,
        cuatrimestre: cuatrimestreNumero
      })
      console.log('💡 Sugerencias:')
      console.log('  1. Verificar que existe una cursada creada para estos parámetros')
      console.log('  2. El docente debe crear una cursada para esta materia en el año/cuatrimestre especificado')
      console.log('  3. Verificar que el año y cuatrimestre sean correctos')
      
      // Mostrar años y cuatrimestres disponibles para este docente
      const { data: cursadasDisponibles } = await supabase
        .from('cursadas')
        .select('anio, cuatrimestre, estado')
        .eq('materia_docente_id', materiaDocenteId)
      
      if (cursadasDisponibles && cursadasDisponibles.length > 0) {
        console.log('📅 Cursadas disponibles para este docente:')
        cursadasDisponibles.forEach(c => {
          console.log(`  - Año ${c.anio}, Cuatrimestre ${c.cuatrimestre} (${c.estado})`)
        })
      } else {
        console.log('📅 No hay cursadas creadas para este docente en esta materia')
      }
      
      return []
    }

    console.log('✅ Cursada encontrada:', cursadaData.id, 'Estado:', cursadaData.estado)

    // PASO 3: Obtener inscripciones de la cursada
    const { data: inscripcionesData, error: inscripcionesError } = await supabase
      .from('inscripciones_cursada')
      .select('alumno_id, estado')
      .eq('cursada_id', cursadaData.id)

    if (inscripcionesError) {
      console.error('Error al obtener inscripciones:', inscripcionesError)
      throw new Error('Error al obtener las inscripciones')
    }

    console.log('📋 Inscripciones encontradas:', inscripcionesData?.length || 0)
    
    if (inscripcionesData && inscripcionesData.length > 0) {
      console.log('🔍 Muestra de inscripciones:', inscripcionesData.slice(0, 3))
    }

    if (!inscripcionesData || inscripcionesData.length === 0) {
      console.log('❌ No hay inscripciones en esta cursada')
      return []
    }

    // PASO 4: Obtener datos de los alumnos
    // El alumno_id puede ser: UUID de auth.users, legajo directo, o email
    const alumnoIds = inscripcionesData.map(i => i.alumno_id)
    console.log('👥 IDs de alumnos encontrados:', alumnoIds)
    
    let usuariosFinales: any[] = []
    
    // ESTRATEGIA 1: Intentar por legajo directo (si alumno_id son números)
    const alumnoIdsNumericos = alumnoIds.filter(id => !isNaN(Number(id)))
    
    if (alumnoIdsNumericos.length > 0) {
      console.log('🔢 Intentando búsqueda por legajo directo:', alumnoIdsNumericos)
      
      const { data: usuariosPorLegajo, error: errorLegajo } = await supabase
        .from('usuarios')
        .select('legajo, nombre, apellido, email, carrera_id')
        .in('legajo', alumnoIdsNumericos)
        .eq('carrera_id', parseInt(filtros.carreraId))

      if (!errorLegajo && usuariosPorLegajo && usuariosPorLegajo.length > 0) {
        console.log('✅ Usuarios encontrados por legajo:', usuariosPorLegajo.length)
        usuariosFinales = usuariosPorLegajo
      } else {
        console.log('❌ No se encontraron usuarios por legajo:', errorLegajo)
      }
    }
    
    // ESTRATEGIA 2: Si no funcionó legajo directo, intentar con tabla Roles como puente
    if (usuariosFinales.length === 0) {
      console.log('🔗 Intentando búsqueda via tabla Roles...')
      
      // Obtener datos de Roles usando los UUIDs
      const { data: rolesData, error: rolesError } = await supabase
        .from('Roles')
        .select('email, legajo, user_id')
        .in('user_id', alumnoIds)

      if (!rolesError && rolesData && rolesData.length > 0) {
        console.log('✅ Roles encontrados:', rolesData.length)
        console.log('🔍 Muestra de roles:', rolesData.slice(0, 3))
        
        const legajos = rolesData.map(r => r.legajo).filter(Boolean)
        
        if (legajos.length > 0) {
          const { data: usuariosRoles, error: usuariosRolesError } = await supabase
            .from('usuarios')
            .select('legajo, nombre, apellido, email, carrera_id')
            .in('legajo', legajos)
            .eq('carrera_id', parseInt(filtros.carreraId))

          if (!usuariosRolesError && usuariosRoles) {
            console.log('✅ Usuarios encontrados via Roles:', usuariosRoles.length)
            usuariosFinales = usuariosRoles
          } else {
            console.log('❌ Error obteniendo usuarios via Roles:', usuariosRolesError)
          }
        }
      } else {
        console.log('❌ No se encontraron roles:', rolesError)
      }
    }
    
    // ESTRATEGIA 3: Si es por email, intentar búsqueda directa
    if (usuariosFinales.length === 0) {
      const alumnoIdsEmail = alumnoIds.filter(id => id && id.includes('@'))
      
      if (alumnoIdsEmail.length > 0) {
        console.log('📧 Intentando búsqueda por email directo:', alumnoIdsEmail)
        
        const { data: usuariosPorEmail, error: errorEmail } = await supabase
          .from('usuarios')
          .select('legajo, nombre, apellido, email, carrera_id')
          .in('email', alumnoIdsEmail)
          .eq('carrera_id', parseInt(filtros.carreraId))

        if (!errorEmail && usuariosPorEmail) {
          console.log('✅ Usuarios encontrados por email:', usuariosPorEmail.length)
          usuariosFinales = usuariosPorEmail
        } else {
          console.log('❌ No se encontraron usuarios por email:', errorEmail)
        }
      }
    }
    
    console.log('👥 Total usuarios finales encontrados:', usuariosFinales.length)

    // PASO 5: Combinar datos de inscripciones con usuarios
    const inscriptos: InscriptoData[] = usuariosFinales.map(usuario => {
      // Buscar el estado de la inscripción
      const inscripcion = inscripcionesData.find(i => 
        alumnoIds.includes(usuario.legajo?.toString()) // Buscar por legajo
      )

      // Combinar estado de inscripción con estado de cursada
      const estadoInscripcion = inscripcion?.estado || 'Sin estado'
      const estadoCursada = cursadaData.estado || 'Sin estado'
      const estadoFinal = estadoCursada === 'activa' 
        ? estadoInscripcion 
        : `${estadoInscripcion} (Cursada: ${estadoCursada})`

      return {
        legajo: usuario.legajo?.toString() || 'Sin legajo',
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        email: usuario.email || 'Sin email',
        estado: estadoFinal
      }
    })

    console.log(`✅ Retornando ${inscriptos.length} inscriptos`)
    return inscriptos

  } catch (error) {
    console.error('❌ Error en obtenerListaInscriptos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(errorMessage)
  }
}

/**
 * Genera el contenido HTML para exportar como PDF
 */
export async function generarContenidoPDF(data: ExportData): Promise<string> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    let generadoPor = user.email || 'Usuario'
    const { data: userData } = await supabase
      .from('usuarios')
      .select('nombre, apellido, rol')
      .eq('email', user.email)
      .single()

    if (userData) {
      generadoPor = `${userData.nombre} ${userData.apellido} (${userData.rol})`
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lista de Inscriptos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-section { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lista de Inscriptos por Cursada</h1>
          <h2>Sistema de Gestión Académica</h2>
        </div>
        
        <div class="info-section">
          <h3>Información del Reporte</h3>
          <div class="info-grid">
            <div><strong>Carrera:</strong> ${data.filtros.carrera}</div>
            <div><strong>Materia:</strong> ${data.filtros.materia}</div>
            <div><strong>Período:</strong> ${data.filtros.cuatrimestre}° Cuatrimestre ${data.filtros.anio}</div>
            <div><strong>Total de inscriptos:</strong> ${data.inscriptos.length}</div>
            <div><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-AR')}</div>
            <div><strong>Generado por:</strong> ${generadoPor}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Legajo</th>
              <th>Nombre y Apellido</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${data.inscriptos.map(inscripto => `
              <tr>
                <td>${inscripto.legajo}</td>
                <td>${inscripto.nombre}</td>
                <td>${inscripto.email}</td>
                <td>${inscripto.estado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Documento generado automáticamente por el Sistema de Gestión Académica</p>
          <p>Fecha y hora de generación: ${new Date().toLocaleString('es-AR')}</p>
        </div>
      </body>
      </html>
    `

    return htmlContent
  } catch (error) {
    console.error('Error al generar contenido PDF:', error)
    throw error
  }
}

/**
 * Genera el contenido CSV para exportar como Excel
 */
export async function generarContenidoCSV(data: ExportData): Promise<string> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    let generadoPor = user.email || 'Usuario'
    const { data: userData } = await supabase
      .from('usuarios')
      .select('nombre, apellido, rol')
      .eq('email', user.email)
      .single()

    if (userData) {
      generadoPor = `${userData.nombre} ${userData.apellido} (${userData.rol})`
    }

    const headers = ['Legajo', 'Nombre y Apellido', 'Email', 'Estado']
    const csvContent = [
      `Lista de Inscriptos por Cursada`,
      `Carrera: ${data.filtros.carrera}`,
      `Materia: ${data.filtros.materia}`,
      `Período: ${data.filtros.cuatrimestre}° Cuatrimestre ${data.filtros.anio}`,
      `Total de inscriptos: ${data.inscriptos.length}`,
      `Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`,
      `Generado por: ${generadoPor}`,
      '',
      headers.join(','),
      ...data.inscriptos.map(inscripto => 
        [inscripto.legajo, `"${inscripto.nombre}"`, inscripto.email, inscripto.estado].join(',')
      )
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error('Error al generar contenido CSV:', error)
    throw error
  }
}

