import Sidebar from '@/components/dashboard/sidebar'
import PanelDocente from './PanelDocente'

export default async function DocentePage() {
  // La verificación de autenticación y rol ya se realiza en el layout
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <PanelDocente />
        </main>
      </div>
    </div>
  )
}