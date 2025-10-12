"use client";

import React from 'react';

interface MateriaPlan {
  id: number;
  codigo_plan_materia: string;
  anio: number;
  cuatrimestre: number;
  materias: {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    duracion?: string;
  };
}

interface ListaMateriasAsociadasProps {
  materias: MateriaPlan[];
  onRemoveMateria?: (id: number) => Promise<void>;
  loading?: boolean;
}

export default function ListaMateriasAsociadas({
  materias,
  onRemoveMateria,
  loading = false
}: ListaMateriasAsociadasProps) {
  
  function getAnioText(anio: number): string {
    switch(anio) {
      case 1: return "1er Año";
      case 2: return "2do Año";
      case 3: return "3er Año";
      case 4: return "4to Año";
      case 5: return "5to Año";
      default: return `${anio}º Año`;
    }
  }
  
  function getCuatrimestreText(cuatrimestre: number): string {
    switch(cuatrimestre) {
      case 1: return "1er Cuatrimestre";
      case 2: return "2do Cuatrimestre";
      default: return "Anual";
    }
  }

  if (materias.length === 0) {
    return (
      <div className="mt-6 mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Materias Asociadas</h3>
        <div className="flex flex-col items-center justify-center py-14 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="font-medium text-gray-600 text-base mb-1">No hay materias asociadas aún</p>
          <p className="text-sm text-gray-500">Agregue materias utilizando el formulario superior</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Materias Asociadas</h3>
        <span className="text-sm text-gray-500">{materias.length} materias</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Nombre
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Código
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Año
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                Cuatrimestre
              </th>
              {onRemoveMateria && (
                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {materias.map((materia) => (
              <tr key={materia.id} className={loading ? "opacity-60" : ""}>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {materia.materias.nombre}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {materia.codigo_plan_materia}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {getAnioText(materia.anio)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {getCuatrimestreText(materia.cuatrimestre)}
                </td>
                {onRemoveMateria && (
                  <td className="py-3 px-4 text-sm text-gray-500">
                    <button
                      onClick={() => onRemoveMateria(materia.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}