import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from './ProfileEditor'

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

  // Buscar en la tabla correcta según el rol
  switch (userRole) {
    case 'user': // Estudiantes
      const { data: estudiante, error: estudianteError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, telefono, direccion, dni, legajo, nacimiento')
        .eq('email', user.email)
        .single()
      
      profile = estudiante
      searchError = estudianteError
      console.log('🔍 Búsqueda en usuarios (estudiantes):', { encontrado: !!profile, error: searchError })
      break

    case 'admin':
    case 'super': // Administrativos
      const { data: admin, error: adminError } = await supabase
        .from('administrativos')
        .select('id, nombre, apellido, email, telefono, direccion, dni')
        .eq('email', user.email)
        .single()
      
      profile = admin
      searchError = adminError
      console.log('🔍 Búsqueda en administrativos:', { encontrado: !!profile, error: searchError })
      break

    case 'docente': // Docentes
      const { data: docente, error: docenteError } = await supabase
        .from('docentes')
        .select('id, nombre, apellido, email, telefono, direccion_completa, dni')
        .eq('email', user.email)
        .single()
      
      // Mapear direccion_completa a direccion para compatibilidad con el componente
      profile = docente ? {
        ...docente,
        direccion: docente.direccion_completa
      } : null
      searchError = docenteError
      console.log('🔍 Búsqueda en docentes:', { encontrado: !!profile, error: searchError })
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