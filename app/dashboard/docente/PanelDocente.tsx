"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Calendar,
  Plus,
  Settings,
  Star,
  FileText,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  obtenerMateriasDocente,
  obtenerMesasExamenDocente,
  eliminarMesaExamen,
  type MateriaDocente,
  type MesaExamen
} from './actions';

export default function PanelDocente() {
  const router = useRouter();

  // Estados
  const [materias, setMaterias] = useState<MateriaDocente[]>([]);
  const [mesas, setMesas] = useState<MesaExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mesaToDelete, setMesaToDelete] = useState<MesaExamen | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [materiasData, mesasData] = await Promise.all([
          obtenerMateriasDocente(),
          obtenerMesasExamenDocente()
        ]);

        setMaterias(materiasData);
        setMesas(mesasData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Manejar eliminación de mesa
  const handleDeleteMesa = async () => {
    if (!mesaToDelete) return;

    try {
      const result = await eliminarMesaExamen(mesaToDelete.id);
      if (result.success) {
        // Actualizar la lista de mesas
        setMesas(mesas.filter(mesa => mesa.id !== mesaToDelete.id));
        setShowDeleteConfirm(false);
        setMesaToDelete(null);
      } else {
        console.error('Error al eliminar mesa:', result.error);
      }
    } catch (error) {
      console.error('Error al eliminar mesa:', error);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    // Usar fecha local para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-');
    const fechaLocal = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return fechaLocal.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Panel de Docente
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestiona tus materias, estudiantes y evaluaciones
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Columna Izquierda - Mis Materias */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Mis Materias
                  </h2>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded">
                    {materias.length} materias
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {materias.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No hay materias asignadas
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Contacta al administrador para que te asigne materias
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materias.map((materia) => (
                    <div
                      key={materia.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                            {materia.codigo_materia}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {materia.nombre}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                            <span>{materia.carrera} - {materia.anio}</span>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{materia.estudiantes_inscriptos} estudiantes inscriptos</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Acciones Rápidas y Mesas */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Acciones Rápidas
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <Link href="/dashboard/docente/mesas-examen/crear-mesa">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-3" />
                  Crear Mesa de Examen
                </Button>
              </Link>
              <Button className="w-full justify-start" variant="outline">
                <Star className="h-4 w-4 mr-3" />
                Calificaciones
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-3" />
                Actas
              </Button>
            </div>
          </div>

          {/* Mesas de Examen */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mesas de Examen
                </h2>
                <Link href="/dashboard/docente/mesas-examen/crear-mesa">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Mesa
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-6">
              {mesas.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No hay mesas programadas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mesas.slice(0, 4).map((mesa) => (
                    <div
                      key={mesa.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                            {mesa.materia.codigo_materia}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatearFecha(mesa.fecha_examen)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMesaToDelete(mesa);
                              setShowDeleteConfirm(true);
                            }}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {mesas.length > 4 && (
                    <Link href="/dashboard/docente/mesas-examen">
                      <Button variant="ghost" size="sm" className="w-full mt-3">
                        Ver todas las mesas ({mesas.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              ¿Eliminar Mesa de Examen?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas eliminar la mesa de examen de {mesaToDelete?.materia.nombre} programada para el {mesaToDelete ? formatearFecha(mesaToDelete.fecha_examen) : ''}?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMesaToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMesa}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}