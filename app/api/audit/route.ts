import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const supabase = await createClient()

    // Verificar autenticación y rol
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { status: 401 })
    }

    // Verificar que sea administrativo
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profileData?.role
    if (userRole !== 'admin' && userRole !== 'super') {
      return NextResponse.json({ 
        success: false, 
        error: 'Sin permisos para acceder a auditorías' 
      }, { status: 403 })
    }

    // Construir query base
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (action) {
      query = query.eq('action', action)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (search) {
      // Buscar en user_id o en los detalles (esto puede variar según tu esquema de BD)
      query = query.or(`user_id.ilike.%${search}%,action.ilike.%${search}%`)
    }

    // Aplicar paginación
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: auditLogs, error } = await query

    if (error) {
      console.error('Error al obtener auditorías:', error)
      
      // Si la tabla no existe, devolver datos vacíos en lugar de error
      if (error.message.includes('audit_log') && error.message.includes('schema cache')) {
        console.warn('Tabla audit_log no existe, devolviendo datos vacíos')
        return NextResponse.json({ 
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0
          },
          warning: 'Sistema de auditoría no configurado. Contacte al administrador para crear la tabla audit_log.'
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener auditorías: ' + error.message 
      }, { status: 500 })
    }

    // Obtener el total de registros para paginación
    let countQuery = supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })

    // Aplicar los mismos filtros para el conteo
    if (action) countQuery = countQuery.eq('action', action)
    if (userId) countQuery = countQuery.eq('user_id', userId)
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom)
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo)
    if (search) countQuery = countQuery.or(`user_id.ilike.%${search}%,action.ilike.%${search}%`)

    const { count, error: countError } = await countQuery

    // Si hay error en el conteo, usar 0
    const totalCount = countError ? 0 : (count || 0)

    return NextResponse.json({ 
      success: true,
      data: auditLogs || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error: any) {
    console.error('Error en API de auditorías:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}