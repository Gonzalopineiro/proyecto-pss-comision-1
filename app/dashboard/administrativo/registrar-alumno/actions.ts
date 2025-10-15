'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface AlumnoFormData {
  nombre: string
  apellido: string
  dni: string
  legajo: string
  fechaNacimiento: string
  email: string
  direccion: string
  telefono: string
  carreraId: string
}

export async function registrarAlumno(formData: AlumnoFormData) {
  try {
    const supabase = await createClient()
    
    // Verificar permisos antes de continuar
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
    
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para realizar esta acción' }
    }
    
    // Verificar que el email no exista ya
    const { data: existingUserCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.email)
      .single()
      
    if (existingUserCheck) {
      return { success: false, error: 'El email ya está registrado en el sistema' }
    }
    
    // Crear el usuario en auth.users usando signUp
    // Usamos el DNI como contraseña
    const password = formData.dni + "";
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

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

    // Insertar en la tabla profiles con rol user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: formData.email,
        role: 'user'
      })

    if (profileError) {
      // Si hay error, intentamos eliminar el usuario creado
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

    // Insertar en la tabla usuarios (alumnos)
    const { error: alumnoError } = await supabase
      .from('usuarios')
      .insert({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: parseInt(formData.dni),
        legajo: parseInt(formData.legajo),
        nacimiento: formData.fechaNacimiento,
        email: formData.email,
        direccion: formData.direccion,
        telefono: formData.telefono,
        carrera_id: parseInt(formData.carreraId)
      })

    if (alumnoError) {
      // Si hay error, intentar limpiar los datos creados
      // Eliminar de profiles
      await supabase.from('profiles').delete().eq('id', userId)
      
      // Eliminar de Roles
      await supabase.from('Roles').delete().eq('email', formData.email)
      
      // Intentar eliminar el usuario
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (err) {
        console.error('No se pudo eliminar el usuario:', err)
      }
      
      return { 
        success: false, 
        error: `Error al registrar alumno: ${alumnoError.message}` 
      }
    }

    // Revalidar la ruta para actualizar la lista de alumnos
    revalidatePath('/dashboard/administrativo')
    return { 
      success: true, 
      userId,
      mensaje: `Alumno ${formData.nombre} ${formData.apellido} creado exitosamente`,
      passwordUsed,
      details: {
        auth: true,
        profiles: true,
        roles: true,
        usuarios: true,
        legajo: parseInt(formData.legajo),
        email: formData.email
      }
    }
    
  } catch (error: any) {
    console.error('Error al registrar alumno:', error)
    return { 
      success: false, 
      error: error.message || 'Ocurrió un error al registrar el alumno' 
    }
  }
}

interface VerificacionResult {
  duplicado: boolean;
  campo?: 'email' | 'legajo' | 'dni';
  mensaje?: string;
}

// Función para verificar si un email, legajo o dni ya existe
export async function verificarDuplicados(email: string, legajo: string, dni: string): Promise<VerificacionResult> {
  const supabase = await createClient()
  
  // Verificar si el email ya existe en usuarios
  const { data: emailExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()

  if (emailExistsUsuarios) {
    return { duplicado: true, campo: 'email', mensaje: 'El email ya está registrado en usuarios' }
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

  // Verificar si el legajo ya existe en usuarios
  const { data: legajoExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('legajo', parseInt(legajo))
    .single()

  if (legajoExistsUsuarios) {
    return { duplicado: true, campo: 'legajo', mensaje: 'El número de legajo ya está en uso por otro alumno' }
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
  
  // Verificar si el DNI ya existe en usuarios
  const { data: dniExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('dni', parseInt(dni))
    .single()

  if (dniExistsUsuarios) {
    return { duplicado: true, campo: 'dni', mensaje: 'El DNI ya está registrado para otro alumno' }
  }

  return { duplicado: false }
}

// Función para obtener la lista de alumnos
export async function obtenerAlumnos() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      carrera:carreras(id, nombre, codigo)
    `)
    .order('apellido', { ascending: true })
  
  if (error) {
    console.error('Error al obtener alumnos:', error)
    return []
  }
  
  return data
}

// Función para obtener la lista de carreras disponibles
export async function obtenerCarreras() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, codigo')
    .order('nombre', { ascending: true })
  
  if (error) {
    console.error('Error al obtener carreras:', error)
    return []
  }
  
  return data
}