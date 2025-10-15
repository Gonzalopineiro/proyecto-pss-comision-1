import { obtenerCarreras } from '../crear-carrera/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export const revalidate = 0;

export default async function CarrerasPage() {
  const carreras = await obtenerCarreras() || [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Carreras</h1>
          <p className="text-gray-500 mt-1">Administre las carreras disponibles en el sistema</p>
        </div>
        <Link href="/dashboard/administrativo/crear-carrera">
          <Button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
            <Plus size={16} /> Crear Carrera
          </Button>
        </Link>
      </div>
      
      {carreras.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No hay carreras registradas</h3>
          <p className="text-gray-500 mb-6">Comience creando una nueva carrera para gestionar la oferta académica</p>
          <Link href="/dashboard/administrativo/crear-carrera">
            <Button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
              <Plus size={16} /> Crear Primera Carrera
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carreras.map((carrera: any) => (
            <Card key={carrera.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{carrera.nombre}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {carrera.codigo}
                  </span>
                  {carrera.departamento && (
                    <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      Depto. {carrera.departamento}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Plan de estudio:</span>{' '}
                  {carrera.plan_de_estudio?.nombre || 'No disponible'}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-400">
                    Creada: {new Date(carrera.created_at).toLocaleDateString()}
                  </div>
                  <Link href={`/dashboard/administrativo/carreras/${carrera.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Ver detalles
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}