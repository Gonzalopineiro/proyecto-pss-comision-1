import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function EstudianteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticación
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }
  
  // Verificar si el usuario tiene rol de alumno (user)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()
  
  // Redirigir a la página de login si no es alumno (user) ni super
  if (profileError || !profileData || (profileData.role !== 'user' && profileData.role !== 'super')) {
    redirect('/login')
  }

  return (
    <>
      {children}
    </>
  )
}