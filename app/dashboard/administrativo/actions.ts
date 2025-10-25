'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Obtener todos los administrativos
export async function obtenerAdministrativos() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('administrativos')
    .select('*')
    .order('apellido', { ascending: true })
  
  if (error) {
    console.error('Error al obtener administrativos:', error)
    return { success: false, error: error.message, data: [] }
  }
  
  return { success: true, data }
}

// Obtener un administrativo específico
export async function obtenerAdministrativo(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('administrativos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error al obtener administrativo ${id}:`, error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

// Eliminar un administrativo
export async function eliminarAdministrativo(id: string, email: string) {
  const supabase = await createClient()

  try {
    // Verificar que el usuario que realiza la petición tenga rol 'super'
    const { data: userSession, error: sessionError } = await supabase.auth.getUser()
    if (sessionError || !userSession?.user) {
      return { success: false, error: 'No hay sesión activa' }
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userSession.user.id)
      .single()

    if (callerProfileError) {
      console.error('Error al obtener perfil del usuario que realiza la acción:', callerProfileError)
      return { success: false, error: 'No se pudo verificar permisos' }
    }

    if (!callerProfile || callerProfile.role !== 'super') {
      return { success: false, error: 'Permisos insuficientes: sólo usuarios con rol super pueden eliminar administrativos' }
    }
    // Primero, eliminar de la tabla administrativos
    const { error: adminError } = await supabase
      .from('administrativos')
      .delete()
      .eq('id', id)
    
    if (adminError) {
      throw new Error(`Error al eliminar administrativo: ${adminError}`)
    }

    // Eliminar de la tabla Roles
    const { error: rolesError } = await supabase
      .from('Roles')
      .delete()
      .eq('email', email)
    
    if (rolesError) {
      console.error('Error al eliminar de Roles:', rolesError)
    }

    // Buscar y eliminar el usuario de auth usando el email
    try {
      const authResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: 'GET',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
          }
        }
      )

      if (authResponse.ok) {
        const users = await authResponse.json()
        const user = users.users?.find((u: any) => u.email === email)
        
        if (user?.id) {
          // Eliminar el usuario de auth
          const deleteResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
              }
            }
          )

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text()
            console.error('Error al eliminar usuario de auth:', errorText)
          } else {
            console.log('Usuario eliminado correctamente de auth.users')
          }
        } else {
          console.log('No se encontró el usuario en auth.users')
        }
      }
    } catch (error) {
      console.error('Error al buscar/eliminar usuario de auth:', error)
    }

    // Eliminar de la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email)
    
    if (profileError) {
      console.error('Error al eliminar perfil:', profileError)
    }
    
  // Revalidar la ruta para actualizar la lista
  revalidatePath('/dashboard/administrativo')
  return { success: true }
    
  } catch (error: any) {
    console.error('Error al eliminar administrativo:', error)
    return { success: false, error: error.message || 'Error al eliminar administrativo' }
  }
}

// Actualizar información de un administrativo
export async function actualizarAdministrativo(id: string, data: {
  nombre?: string
  apellido?: string
  dni?: string | number
  nacimiento?: string
  email?: string
  direccion?: string // Cambiado de descripcion a direccion para coincidir con la tabla
  telefono?: string
}) {
  const supabase = await createClient()
  
  // Si dni viene como string, convertirlo a número
  if (typeof data.dni === 'string') {
    data.dni = parseInt(data.dni)
  }
  
  const { error } = await supabase
    .from('administrativos')
    .update(data)
    .eq('id', id)
  
  if (error) {
    console.error(`Error al actualizar administrativo ${id}:`, error)
    return { success: false, error: error.message }
  }
  
  // Si se actualizó el email, actualizar también en la tabla profiles
  if (data.email) {
    // Primero encontramos el perfil actual
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single()
    
    if (profileData) {
      // Actualizamos el email en profiles
      await supabase
        .from('profiles')
        .update({ email: data.email })
        .eq('id', profileData.id)
      
      // Actualizar el email en auth.users requeriría permisos especiales
      // y posiblemente un endpoint específico
    }
  }
  
  // Revalidar la ruta
  revalidatePath('/dashboard/administrativo')
  revalidatePath(`/dashboard/administrativo/${id}`)
  
  return { success: true }
}