import { Calendar, Clock, Plus, Edit, Trash2, Check, X, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import { obtenerMesasDocente, type MesaExamen } from './actions'
import MesaExamenCard from './MesaExamenCard'

export default async function MesasExamenPage() {
  // Obtener las mesas del docente
  const { success, mesas, error } = await obtenerMesasDocente()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="p-6 max-w-6xl mx-auto">
        {/* Botón de volver */}
        <div className="mb-6">
          <a 
            href="/dashboard/docente"
            className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel Docente
          </a>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Mesas de Exámenes
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {success && mesas ? `${mesas.length} mesa${mesas.length !== 1 ? 's' : ''} encontrada${mesas.length !== 1 ? 's' : ''}` : 'Gestiona tus mesas de examen'}
              </p>
            </div>
          </div>
          
          {/* Botón para crear nueva mesa */}
          <a 
            href="/dashboard/docente/mesas-examen/crear-mesa"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Mesa de Examen
          </a>
        </div>

        {/* Contenido principal */}
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-medium">Error al cargar las mesas</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : !success || !mesas || mesas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No tienes mesas de examen creadas
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Comienza creando tu primera mesa de examen. Aquí podrás programar fechas, 
                horarios y gestionar las inscripciones de los estudiantes.
              </p>
              
              <div className="mt-6">
                <a 
                  href="/dashboard/docente/mesas-examen/crear-mesa"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primera Mesa de Examen
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filtros y estadísticas */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mesas.filter(m => m.estado === 'programada').length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Programadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mesas.filter(m => m.estado === 'finalizada').length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Finalizadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mesas.filter(m => m.notas_cargadas === true).length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Con Notas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mesas.filter(m => m.estado === 'finalizada' && !m.notas_cargadas).length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Pendientes</div>
                </div>
              </div>
            </div>

            {/* Lista de mesas */}
            <div className="grid gap-6">
              {mesas.map((mesa) => (
                <MesaExamenCard key={mesa.id} mesa={mesa} />
              ))}
            </div>
          </div>
        )}


      </main>
    </div>
  );
}