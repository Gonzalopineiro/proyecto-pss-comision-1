import { Calendar, Clock, Plus } from 'lucide-react';

export default function MesasExamenPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mesas Exámenes
            </h1>
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Gestión de Mesas de Examen
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Aquí podrás crear y gestionar las mesas de examen para tus materias. 
              Programa fechas, horarios y administra las inscripciones de los estudiantes.
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

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Programar</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Establece fechas y horarios para las mesas de examen de tus materias.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Gestionar</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Administra las inscripciones y el estado de las mesas programadas.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Crear</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Crea nuevas mesas de examen para cualquiera de tus materias asignadas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}