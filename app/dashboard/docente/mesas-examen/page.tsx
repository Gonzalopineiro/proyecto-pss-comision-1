import Sidebar from '@/components/dashboard/sidebar';
import Link from 'next/link';
import { Plus, Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function MesasExamenPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Mesas de Examen
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Gestiona las mesas de examen para tus materias
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link href="/dashboard/docente/mesas-examen/crear-mesa">
                  <Button className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Mesa de Examen
                  </Button>
                </Link>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Mesas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Programadas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Finalizadas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                  </div>
                  <div className="h-8 w-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Este Mes</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de mesas */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mesas de Examen Recientes
                </h2>
              </div>
              
              <div className="p-6">
                {/* Estado vacío */}
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No hay mesas de examen creadas
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Comienza creando tu primera mesa de examen para que los estudiantes puedan inscribirse.
                  </p>
                  <Link href="/dashboard/docente/mesas-examen/crear-mesa">
                    <Button className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Primera Mesa
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}