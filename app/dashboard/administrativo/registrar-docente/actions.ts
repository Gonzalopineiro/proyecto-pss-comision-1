'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface DocenteFormData {
  nombre: string
  apellido: string
  dni: string
  legajo: string
  fechaNacimiento: string
  email: string
  direccion: string
  telefono: string
  materias: number[]
}

export async function registrarDocente(formData: DocenteFormData) {
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
    
    // Crear el usuario usando signUp pero guardando la sesión actual del administrador
    // Usamos el DNI como contraseña inicial
    const password = formData.dni + "";
    
    // Guardar la sesión actual del administrador antes de crear el nuevo usuario
    const { data: currentSession } = await supabase.auth.getSession()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          role: 'docente'
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

    // Insertar en la tabla profiles con rol docente
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: formData.email,
        role: 'docente'
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

    // Insertar en la tabla docentes
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .insert({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        legajo: formData.legajo,
        fecha_nacimiento: formData.fechaNacimiento,
        email: formData.email,
        direccion_completa: formData.direccion,
        contrasena_inicial: password,
        telefono: formData.telefono
      })
      .select()
      .single()

    if (docenteError) {
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
        error: `Error al registrar docente: ${docenteError.message}` 
      }
    }

    // Insertar las materias asociadas al docente
    if (formData.materias && formData.materias.length > 0) {
      const materiasData = formData.materias.map(materiaId => ({
        docente_id: docenteData.id,
        materia_id: materiaId
      }))

      const { error: materiasError } = await supabase
        .from('materia_docente')
        .insert(materiasData)

      if (materiasError) {
        console.error('Error al asociar materias al docente:', materiasError)
        // No bloqueamos el proceso, pero registramos el error
      }
    }

    // Revalidar la ruta para actualizar la lista de docentes
    revalidatePath('/dashboard/administrativo')
    return { 
      success: true, 
      userId,
      mensaje: `Docente ${formData.nombre} ${formData.apellido} creado exitosamente`,
      passwordUsed,
      details: {
        auth: true,
        profiles: true,
        roles: true,
        docentes: true,
        legajo: parseInt(formData.legajo),
        email: formData.email
      }
    }
    
  } catch (error: any) {
    console.error('Error al registrar docente:', error)
    return { 
      success: false, 
      error: error.message || 'Ocurrió un error al registrar el docente' 
    }
  }
}

interface VerificacionResult {
  duplicado: boolean;
  campo?: 'email' | 'legajo' | 'dni';
  mensaje?: string;
}

// Función para verificar si un email, legajo o dni ya existe
export async function verificarDuplicadosDocente(email: string, legajo: string, dni: string): Promise<VerificacionResult> {
  const supabase = await createClient()
  
  // Verificar si el email ya existe en docentes
  const { data: emailExistsDocentes } = await supabase
    .from('docentes')
    .select('id')
    .eq('email', email)
    .single()

  if (emailExistsDocentes) {
    return { duplicado: true, campo: 'email', mensaje: 'El email ya está registrado en docentes' }
  }

  // Verificar si el email ya existe en usuarios (alumnos)
  const { data: emailExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()

  if (emailExistsUsuarios) {
    return { duplicado: true, campo: 'email', mensaje: 'El email ya está registrado para un alumno' }
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

  // Verificar si el legajo ya existe en docentes
  const { data: legajoExistsDocentes } = await supabase
    .from('docentes')
    .select('id')
    .eq('legajo', legajo)
    .single()

  if (legajoExistsDocentes) {
    return { duplicado: true, campo: 'legajo', mensaje: 'El número de legajo ya está en uso por otro docente' }
  }

  // Verificar si el legajo ya existe en usuarios (alumnos)
  const { data: legajoExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('legajo', parseInt(legajo))
    .single()

  if (legajoExistsUsuarios) {
    return { duplicado: true, campo: 'legajo', mensaje: 'El número de legajo ya está en uso por un alumno' }
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
  
  // Verificar si el DNI ya existe en docentes
  const { data: dniExistsDocentes } = await supabase
    .from('docentes')
    .select('id')
    .eq('dni', dni)
    .single()

  if (dniExistsDocentes) {
    return { duplicado: true, campo: 'dni', mensaje: 'El DNI ya está registrado para otro docente' }
  }

  // Verificar si el DNI ya existe en usuarios (alumnos)
  const { data: dniExistsUsuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('dni', parseInt(dni))
    .single()

  if (dniExistsUsuarios) {
    return { duplicado: true, campo: 'dni', mensaje: 'El DNI ya está registrado para un alumno' }
  }

  return { duplicado: false }
}

// Función para obtener la lista de docentes
export async function obtenerDocentes() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('docentes')
    .select('*')
    .order('apellido', { ascending: true })
  
  if (error) {
    console.error('Error al obtener docentes:', error)
    return []
  }
  
  return data
}

// Función para obtener la lista de materias disponibles
export async function obtenerMaterias() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('materias')
    .select('id, codigo_materia, nombre, descripcion, duracion')
    .order('nombre', { ascending: true })
  
  if (error) {
    console.error('Error al obtener materias:', error)
    return []
  }
  
  return data
}