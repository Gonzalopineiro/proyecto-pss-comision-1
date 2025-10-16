'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

type LoginResult = 
  | { success: false; error: string }
  | undefined;

export async function login(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient()
  
  // Obtener el legajo y la contraseña del formulario
  const legajo = formData.get('legajo') as string
  const password = formData.get('password') as string
  
  if (!legajo || !password) {
    return {
      success: false,
      error: 'Por favor, ingresa legajo y contraseña'
    }
  }
  
  try {
    // Consultar la tabla Roles para obtener el email asociado al legajo
    const { data: roleData, error: roleError } = await supabase
      .from('Roles')
      .select('email')
      .eq('legajo', parseInt(legajo))
      .single()
    
    if (roleError) {
      console.error('Error al buscar el legajo:', roleError.message)
      return {
        success: false,
        error: 'El legajo ingresado no existe'
      }
    }
    
    if (!roleData?.email) {
      console.error('No se encontró email para el legajo:', legajo)
      return {
        success: false,
        error: 'No hay correo electrónico asociado al legajo'
      }
    }
    
    console.log('Email encontrado:', roleData.email) // Para depuración
    
    // Iniciar sesión con el email obtenido
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: roleData.email.trim(), // Asegurar que no haya espacios
      password,
    })
    
    if (authError) {
      console.error('Error de autenticación:', authError.message)
      
      // Proporcionar un mensaje de error más amigable
      if (authError.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'La contraseña es incorrecta'
        }
      }
      
      return {
        success: false,
        error: 'Error al iniciar sesión: ' + authError.message
      }
    }
    
    console.log('Inicio de sesión exitoso', authData?.user?.id)
  } catch (error) {
    console.error('Error inesperado:', error)
    return {
      success: false,
      error: 'Ha ocurrido un error inesperado al iniciar sesión'
    }
  }

  // Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      success: false,
      error: 'Error al obtener información del usuario autenticado'
    }
  }
  
  // Obtener el rol del usuario desde la tabla profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('Error al obtener el rol del usuario:', profileError)
    return {
      success: false,
      error: 'Error al obtener el rol del usuario'
    }
  }
  
  // Determinar a qué dashboard redirigir según el rol
  let redirectTo = '/login' // Valor por defecto en caso de error
  
  if (profileData?.role === 'admin') {
    redirectTo = '/dashboard/administrativo'
  } else if (profileData?.role === 'user') {
    redirectTo = '/dashboard/alumno'
  } else if (profileData?.role === 'docente') {
    redirectTo = '/dashboard/docente'
  }
  
  // Sobrescribir con redirect personalizado si se proporciona
  const customRedirect = formData.get('redirectTo') as string
  if (customRedirect) {
    redirectTo = customRedirect
  }
  
  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}