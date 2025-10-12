"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Plus, Trash } from 'lucide-react';
import { 
  agregarCorrelativaCursado, 
  agregarCorrelativaFinal,
  eliminarCorrelativaCursado,
  eliminarCorrelativaFinal,
  obtenerCorrelativasCursado,
  obtenerCorrelativasFinal
} from './correlatividades';

// Tipos de datos
interface MateriaPlan {
  id: number;
  codigo_plan_materia: string;
  anio: number;
  cuatrimestre: number;
  materias: {
    id: number;
    nombre: string;
    descripcion?: string;
    duracion?: string;
  };
}

interface Correlativa {
  id: number;
  correlativa_id: number;
  materias: {
    id: number;
    nombre: string;
  };
}

interface GestionCorrelativasProps {
  planId: number;
  materias: MateriaPlan[];
  onContinuar: () => void;
  onAnterior: () => void;
  loading?: boolean;
}

export default function GestionCorrelativas({
  planId,
  materias,
  onContinuar,
  onAnterior,
  loading = false
}: GestionCorrelativasProps) {
  // Estado para errores y carga
  const [error, setError] = useState<string | null>(null);
  const [loadingCorrelativas, setLoadingCorrelativas] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para correlatividades
  const [correlativasCursado, setCorrelativasCursado] = useState<{[key: number]: Correlativa[]}>({});
  const [correlativasFinal, setCorrelativasFinal] = useState<{[key: number]: Correlativa[]}>({});
  
  // Estados para búsqueda de materias
  const [busquedaCursado, setBusquedaCursado] = useState<{[key: number]: string}>({});
  const [busquedaFinal, setBusquedaFinal] = useState<{[key: number]: string}>({});
  
  // Carga inicial de correlatividades para todas las materias
  useEffect(() => {
    const cargarTodasLasCorrelativas = async () => {
      setLoadingCorrelativas(true);
      
      try {
        const nuevasCorrelativasCursado: {[key: number]: Correlativa[]} = {};
        const nuevasCorrelativasFinal: {[key: number]: Correlativa[]} = {};
        
        // Cargar correlativas para cada materia
        for (const materia of materias) {
          const materiaId = materia.materias.id;
          
          // Cargar correlativas de cursado
          const correlativasCursado = await obtenerCorrelativasCursado(planId, materiaId);
          if (correlativasCursado) {
            nuevasCorrelativasCursado[materiaId] = correlativasCursado;
          }
          
          // Cargar correlativas de final
          const correlativasFinal = await obtenerCorrelativasFinal(planId, materiaId);
          if (correlativasFinal) {
            nuevasCorrelativasFinal[materiaId] = correlativasFinal;
          }
        }
        
        setCorrelativasCursado(nuevasCorrelativasCursado);
        setCorrelativasFinal(nuevasCorrelativasFinal);
        
      } catch (err) {
        console.error('Error al cargar correlatividades:', err);
        setError('Error al cargar las correlatividades');
      } finally {
        setLoadingCorrelativas(false);
      }
    };
    
    if (materias.length > 0) {
      cargarTodasLasCorrelativas();
    }
  }, [materias, planId]);
  
  // Función para mostrar mensaje temporal
  const mostrarMensajeTemporal = (mensaje: string, esError: boolean = false) => {
    if (esError) {
      setError(mensaje);
    } else {
      setSuccessMessage(mensaje);
    }
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      if (esError) {
        setError(null);
      } else {
        setSuccessMessage(null);
      }
    }, 3000);
  };
  
  // Función para agregar una correlativa de cursado
  const handleAgregarCorrelativaCursado = async (materiaId: number, correlativaId: number) => {
    setLoadingCorrelativas(true);
    setError(null);
    
    try {
      const result = await agregarCorrelativaCursado({
        plan_id: planId,
        materia_id: materiaId,
        correlativa_id: correlativaId
      });
      
      if ('error' in result) {
        mostrarMensajeTemporal(result.error, true);
      } else {
        // Recargar correlativas de cursado para esta materia
        const correlativas = await obtenerCorrelativasCursado(planId, materiaId);
        if (correlativas) {
          setCorrelativasCursado(prev => ({
            ...prev,
            [materiaId]: correlativas
          }));
        }
        
        // Limpiar búsqueda
        setBusquedaCursado(prev => ({
          ...prev,
          [materiaId]: ''
        }));
        
        mostrarMensajeTemporal('Correlatividad de cursada añadida correctamente');
      }
    } catch (err) {
      console.error('Error al agregar correlativa de cursado:', err);
      mostrarMensajeTemporal('Error al agregar correlatividad de cursada', true);
    } finally {
      setLoadingCorrelativas(false);
    }
  };
  
  // Función para agregar una correlativa de final
  const handleAgregarCorrelativaFinal = async (materiaId: number, correlativaId: number) => {
    setLoadingCorrelativas(true);
    setError(null);
    
    try {
      const result = await agregarCorrelativaFinal({
        plan_id: planId,
        materia_id: materiaId,
        correlativa_id: correlativaId
      });
      
      if ('error' in result) {
        mostrarMensajeTemporal(result.error, true);
      } else {
        // Recargar correlativas de final para esta materia
        const correlativas = await obtenerCorrelativasFinal(planId, materiaId);
        if (correlativas) {
          setCorrelativasFinal(prev => ({
            ...prev,
            [materiaId]: correlativas
          }));
        }
        
        // Limpiar búsqueda
        setBusquedaFinal(prev => ({
          ...prev,
          [materiaId]: ''
        }));
        
        mostrarMensajeTemporal('Correlatividad de final añadida correctamente');
      }
    } catch (err) {
      console.error('Error al agregar correlativa de final:', err);
      mostrarMensajeTemporal('Error al agregar correlatividad de final', true);
    } finally {
      setLoadingCorrelativas(false);
    }
  };
  
  // Función para eliminar una correlativa de cursado
  const handleEliminarCorrelativaCursado = async (materiaId: number, correlativaId: number) => {
    setLoadingCorrelativas(true);
    setError(null);
    
    try {
      const result = await eliminarCorrelativaCursado(correlativaId);
      
      if ('error' in result) {
        mostrarMensajeTemporal(result.error, true);
      } else {
        // Recargar correlativas de cursado para esta materia
        const correlativas = await obtenerCorrelativasCursado(planId, materiaId);
        if (correlativas) {
          setCorrelativasCursado(prev => ({
            ...prev,
            [materiaId]: correlativas
          }));
        }
        
        mostrarMensajeTemporal('Correlatividad de cursada eliminada correctamente');
      }
    } catch (err) {
      console.error('Error al eliminar correlativa de cursado:', err);
      mostrarMensajeTemporal('Error al eliminar correlatividad de cursada', true);
    } finally {
      setLoadingCorrelativas(false);
    }
  };
  
  // Función para eliminar una correlativa de final
  const handleEliminarCorrelativaFinal = async (materiaId: number, correlativaId: number) => {
    setLoadingCorrelativas(true);
    setError(null);
    
    try {
      const result = await eliminarCorrelativaFinal(correlativaId);
      
      if ('error' in result) {
        mostrarMensajeTemporal(result.error, true);
      } else {
        // Recargar correlativas de final para esta materia
        const correlativas = await obtenerCorrelativasFinal(planId, materiaId);
        if (correlativas) {
          setCorrelativasFinal(prev => ({
            ...prev,
            [materiaId]: correlativas
          }));
        }
        
        mostrarMensajeTemporal('Correlatividad de final eliminada correctamente');
      }
    } catch (err) {
      console.error('Error al eliminar correlativa de final:', err);
      mostrarMensajeTemporal('Error al eliminar correlatividad de final', true);
    } finally {
      setLoadingCorrelativas(false);
    }
  };
  
  // Función para filtrar materias correlativas según búsqueda
  const filtrarMateriasPorBusqueda = (materiaId: number, tipoBusqueda: 'cursado' | 'final') => {
    const busqueda = tipoBusqueda === 'cursado' 
      ? (busquedaCursado[materiaId] || '').toLowerCase()
      : (busquedaFinal[materiaId] || '').toLowerCase();
      
    if (!busqueda) return [];
    
    // No mostrar la materia actual como posible correlativa
    return materias.filter(materia => {
      return (
        materia.materias.id !== materiaId &&
        (
          materia.materias.nombre.toLowerCase().includes(busqueda) ||
          materia.codigo_plan_materia.toLowerCase().includes(busqueda)
        )
      );
    });
  };
  
  // Función para obtener texto del año/cuatrimestre
  const getAnioCuatrimestreTexto = (anio: number, cuatrimestre: number) => {
    const anioTexto = anio === 1 ? '1er Año' : anio === 2 ? '2do Año' : anio === 3 ? '3er Año' : `${anio}to Año`;
    const cuatrimestreTexto = cuatrimestre === 1 ? '1er Cuatrimestre' : '2do Cuatrimestre';
    return `${anioTexto} - ${cuatrimestreTexto}`;
  };
  
  // Renderizar el componente
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mt-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Materias del Plan de Estudios</h2>
        <p className="text-gray-600">Gestionar materias y asignar correlatividades</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Materia
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Código
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Año/Cuatrimestre
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Correlativas Cursada
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Correlativas Examen
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {materias.map((materia) => (
              <tr key={materia.id} className={loadingCorrelativas ? "opacity-60" : ""}>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {materia.materias.nombre}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {materia.materias.id}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {getAnioCuatrimestreTexto(materia.anio, materia.cuatrimestre)}
                </td>
                <td className="py-3 px-4 text-sm">
                  {/* Correlativas de Cursado */}
                  <div>
                    {/* Lista de correlativas actuales */}
                    <div className="mb-2">
                      {correlativasCursado[materia.materias.id]?.map(correlativa => (
                        <div key={correlativa.id} className="flex items-center mb-1">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2 py-1 rounded">
                            {correlativa.materias.nombre}
                          </span>
                          <button
                            onClick={() => handleEliminarCorrelativaCursado(materia.materias.id, correlativa.id)}
                            disabled={loadingCorrelativas}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Eliminar correlativa de cursada"
                            aria-label={`Eliminar ${correlativa.materias.nombre} como correlativa de cursada`}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {(!correlativasCursado[materia.materias.id] || correlativasCursado[materia.materias.id].length === 0) && (
                        <span className="text-xs text-gray-500">Sin correlativas</span>
                      )}
                    </div>
                    
                    {/* Input para buscar y agregar correlativas */}
                    <div className="relative">
                      <div className="flex">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            placeholder="Buscar materias..."
                            value={busquedaCursado[materia.materias.id] || ''}
                            onChange={(e) => setBusquedaCursado(prev => ({
                              ...prev,
                              [materia.materias.id]: e.target.value
                            }))}
                            className="w-full px-3 py-1 text-xs border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {(busquedaCursado[materia.materias.id]?.length || 0) > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                              {filtrarMateriasPorBusqueda(materia.materias.id, 'cursado').map(m => (
                                <div
                                  key={m.id}
                                  className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleAgregarCorrelativaCursado(materia.materias.id, m.materias.id)}
                                >
                                  {m.materias.nombre}
                                </div>
                              ))}
                              {filtrarMateriasPorBusqueda(materia.materias.id, 'cursado').length === 0 && (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  No hay resultados
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          className="px-2 py-1 bg-gray-100 text-gray-600 border border-l-0 border-gray-300 rounded-r-md"
                          onClick={() => {
                            setBusquedaCursado(prev => ({
                              ...prev,
                              [materia.materias.id]: ''
                            }));
                          }}
                          title="Buscar correlativas de cursada"
                          aria-label="Buscar correlativas de cursada"
                        >
                          <Search size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">
                  {/* Correlativas de Examen */}
                  <div>
                    {/* Lista de correlativas actuales */}
                    <div className="mb-2">
                      {correlativasFinal[materia.materias.id]?.map(correlativa => (
                        <div key={correlativa.id} className="flex items-center mb-1">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2 py-1 rounded">
                            {correlativa.materias.nombre}
                          </span>
                          <button
                            onClick={() => handleEliminarCorrelativaFinal(materia.materias.id, correlativa.id)}
                            disabled={loadingCorrelativas}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Eliminar correlativa de examen"
                            aria-label={`Eliminar ${correlativa.materias.nombre} como correlativa de examen final`}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {(!correlativasFinal[materia.materias.id] || correlativasFinal[materia.materias.id].length === 0) && (
                        <span className="text-xs text-gray-500">Sin correlativas</span>
                      )}
                    </div>
                    
                    {/* Input para buscar y agregar correlativas */}
                    <div className="relative">
                      <div className="flex">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            placeholder="Buscar materias..."
                            value={busquedaFinal[materia.materias.id] || ''}
                            onChange={(e) => setBusquedaFinal(prev => ({
                              ...prev,
                              [materia.materias.id]: e.target.value
                            }))}
                            className="w-full px-3 py-1 text-xs border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {(busquedaFinal[materia.materias.id]?.length || 0) > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                              {filtrarMateriasPorBusqueda(materia.materias.id, 'final').map(m => (
                                <div
                                  key={m.id}
                                  className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleAgregarCorrelativaFinal(materia.materias.id, m.materias.id)}
                                >
                                  {m.materias.nombre}
                                </div>
                              ))}
                              {filtrarMateriasPorBusqueda(materia.materias.id, 'final').length === 0 && (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  No hay resultados
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          className="px-2 py-1 bg-gray-100 text-gray-600 border border-l-0 border-gray-300 rounded-r-md"
                          onClick={() => {
                            setBusquedaFinal(prev => ({
                              ...prev,
                              [materia.materias.id]: ''
                            }));
                          }}
                          title="Buscar correlativas de examen final"
                          aria-label="Buscar correlativas de examen final"
                        >
                          <Search size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-center">
                  <button
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={loadingCorrelativas}
                    title="Eliminar materia del plan"
                    aria-label={`Eliminar ${materia.materias.nombre} del plan de estudios`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onAnterior}
          className="px-4 py-2"
        >
          Anterior
        </Button>
        
        <div>
          <span className="text-sm text-gray-500 mr-2">{materias.length} materias asociadas</span>
          
          <Button
            type="button"
            variant="default"
            onClick={onContinuar}
            className="px-6 py-2"
            disabled={loadingCorrelativas || loading}
          >
            {loadingCorrelativas || loading ? 'Procesando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}