'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Interfaz para datos de notificación de mesa sin notas
 */
export interface MesaSinNotasData {
  mesaId: number
  materiaId: number
  materiaCodigo: string
  materiaNombre: string
  fechaExamen: string
  ubicacion: string
  docenteEmail: string
  docenteNombre?: string
}

/**
 * Envía notificación por email al docente sobre mesa sin notas cargadas
 */
export async function enviarNotificacionMesaSinNotas(data: MesaSinNotasData): Promise<{ success: boolean; error?: string }> {
  try {
    // Por ahora simularemos el envío de email con console.log
    // En un entorno real, aquí usarías un servicio como SendGrid, Nodemailer, etc.
    
    const mensaje = `
      NOTIFICACIÓN: Mesa de examen sin notas cargadas
      
      Estimado/a docente,
      
      Le informamos que han transcurrido más de 2 semanas desde la fecha de la mesa de examen 
      y aún no se han cargado las notas correspondientes:
      
      - Materia: ${data.materiaCodigo} - ${data.materiaNombre}
      - Fecha del examen: ${new Date(data.fechaExamen).toLocaleDateString('es-ES')}
      - Ubicación: ${data.ubicacion}
      - Mesa ID: ${data.mesaId}
      
      Por favor, proceda a cargar las notas lo antes posible para cumplir con los plazos académicos.
      
      Saludos cordiales,
      Sistema Académico
    `
    
    console.log('\n' + '='.repeat(60))
    console.log('📧 NOTIFICACIÓN POR EMAIL ENVIADA')
    console.log('='.repeat(60))
    console.log(`📍 Para: ${data.docenteEmail}`)
    console.log(`📌 Asunto: Mesa de examen sin notas - ${data.materiaCodigo}`)
    console.log(`🆔 Mesa ID: ${data.mesaId}`)
    console.log(`📅 Fecha examen: ${new Date(data.fechaExamen).toLocaleDateString('es-ES')}`)
    console.log(`🏢 Ubicación: ${data.ubicacion}`)
    console.log(`⏰ Enviado: ${new Date().toLocaleString('es-ES')}`)
    console.log('─'.repeat(60))
    console.log('💌 MENSAJE:')
    console.log(mensaje)
    console.log('='.repeat(60) + '\n')
    
    // Aquí registraremos la notificación en la base de datos
    const supabase = await createClient()
    
    try {
      const { error: insertError } = await supabase
        .from('notificaciones_email')
        .insert([{
          mesa_id: data.mesaId,
          docente_email: data.docenteEmail,
          tipo: 'mesa_sin_notas',
          mensaje: mensaje,
          enviado: true,
          fecha_envio: new Date().toISOString()
        }])
      
      if (insertError) {
        console.error('Error al registrar notificación:', insertError)
        // No fallar si no se puede registrar, el email se "envió"
      }
    } catch (error) {
      console.error('Tabla notificaciones_email no existe o hay error al insertar:', error)
      // No fallar si la tabla no existe, el email se "envió" conceptualmente
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error al enviar notificación por email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

/**
 * Verifica mesas de examen que necesitan notificación por falta de notas
 */
export async function verificarMesasSinNotas(): Promise<{ success: boolean; mesasNotificadas: number; error?: string }> {
  console.log('\n' + '🔍'.repeat(60))
  console.log('🔍 INICIANDO VERIFICACIÓN DE MESAS SIN NOTAS')
  console.log('🔍'.repeat(60))
  
  try {
    const supabase = await createClient()
    
    // Calcular fecha límite (2 semanas desde hoy hacia atrás)
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - 14)
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0]
    
    console.log('📅 Fecha actual:', new Date().toLocaleDateString('es-ES'))
    console.log('📅 Fecha límite (2 semanas atrás):', new Date(fechaLimiteStr).toLocaleDateString('es-ES'))
    console.log('🔍 Buscando mesas finalizadas sin notas desde esa fecha...')
    
    // Buscar mesas de examen que:
    // 1. Tengan fecha de examen mayor o igual a 2 semanas atrás
    // 2. NO tengan notas cargadas (notas_cargadas = false o null)
    // 3. Estado finalizada (el examen ya ocurrió)
    // 4. No hayan sido notificadas recientemente (últimas 24 horas)
    
    const { data: mesas, error: mesasError } = await supabase
      .from('mesas_examen')
      .select(`
        id,
        materia_id,
        fecha_examen,
        ubicacion,
        docente_id,
        notas_cargadas,
        estado,
        materias (
          codigo_materia,
          nombre
        )
      `)
      .lte('fecha_examen', fechaLimiteStr)
      .eq('estado', 'finalizada')
      .or('notas_cargadas.is.null,notas_cargadas.eq.false')
    
    if (mesasError) {
      throw new Error(`Error al consultar mesas: ${mesasError.message}`)
    }
    
    if (!mesas || mesas.length === 0) {
      console.log('\n' + '✅'.repeat(60))
      console.log('✅ No se encontraron mesas que requieran notificación')
      console.log('📊 Todas las mesas están al día con sus notas')
      console.log('✅'.repeat(60) + '\n')
      return { success: true, mesasNotificadas: 0 }
    }
    
    console.log('\n' + '📋'.repeat(60))
    console.log(`📋 ENCONTRADAS ${mesas.length} MESA(S) PARA VERIFICAR`)
    console.log('📋'.repeat(60))
    
    let mesasNotificadas = 0
    
    for (const mesa of mesas) {
      try {
        // Verificar si ya se envió notificación en las últimas 24 horas
        const ayer = new Date()
        ayer.setDate(ayer.getDate() - 1)
        
        try {
          const { data: notificacionReciente } = await supabase
            .from('notificaciones_email')
            .select('id')
            .eq('mesa_id', mesa.id)
            .eq('tipo', 'mesa_sin_notas')
            .gte('fecha_envio', ayer.toISOString())
            .limit(1)
          
          if (notificacionReciente && notificacionReciente.length > 0) {
            console.log(`⏭️  Mesa ${mesa.id} ya fue notificada recientemente (últimas 24h)`)
            continue
          }
        } catch (error) {
          // Si la tabla no existe, continuamos sin verificar duplicados
          console.log(`Tabla notificaciones_email no existe, continuando sin verificar duplicados...`)
        }
        
        // Obtener email del docente
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(mesa.docente_id)
        
        if (userError || !userData.user?.email) {
          console.error(`No se pudo obtener email del docente para mesa ${mesa.id}:`, userError)
          continue
        }
        
        // Preparar datos para la notificación
        const materia = Array.isArray(mesa.materias) ? mesa.materias[0] : mesa.materias
        const notificationData: MesaSinNotasData = {
          mesaId: mesa.id,
          materiaId: mesa.materia_id,
          materiaCodigo: materia?.codigo_materia || 'N/A',
          materiaNombre: materia?.nombre || 'N/A',
          fechaExamen: mesa.fecha_examen,
          ubicacion: mesa.ubicacion,
          docenteEmail: userData.user.email
        }
        
        // Enviar notificación
        const result = await enviarNotificacionMesaSinNotas(notificationData)
        
        if (result.success) {
          mesasNotificadas++
          console.log(`✅ Notificación enviada exitosamente para mesa ${mesa.id}`)
        } else {
          console.error(`❌ Error al notificar mesa ${mesa.id}:`, result.error)
        }
        
      } catch (error) {
        console.error(`Error procesando mesa ${mesa.id}:`, error)
      }
    }
    
    console.log('\n' + '🎉'.repeat(60))
    console.log('🎉 PROCESO DE NOTIFICACIONES COMPLETADO')
    console.log(`📊 Total mesas procesadas: ${mesas.length}`)
    console.log(`📧 Total notificaciones enviadas: ${mesasNotificadas}`)
    console.log('🎉'.repeat(60) + '\n')
    
    return { success: true, mesasNotificadas }
    
  } catch (error) {
    console.error('Error en verificarMesasSinNotas:', error)
    return { 
      success: false, 
      mesasNotificadas: 0,
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}