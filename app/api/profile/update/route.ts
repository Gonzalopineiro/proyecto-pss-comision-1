import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, telefono, direccion } = body || {}

    const supabase = await createClient()

    // Verificar autenticación y obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { status: 401 })
    }

    // Obtener el rol del usuario para saber en qué tabla actualizar
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profileData?.role || 'user'
    console.log('🔧 Actualizando perfil:', { email: user.email, role: userRole })

    // Determinar la tabla correcta según el rol
    let tableName = 'usuarios' // Por defecto para estudiantes
    if (userRole === 'admin' || userRole === 'super') {
      tableName = 'administrativos'
    } else if (userRole === 'docente') {
      tableName = 'docentes'
    }

    // Preparar datos para actualizar (solo campos no vacíos)
    const updateData: any = {}

    // Solo actualizar campos que no estén vacíos
    if (email && email.trim()) updateData.email = email.trim()
    if (telefono && telefono.trim()) updateData.telefono = telefono.trim()  
    if (direccion && direccion.trim()) updateData.direccion = direccion.trim()

    // Agregar updated_at solo si la tabla la tiene (usuarios la tiene, verificar otros)
    if (tableName === 'usuarios') {
      updateData.updated_at = new Date().toISOString()
    }

    // Actualizar SOLO los datos del usuario autenticado en la tabla correcta
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('email', user.email)
      .select()

    if (error) {
      console.error('Error al actualizar perfil:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Error en la base de datos: ${error.message}` 
      }, { status: 500 })
    }

    // Registrar auditoría (opcional - comentar si no existe la tabla)
    try {
      // Obtener el ID del usuario de la tabla usuarios para la auditoría
      const userId = data?.[0]?.id || user.email
      
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          user_id: userId,
          action: 'UPDATE_OWN_PROFILE',
          details: {
            auth_user_id: user.id,
            updated_fields: { email, telefono, direccion },
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })

      if (auditError) {
        console.warn('Error al registrar auditoría (tabla puede no existir):', auditError)
      }
    } catch (auditErr) {
      console.warn('Auditoría no disponible:', auditErr)
    }

    return NextResponse.json({ 
      success: true,
      data: data?.[0] || null
    })

  } catch (error: any) {
    console.error('Error en API actualizar perfil:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}