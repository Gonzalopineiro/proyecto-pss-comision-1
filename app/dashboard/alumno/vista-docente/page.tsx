import Sidebar from '@/components/dashboard/sidebar'
import PanelDocenteTemporal from '../PanelDocenteTemporal'

export default async function VistaDocenteTemporal() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <PanelDocenteTemporal />
        </main>
      </div>
    </div>
  )
}