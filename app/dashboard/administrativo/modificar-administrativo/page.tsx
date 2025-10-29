import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ModificarAdminForm from './modificarAdminForm'
import { obtenerAdministrativo } from '@/app/dashboard/administrativo/actions'

export default async function ModificarAdministrativoPage({ searchParams }: { searchParams?: { id?: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  // Si no hay id, redirigir al panel
  // searchParams is async in the app router; await it before using its properties
  const params = await searchParams
  const id = params?.id
  if (!id) redirect('/dashboard/administrativo')

  // Obtener administrativo
  const result = await obtenerAdministrativo(id as string)
  if (!result || !result.success || !result.data) {
    redirect('/dashboard/administrativo')
  }

  const admin = result.data

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">  
          <div className="max-w-4xl mx-auto mt-6">
            <ModificarAdminForm initialData={admin} />
          </div>
        </main>
      </div>
    </div>
  )
}
