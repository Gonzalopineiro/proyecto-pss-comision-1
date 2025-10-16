import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'

export default async function DocentePage() {
  // La verificación de autenticación y rol ya se realiza en el layout
  
  return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="flex">
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
                            <h1 className="text-2xl font-bold">Bienvenido al sistema</h1>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}