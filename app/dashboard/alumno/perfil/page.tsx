import Sidebar from '@/components/dashboard/sidebar'

export default async function PerfilAlumnoPage(){

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <h1>Mi perfil</h1>
          </div>
        </main>
      </div>
    </div>
  )
}