import Sidebar from '@/components/dashboard/sidebar'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CrearMateriaForm from './crearmateriaform'
import { Users, User, Book, ChevronRight } from 'lucide-react'


export default async function CrearMateriaPage(){

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <CrearMateriaForm />
          </div>
        </main>
      </div>
    </div>
  )
}