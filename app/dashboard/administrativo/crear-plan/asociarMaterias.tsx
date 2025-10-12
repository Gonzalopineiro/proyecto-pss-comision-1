"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { obtenerMaterias } from './actions';

interface AsociarMateriasProps {
  planId: number;
  codigoPlan: string;
  onAsociarMateria: (materiaId: number, anio: number, cuatrimestre: number) => Promise<void>;
  onContinuar: () => void;
  onAnterior: () => void;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export default function AsociarMaterias({ 
  planId, 
  codigoPlan, 
  onAsociarMateria, 
  onContinuar, 
  onAnterior 
}: AsociarMateriasProps) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el formulario de asociación
  const [selectedMateriaId, setSelectedMateriaId] = useState<number | ''>('');
  const [anio, setAnio] = useState<number>(1);
  const [cuatrimestre, setCuatrimestre] = useState<number>(1);
  const [addingMateria, setAddingMateria] = useState(false);

  // Código generado automáticamente (ejemplo)
  const generatedCode = selectedMateriaId 
    ? `${codigoPlan}-MAT${materias.findIndex(m => m.id === selectedMateriaId).toString().padStart(3, '0')}`
    : `${codigoPlan}-MAT???`;

  useEffect(() => {
    async function loadMaterias() {
      setLoading(true);
      try {
        const data = await obtenerMaterias();
        if (data) {
          setMaterias(data);
        } else {
          setError('No se pudieron cargar las materias');
        }
      } catch (err) {
        setError('Error al cargar las materias');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadMaterias();
  }, []);

  const handleAsociarMateria = async () => {
    if (!selectedMateriaId) {
      setError('Debe seleccionar una materia');
      return;
    }

    setAddingMateria(true);
    try {
      await onAsociarMateria(Number(selectedMateriaId), anio, cuatrimestre);
      // Limpiar formulario después de asociar
      setSelectedMateriaId('');
      setError(null);
    } catch (err) {
      console.error('Error al asociar materia:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al asociar la materia al plan');
      }
    } finally {
      setAddingMateria(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando materias...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mt-4">
      <h2 className="text-xl font-bold mb-6">Agregar Nueva Materia</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Materia
          </label>
          <select
            value={selectedMateriaId}
            onChange={(e) => setSelectedMateriaId(Number(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Seleccione una materia"
          >
            <option value="">Seleccione una materia...</option>
            {materias.map(materia => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código generado automáticamente
          </label>
          <input
            type="text"
            value={generatedCode}
            readOnly
            title="Código generado automáticamente"
            placeholder="Código generado automáticamente"
            aria-label="Código generado automáticamente"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Año
          </label>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Seleccione un año"
          >
            <option value={1}>1er Año</option>
            <option value={2}>2do Año</option>
            <option value={3}>3er Año</option>
            <option value={4}>4to Año</option>
            <option value={5}>5to Año</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuatrimestre
          </label>
          <select
            value={cuatrimestre}
            onChange={(e) => setCuatrimestre(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Seleccione un cuatrimestre"
          >
            <option value={1}>1er Cuatrimestre</option>
            <option value={2}>2do Cuatrimestre</option>
          </select>
        </div>
        
        <Button
          type="button"
          variant="secondary"
          onClick={handleAsociarMateria}
          disabled={addingMateria || !selectedMateriaId}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          {addingMateria ? 'Agregando...' : 'Agregar Materia'}
        </Button>
      </div>
      
      <hr className="my-8 border-t border-gray-200" />

      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onAnterior}
          className="px-4 py-2"
        >
          Anterior
        </Button>
        
        <Button
          type="button"
          variant="default"
          onClick={onContinuar}
          className="px-6 py-2"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}