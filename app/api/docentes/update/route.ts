import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email, telefono, direccion } = body || {}

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta id del docente' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { status: 401 })
    }

    // Preparar datos para actualizar (solo campos no vacíos)
    const updateData: any = {}

    // Solo actualizar campos que no estén vacíos
    if (email && email.trim()) updateData.email = email.trim()
    if (telefono && telefono.trim()) updateData.telefono = telefono.trim()  
    if (direccion && direccion.trim()) updateData.direccion_completa = direccion.trim()

    // Actualizar datos del docente
    const { data, error } = await supabase
      .from('docentes')
      .update(updateData)
      .eq('id', id) // ID es UUID string, no integer
      .select()

    if (error) {
      console.error('Error al actualizar docente:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Error en la base de datos: ${error.message}` 
      }, { status: 500 })
    }

    // Registrar auditoría (opcional - comentar si no existe la tabla)
    try {
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          user_id: id,
          action: 'UPDATE_DOCENTE_DATA',
          details: {
            updated_fields: { email, telefono, direccion },
            updated_by: user.id,
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
    console.error('Error en API actualizar docente:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}