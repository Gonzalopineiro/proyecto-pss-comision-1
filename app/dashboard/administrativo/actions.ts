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
    // Primero, encontrar el ID de usuario en la tabla profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    
    // Eliminar el registro de la tabla administrativos
    const { error: adminError } = await supabase
      .from('administrativos')
      .delete()
      .eq('id', id)
    
    if (adminError) {
      return { success: false, error: `Error al eliminar administrativo: ${adminError.message}` }
    }
    
    // Si encontramos el perfil, intentamos eliminar el usuario de auth
    if (profileData?.id) {
      // Eliminar el registro de la tabla profiles
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profileData.id)
      
      // Eliminar el usuario de auth
      // Nota: esto podría requerir permisos administrativos especiales
      await supabase.auth.admin.deleteUser(profileData.id)
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