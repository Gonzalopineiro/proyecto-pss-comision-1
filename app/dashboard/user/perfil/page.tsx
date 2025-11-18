import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from './ProfileEditor'
import SidebarAlumno from '@/components/ui/sidebar_alumno'

export default async function PerfilPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Obtener el rol del usuario desde profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profileData) {
    console.error('Error al obtener perfil de auth:', profileError)
    redirect('/login')
  }

  const userRole = profileData.role || 'user'
  console.log('🔍 Usuario autenticado:', { id: user.id, email: user.email, role: userRole })

  let profile = null
  let searchError = null

  // Primero obtener el legajo del usuario desde la tabla Roles usando su email
  console.log('🔍 Obteniendo legajo para email:', user.email)
  const { data: rolesData, error: rolesError } = await supabase
    .from('Roles')
    .select('legajo')
    .eq('email', user.email)
    .single()

  if (rolesError || !rolesData) {
    console.error('Error al obtener legajo desde Roles:', rolesError)
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Usuario No Registrado Correctamente
          </h2>
          <p className="text-red-700 dark:text-red-300 mt-2">
            No se encontró un legajo asociado a tu email en el sistema.
          </p>
          <p className="text-red-600 dark:text-red-400 mt-2 text-sm">
            Esto indica que tu usuario no fue registrado correctamente usando el formulario correspondiente.
          </p>
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-800 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Solución:</strong> Contacta al administrador para que te registre correctamente como {userRole === 'user' ? 'estudiante' : userRole === 'docente' ? 'docente' : 'administrativo'}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const userLegajo = rolesData.legajo
  console.log('🔍 Legajo del usuario:', userLegajo)

  // Buscar en la tabla correcta según el rol usando el legajo
  switch (userRole) {
    case 'user': // Estudiantes
      const { data: estudiante, error: estudianteError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, telefono, direccion, dni, legajo, nacimiento')
        .eq('legajo', userLegajo)
        .single()
      
      profile = estudiante
      searchError = estudianteError
      console.log('🔍 Búsqueda en usuarios (estudiantes) por legajo:', { legajo: userLegajo, encontrado: !!profile, error: searchError })
      break

    case 'admin':
    case 'super': // Administrativos
      console.log('🔍 Buscando administrativo con legajo:', userLegajo)
      
      const { data: admin, error: adminError } = await supabase
        .from('administrativos')
        .select('id, nombre, apellido, email, telefono, direccion, dni, legajo')
        .eq('legajo', userLegajo)
        .single()
      
      profile = admin
      searchError = adminError
      console.log('🔍 Búsqueda en administrativos por legajo:', { legajo: userLegajo, encontrado: !!profile, error: searchError })
      break

    case 'docente': // Docentes
      const { data: docente, error: docenteError } = await supabase
        .from('docentes')
        .select('id, nombre, apellido, email, telefono, direccion_completa, dni, legajo')
        .eq('legajo', userLegajo)
        .single()
      
      // Mapear direccion_completa a direccion para compatibilidad con el componente
      profile = docente ? {
        ...docente,
        direccion: docente.direccion_completa
      } : null
      searchError = docenteError
      console.log('🔍 Búsqueda en docentes por legajo:', { legajo: userLegajo, encontrado: !!profile, error: searchError })
      break

    default:
      return (
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Rol No Reconocido</h2>
            <p className="text-red-600 dark:text-red-300">
              Rol detectado: <strong>{userRole}</strong>. No se sabe en qué tabla buscar el perfil.
            </p>
          </div>
        </div>
      )
  }

  // Si hay error al buscar, mostrar error
  if (searchError) {
    console.error('Error en búsqueda:', searchError)
    
    // Mensaje especial si el usuario no está en la tabla correcta
    if (searchError.code === 'USER_NOT_IN_ADMIN_TABLE') {
      return (
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Usuario No Registrado Correctamente
            </h2>
            <p className="text-red-700 dark:text-red-300 mt-2">
              Tu cuenta tiene permisos de <strong>{userRole}</strong>, pero no estás registrado en la tabla de administrativos.
            </p>
            <p className="text-red-600 dark:text-red-400 mt-2 text-sm">
              Esto puede suceder si tu cuenta fue creada manualmente o hay un problema en el proceso de registro.
            </p>
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Solución:</strong> Contacta al administrador del sistema para que te registre correctamente como administrativo usando el formulario "Registrar Administrativo".
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Debug:</strong> Auth ID: {user.id} | Email: {user.email} | Rol: {userRole}
              </p>
            </div>
          </div>
        </div>
      )
    }
    
    // Error general
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            Perfil No Encontrado
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300 mt-2">
            No se encontró un perfil para el email: <strong>{user.email}</strong> en la tabla correspondiente a tu rol: <strong>{userRole}</strong>
          </p>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Información de Debug:</strong>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Auth ID: {user.id}<br/>
              Email: {user.email}<br/>
              Rol: {userRole}<br/>
              Tabla: {userRole === 'user' ? 'usuarios' : userRole === 'docente' ? 'docentes' : 'administrativos'}<br/>
              Error: {searchError.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Si no se encontró perfil (null), mostrar mensaje
  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            Perfil Vacío
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300 mt-2">
            Tu cuenta está configurada correctamente pero no tienes datos de perfil en la tabla correspondiente.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Email: {user.email} | Rol: {userRole} | Tabla: {userRole === 'user' ? 'usuarios' : userRole === 'docente' ? 'docentes' : 'administrativos'}
          </p>
        </div>
      </div>
    )
  }

  // Mostrar sidebar solo para estudiantes (rol 'user'). Para otros roles, usar layout genérico.
  if (userRole === 'user') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          <aside className="w-64">
            <SidebarAlumno />
          </aside>
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona tu información personal y mantén tus datos actualizados
                </p>
              </div>

              <ProfileEditor 
                user={profile} 
                userRole={userRole}
              />
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Layout genérico para otros roles
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tu información personal y mantén tus datos actualizados
        </p>
      </div>

      <ProfileEditor 
        user={profile} 
        userRole={userRole}
      />
    </div>
  )
}