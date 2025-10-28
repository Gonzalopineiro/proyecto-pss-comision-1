import { redirect } from 'next/navigation'
import RegistrarAdminForm from './registrarAdminForm'
import { createClient } from '@/utils/supabase/server'


export default async function RegistrarAdministrativoPage() {
  // Verificar autenticación
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          <main className="flex-1 p-8">  
            <div className="max-w-6xl mx-auto mt-6">
              <RegistrarAdminForm />
            </div>
          </main>
        </div>
      </div>
    )
}