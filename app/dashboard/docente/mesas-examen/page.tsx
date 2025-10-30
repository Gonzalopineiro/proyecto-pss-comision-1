import Link from 'next/link';
import { Plus, Calendar, Clock, BookOpen, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Necesitarás el Badge
import { ArrowLeft } from 'lucide-react';

// (IMPORTANTE: Ajusta la ruta a tu archivo 'actions' si es diferente)
// Asumo que tus actions están en la carpeta padre 'docente'
import { obtenerMesasExamenDocente, type MesaExamen } from '../actions'; 

// --- Componente para una tarjeta de Mesa ---
// (Moví la lógica de la tarjeta aquí para más orden)

function MesaCard({ mesa }: { mesa: MesaExamen }) {
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const estadoVariant = {
    'programada': 'default',
    'Cerrada': 'secondary',
    'Publicada': 'success',
  }[mesa.estado] || 'default';

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{mesa.materia.nombre}</h3>
        <p className="text-sm text-slate-500 mb-2">{mesa.materia.codigo_materia}</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatearFecha(mesa.fecha_examen)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {mesa.hora_examen}
          </span>
          <Badge variant={estadoVariant as any} className="w-fit">{mesa.estado}</Badge>
        </div>
      </div>
      
      {/* --- ESTE ES EL LINK CLAVE --- 
         Lleva al formulario de carga de notas (.../[idMesa])
      */}
      <div className="flex-shrink-0">
        <Link href={`/dashboard/docente/mesas-examen/${mesa.id}`}>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            {mesa.estado === 'programada' ? 'Cargar Notas' : 'Ver/Editar'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// --- Página Principal (Server Component) ---

export default async function MesasExamenPage() {
  
  // 1. OBTENER DATOS (La parte que faltaba)
  const mesas = await obtenerMesasExamenDocente();

  // 2. CALCULAR ESTADÍSTICAS
  const totalMesas = mesas.length;
  const programadas = mesas.filter(m => m.estado === 'programada').length;
  const finalizadas = mesas.filter(m => m.estado === 'Cerrada' || m.estado === 'Publicada').length;
  // (Aquí puedes añadir la lógica para 'Este Mes')
  const esteMes = 0; 

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">
          
          <div className="max-w-6xl mx-auto mt-6">
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
            
            {/* Encabezado (Tu código original) */}
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

            {/* Estadísticas rápidas (Ahora con datos reales) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Mesas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMesas}</p>
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
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{programadas}</p>
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
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{finalizadas}</p>
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
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{esteMes}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de mesas (Ahora con lógica condicional) */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mesas de Examen Recientes
                </h2>
              </div>
              
              <div className="p-6">
                {mesas.length === 0 ? (
                  // Estado vacío (Tu código original)
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
                ) : (
                  // LISTA REAL DE MESAS
                  <div className="space-y-4">
                    {mesas.map((mesa) => (
                      <MesaCard key={mesa.id} mesa={mesa} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}