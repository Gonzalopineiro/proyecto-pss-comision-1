"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';

interface PlanDeEstudio {
  codigo: string;
  nombre: string;
}

interface Departamento {
  id: string;
  nombre: string;
}

// Función para generar el código de la carrera
function generarCodigoCarrera(nombre: string): string {
  if (!nombre || nombre.trim() === '') return '';
  const acronimo = nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  const year = new Date().getFullYear();
  return `${acronimo}-${year}`;
}

export default function CrearCarreraForm() {
  const router = useRouter();

  // --- Estados del Formulario ---
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [planDeEstudiosId, setPlanDeEstudiosId] = useState('');
  
  // --- Estados de Soporte ---
  const [planesDisponibles, setPlanesDisponibles] = useState<PlanDeEstudio[]>([]);
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Efecto para generar el código automáticamente cuando cambia el nombre
  useEffect(() => {
    setCodigo(generarCodigoCarrera(nombre));
  }, [nombre]);

  // Efecto para cargar los datos necesarios (planes y departamentos) al montar el componente
  useEffect(() => {
    async function fetchPlanesDeEstudio() {
      try {
        const res = await fetch('/api/planes');
        if (!res.ok) throw new Error('No se pudieron cargar los planes de estudio');
        const data = await res.json();
        setPlanesDisponibles(data);
      } catch (error) {
        setServerError('Error crítico: No se pudieron cargar los planes de estudio. Asegúrese de que haya planes creados.');
      }
    }
    
    async function fetchDepartamentos() {
        try {
            const res = await fetch('/api/departamentos');
            if (!res.ok) throw new Error('No se pudieron cargar los departamentos');
            const data = await res.json();
            setDepartamentosDisponibles(data);
        } catch (error) {
            setServerError('Error crítico: No se pudieron cargar los departamentos desde el servidor.');
        }
    }

    fetchPlanesDeEstudio();
    fetchDepartamentos();
  }, []);

  // Función de validación del lado del cliente
  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!departamento) e.departamento = 'El departamento es obligatorio';
    if (!planDeEstudiosId) e.planDeEstudiosId = 'El plan de estudios es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/carreras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, codigo, departamento, planDeEstudiosId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la carrera');
      }
      
      router.push('/dashboard/administrativo');

    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Crear Nueva Carrera</h1>
            <p className="text-sm text-gray-500 mt-1">Complete la información requerida para registrar una nueva carrera</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="bg-white text-gray-800 font-semibold py-2 px-5 rounded-md border border-gray-300 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-gray-800 text-white font-semibold py-2 px-5 rounded-md hover:bg-black disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Carrera'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Carrera *</label>
              <input 
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Ingeniería en Sistemas"
                className={`w-full p-2.5 rounded-md border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Identificación generado automáticamente</label>
              <input 
                title='Código de Identificación'
                type="text"
                value={codigo}
                readOnly
                className="w-full p-2.5 rounded-md border border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento Responsable *</label>            
              <select
                title="Departamento Responsable"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className={`w-full p-2.5 rounded-md border ${errors.departamento ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
              >
                <option value="">Seleccionar departamento...</option>
                {departamentosDisponibles.map(dep => <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Estudios Asociado *</label>
              <select
                title="Plan de Estudios"
                value={planDeEstudiosId}
                onChange={(e) => setPlanDeEstudiosId(e.target.value)}
                className={`w-full p-2.5 rounded-md border ${errors.planDeEstudiosId ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
              >
                <option value="">Seleccionar plan de estudios...</option>
                {planesDisponibles.map(plan => <option key={plan.codigo} value={plan.codigo}>{plan.nombre}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Solo se muestran planes de estudios vigentes y aprobados</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">Información Importante</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Todos los campos marcados con (*) son obligatorios</li>
              <li>El código de identificación debe ser único en el sistema</li>
              <li>La carrera debe estar vinculada a un plan de estudios válido</li>
              <li>No se pueden crear carreras duplicadas con el mismo nombre</li>
            </ul>
          </div>
          
          {serverError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
              <strong>Error:</strong> {serverError}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Validaciones del Sistema</h4>
              <p className="text-sm text-gray-600 mt-1">
                El sistema verificará automáticamente que no exista una carrera con el mismo nombre y que el código de identificación sea único antes de proceder con la creación.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}