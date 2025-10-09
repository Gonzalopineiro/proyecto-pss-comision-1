'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  // Obtener el legajo y la contraseña del formulario
  const legajo = formData.get('legajo') as string
  const password = formData.get('password') as string
  
  if (!legajo || !password) {
    console.error('Faltan credenciales: legajo o contraseña')
    redirect('/error')
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
      redirect('/error')
    }
    
    if (!roleData?.email) {
      console.error('No se encontró email para el legajo:', legajo)
      redirect('/error')
    }
    
    console.log('Email encontrado:', roleData.email) // Para depuración
    
    // Iniciar sesión con el email obtenido
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: roleData.email.trim(), // Asegurar que no haya espacios
      password,
    })
    
    if (authError) {
      console.error('Error de autenticación:', authError.message)
      // Proporcionar más detalles sobre el error
      if (authError.message.includes('Invalid login credentials')) {
        console.error('Credenciales inválidas. Verifica que:')
        console.error('1. La contraseña sea correcta')
        console.error('2. El email (' + roleData.email + ') esté registrado en Auth')
        console.error('3. El usuario esté activo en la plataforma de autenticación')
      }
      redirect('/error')
    }
    
    console.log('Inicio de sesión exitoso', authData?.user?.id)
  } catch (error) {
    console.error('Error inesperado:', error)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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