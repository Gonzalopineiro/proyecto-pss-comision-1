'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface AdminFormData {
  nombre: string
  apellido: string
  dni: string
  legajo: string
  fechaNacimiento: string
  email: string
  direccion: string
  telefono: string
  contrasenaTemporal: string
}

export async function registrarAdministrativo(formData: AdminFormData) {
  try {
    const supabase = await createClient()
    
    // Verificar permisos antes de continuar - usar getUser() por seguridad
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return { success: false, error: 'No hay sesión activa o usuario autenticado' }
    }
    
    // Verificar que el usuario actual sea administrador
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()
      console.log('Perfil del usuario actual:', currentUserProfile) // Para depuración
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para realizar esta acción' }
    }
    
    // Verificar que el email no exista ya en auth.users
    const { data: existingUserCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.email)
      .single()
      
    if (existingUserCheck) {
      return { success: false, error: 'El email ya está registrado en el sistema' }
    }
    
    // Crear el usuario usando signUp pero guardando la sesión actual del administrador
    // Usamos el DNI como contraseña
    const password = formData.dni + "";
    
    // Guardar la sesión actual del administrador antes de crear el nuevo usuario
    const { data: currentSession } = await supabase.auth.getSession()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          role: 'admin'
        }
      }
    })
    
    // Confirmar el email automáticamente si el usuario fue creado
    if (authData.user && !authData.user.email_confirmed_at) {
      // Intentar confirmar el email automáticamente usando la API admin
      try {
        await supabase.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true
        })
      } catch (confirmError) {
        console.log('No se pudo confirmar automáticamente el email:', confirmError)
        // Continuamos sin bloquear el proceso
      }
    }
    
    // Restaurar la sesión del administrador después de crear el nuevo usuario
    if (currentSession?.session) {
      await supabase.auth.setSession(currentSession.session)
    }

    if (authError || !authData.user) {
      console.error('Error al crear usuario:', authError)
      return { 
        success: false, 
        error: `No se pudo crear la cuenta: ${authError?.message || 'Error desconocido'}` 
      }
    }
    
    // Almacenamos la contraseña usada para mostrarla después
    const passwordUsed = password;

    const userId = authData.user.id

    // Insertar en la tabla profiles con rol admin
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: formData.email,
        role: 'admin'
      })

    if (profileError) {
      // Si hay error, intentamos eliminar el usuario creado, aunque no tengamos permisos de admin
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (err) {
        console.error('No se pudo eliminar el usuario:', err)
        // Continuamos aunque falle la limpieza
      }
      return { 
        success: false, 
        error: `Error al crear el perfil: ${profileError.message}` 
      }
    }
    
    // Insertar en la tabla Roles para el mapeo de legajo a email (para inicio de sesión por legajo)
    const { error: rolesError } = await supabase
      .from('Roles')
      .insert({
        legajo: parseInt(formData.legajo),
        email: formData.email
      })
      
    if (rolesError) {
      console.error('Error al insertar en Roles:', rolesError)
      // No bloqueamos el flujo por este error, pero lo registramos
    } else {
      console.log(`Registro agregado a Roles: legajo ${formData.legajo} mapeado a email ${formData.email}`)
    }

    // Insertar en la tabla administrativos
    const { error: adminError } = await supabase
      .from('administrativos')
      .insert({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: parseInt(formData.dni),
        legajo: parseInt(formData.legajo),
        nacimiento: formData.fechaNacimiento,
        email: formData.email,
        direccion: formData.direccion, // El campo en la base de datos ahora se llama direccion
        telefono: formData.telefono
      })

    if (adminError) {
      // Si hay error, intentar limpiar los datos creados
      // Eliminar de profiles
      await supabase.from('profiles').delete().eq('id', userId)
      
      // Eliminar de Roles
      await supabase.from('Roles').delete().eq('email', formData.email)
      
      // Intentar eliminar el usuario (aunque puede fallar por permisos)
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (err) {
        console.error('No se pudo eliminar el usuario:', err)
      }
      
      return { 
        success: false, 
        error: `Error al registrar administrativo: ${adminError.message}` 
      }
    }

    // Revalidar la ruta para actualizar la lista de administrativos
    revalidatePath('/dashboard/administrativo')
    return { 
      success: true, 
      userId,
      mensaje: `Administrador ${formData.nombre} ${formData.apellido} creado exitosamente`,
      passwordUsed, // Devolvemos la contraseña usada (DNI + sufijo)
      details: {
        auth: true,
        profiles: true,
        roles: true,
        administrativos: true,
        legajo: parseInt(formData.legajo),
        email: formData.email
      }
    }
    
  } catch (error: any) {
    console.error('Error al registrar administrativo:', error)
    return { 
      success: false, 
      error: error.message || 'Ocurrió un error al registrar el administrativo' 
    }
  }
}

interface VerificacionResult {
  duplicado: boolean;
  campo?: 'email' | 'legajo';
  mensaje?: string;
}

// Función para verificar si un email o legajo ya existe
export async function verificarDuplicados(email: string, legajo: string): Promise<VerificacionResult> {
  const supabase = await createClient()
  
  // Verificar si el email ya existe en administrativos
  const { data: emailExistsAdmin } = await supabase
    .from('administrativos')
    .select('id')
    .eq('email', email)
    .single()

  if (emailExistsAdmin) {
    return { duplicado: true, campo: 'email', mensaje: 'El email ya está registrado en administrativos' }
  }

  // Verificar si el email ya existe en Roles
  const { data: emailExistsRoles } = await supabase
    .from('Roles')
    .select('id')
    .eq('email', email)
    .single()

  if (emailExistsRoles) {
    return { duplicado: true, campo: 'email', mensaje: 'El email ya está registrado para otro legajo' }
  }

  // Verificar si el legajo ya existe en administrativos
  const { data: legajoExistsAdmin } = await supabase
    .from('administrativos')
    .select('id')
    .eq('legajo', parseInt(legajo))
    .single()

  if (legajoExistsAdmin) {
    return { duplicado: true, campo: 'legajo', mensaje: 'El número de legajo ya está en uso por otro administrativo' }
  }

  // Verificar si el legajo ya existe en Roles
  const { data: legajoExistsRoles } = await supabase
    .from('Roles')
    .select('id')
    .eq('legajo', parseInt(legajo))
    .single()

  if (legajoExistsRoles) {
    return { duplicado: true, campo: 'legajo', mensaje: 'El número de legajo ya está asignado a otro email' }
  }

  return { duplicado: false }
}

// Función para obtener la lista de administrativos
export async function obtenerAdministrativos() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('administrativos')
    .select('*')
    .order('apellido', { ascending: true })
  
  if (error) {
    console.error('Error al obtener administrativos:', error)
    return []
  }
  
  return data
}

// Función para verificar que el usuario actual tenga permisos de administrador
export async function verificarPermisosAdmin() {
  const supabase = await createClient()
  
  // Obtener el usuario autenticado usando getUser() por seguridad
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData.user) {
    return { autorizado: false, mensaje: 'Usuario no autenticado' }
  }
  
  // Obtener el perfil del usuario
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  
  if (error || !profile) {
    return { autorizado: false, mensaje: 'No se pudo verificar los permisos' }
  }
  
  // Verificar si el usuario tiene rol de admin
  if (profile.role !== 'admin') {
    return { autorizado: false, mensaje: 'No tienes permisos de administrador' }
  }
  
  return { autorizado: true }
}
