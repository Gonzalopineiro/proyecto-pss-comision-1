"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, X } from 'lucide-react';

// Tipos de datos
interface Materia {
  codigo: string;
  nombre: string;
  descripcion: string;
  duracion: 'Anual' | 'Cuatrimestral';
  createdAt: string;
}

interface MateriaPlan {
  materiaId: string;
  nombre: string;
  año: string;
  cuatrimestre: string;
  correlativasCursada: string[];
  correlativasExamen: string[];
}

// Datos simulados de carreras
const carrerasDisponibles = [
  "Ingeniería en Sistemas",
  "Licenciatura en Análisis de Sistemas",
  "Ingeniería Química"
];

function generarCodigoPlan(nombre: string) {
  if (!nombre || nombre.trim() === '') return '';
  const acronimo = nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${acronimo}-${rand}`;
}

function añoToNumber(añoString: string): number {
  return parseInt(añoString.replace(/[^0-9]/g, ''));
}

function numberToAño(num: number): string {
  if (num === 1) return '1er Año';
  if (num === 2) return '2do Año';
  if (num === 3) return '3er Año';
  return `${num}to Año`;
}

// Componente auxiliar para la selección de correlativas
interface CorrelativasInputProps {
  materiasDisponibles: { codigo: string; nombre: string }[];
  correlativasSeleccionadas: string[];
  onUpdate: (nuevasCorrelativas: string[]) => void;
}

function CorrelativasInput({ materiasDisponibles, correlativasSeleccionadas, onUpdate }: CorrelativasInputProps) {
  const [adding, setAdding] = useState(false);
  const [seleccion, setSeleccion] = useState('');

  const handleRemove = (codigoToRemove: string) => {
    onUpdate(correlativasSeleccionadas.filter(c => c !== codigoToRemove));
  };

  const handleAdd = () => {
    if (seleccion && !correlativasSeleccionadas.includes(seleccion)) {
      onUpdate([...correlativasSeleccionadas, seleccion]);
    }
    setSeleccion('');
    setAdding(false);
  };
  
  const opcionesDisponibles = materiasDisponibles.filter(m => !correlativasSeleccionadas.includes(m.codigo));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {correlativasSeleccionadas.map(codigo => (
        <div key={codigo} className="flex items-center bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-1 rounded-md">
          <span>{materiasDisponibles.find(m => m.codigo === codigo)?.nombre || codigo}</span>
          <button onClick={() => handleRemove(codigo)} className="ml-2 text-gray-500 hover:text-black">
            &times;
          </button>
        </div>
      ))}
      
      {adding ? (
        <div className="flex gap-2">
          <select 
          title='Seleccione una materia'
            value={seleccion} 
            onChange={e => setSeleccion(e.target.value)}
            className="p-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Seleccionar...</option>
            {opcionesDisponibles.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
          </select>
          <button onClick={handleAdd} className="text-sm text-blue-600 hover:underline">Agregar</button>
          <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2.5 py-1 rounded-md">
          Agregar más...
        </button>
      )}
    </div>
  );
}

export default function CrearPlanForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // --- Step 1 States ---
  const [nombrePlan, setNombrePlan] = useState('');
  const [codigoPlan, setCodigoPlan] = useState('');
  const [añoCreacion, setAñoCreacion] = useState(new Date().getFullYear().toString());
  const [duracionTotal, setDuracionTotal] = useState('5');
  const [descripcion, setDescripcion] = useState('');

  // --- Step 2 States ---
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [materiasAsociadas, setMateriasAsociadas] = useState<MateriaPlan[]>([]);
  const [nombreNuevaMateria, setNombreNuevaMateria] = useState('');
  const [añoNuevaMateria, setAñoNuevaMateria] = useState('1er Año');
  const [cuatrimestreNuevaMateria, setCuatrimestreNuevaMateria] = useState('1er Cuatrimestre');
  
  // --- Loading y Errores ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  
  useEffect(() => {
    setCodigoPlan(generarCodigoPlan(nombrePlan));
  }, [nombrePlan]);

  useEffect(() => {
    async function fetchMaterias() {
      try {
        const res = await fetch('/api/materias');
        if (!res.ok) throw new Error('No se pudieron cargar las materias');
        const data = await res.json();
        setMateriasDisponibles(data);
      } catch (error) {
        setServerError('Error: No se pudieron cargar las materias. Asegúrese de que haya materias creadas.');
      }
    }
    fetchMaterias();
  }, []);

  function validateStep1() {
    const e: { [k: string]: string } = {};
    if (!nombrePlan.trim()) e.nombrePlan = 'El nombre del plan es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  
  function handleNextStep() {
    if (validateStep1()) {
      setStep(2);
    }
  }

  function handleAgregarMateria() {
    const materiaSeleccionada = materiasDisponibles.find(m => m.nombre === nombreNuevaMateria);
    if (!materiaSeleccionada) {
      alert("Seleccione una materia válida.");
      return;
    }
    
    if (materiasAsociadas.some(m => m.materiaId === materiaSeleccionada.codigo)) {
      alert("Esta materia ya ha sido agregada al plan.");
      return;
    }

    const nuevaMateriaPlan: MateriaPlan = {
      materiaId: materiaSeleccionada.codigo,
      nombre: materiaSeleccionada.nombre,
      año: añoNuevaMateria,
      cuatrimestre: cuatrimestreNuevaMateria,
      correlativasCursada: [],
      correlativasExamen: [],
    };

    setMateriasAsociadas([...materiasAsociadas, nuevaMateriaPlan]);
    setNombreNuevaMateria('');
  }
  
  function handleQuitarMateria(codigoMateria: string) {
    setMateriasAsociadas(materiasAsociadas.filter(m => m.materiaId !== codigoMateria));
  }
  
  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);

    if (materiasAsociadas.length === 0) {
        alert("Debe asociar al menos una materia para crear el plan de estudios.");
        return;
    }
    
    const duracionPlan = parseInt(duracionTotal);
    const añosDeMaterias = materiasAsociadas.map(m => añoToNumber(m.año));
    const maxAñoEnPlan = Math.max(...añosDeMaterias);

    if (maxAñoEnPlan !== duracionPlan) {
      setServerError(`El plan de estudios está incompleto.`);
      return; 
    }
    
    setLoading(true);
    try {
      const planData = {
        codigo: codigoPlan,
        nombre: nombrePlan,
        añoCreacion,
        duracionTotal: parseInt(duracionTotal),
        descripcion,
        materias: materiasAsociadas
      };

      const res = await fetch('/api/planes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.error || 'Error al crear el plan de estudios');
        setLoading(false);
        return;
      }

      if (onCancel) {
        onCancel();
      } else {
        router.push('/dashboard/administrativo');
      }
    } catch (err) {
      setServerError('Error de red o el servidor no responde.');
      setLoading(false);
    }
  }
  
  const renderStep1 = () => (
    <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-100 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-1">Planes de Estudio {'>'} Crear Nuevo Plan</div>
        <h1 className="text-3xl font-bold text-gray-900">Crear Plan de Estudios</h1>
      </div>
      <div className="flex items-center w-full mb-12 px-4">
          <div className="flex items-center relative">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white text-sm font-bold z-10">1</div>
              <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-semibold text-black whitespace-nowrap mt-1">Datos Generales</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-2"></div>
          <div className="flex items-center relative opacity-50">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-300 text-gray-700 text-sm font-bold z-10">2</div>
              <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-500 whitespace-nowrap mt-1">Asociar Materias</span>
          </div>
           <div className="flex-1 h-px bg-gray-300 mx-2"></div>
           <div className="flex items-center relative opacity-40">
             <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-300 text-gray-700 text-sm font-bold z-10">3</div>
           </div>
           <div className="flex-1 h-px bg-gray-300 mx-2"></div>
           <div className="flex items-center relative opacity-40">
             <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-300 text-gray-700 text-sm font-bold z-10">4</div>
           </div>
      </div>
      <div className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">Información General del Plan</h2>
            <div className="text-base text-gray-700">
                <span className="font-normal">Código generado automáticamente: </span>
                <span className="font-bold ml-2">{codigoPlan || '...'}</span> 
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Plan de Estudios *</label>
                  <input 
                    value={nombrePlan} 
                    onChange={(e) => setNombrePlan(e.target.value)} 
                    className={`w-full p-3 rounded-md border bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm ${errors.nombrePlan ? 'border-red-500' : 'border-gray-300'}`} 
                    placeholder="Ej: Licenciatura en Sistemas 2025" 
                  />
                  {errors.nombrePlan && <p className="text-xs text-red-600 mt-1">{errors.nombrePlan}</p>}
              </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Año de Creación *</label>
                  <select 
                    title='Seleccione un año'
                    value={añoCreacion} 
                    onChange={e => setAñoCreacion(e.target.value)} 
                    className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                      {[...Array(10)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={i} value={year}>{year}</option>
                      })}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duración Total *</label>
                  <div className="flex gap-4">
                      <input 
                        type="number" 
                        value={duracionTotal} 
                        onChange={e => setDuracionTotal(e.target.value)} 
                        className="w-1/3 p-3 rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        placeholder="5" 
                      />
                      <select title='Seleccione una duración' className="flex-1 p-3 rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option>Años</option>
                          <option>Cuatrimestres</option>
                      </select>
                  </div>
              </div>
              <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                  <textarea 
                    value={descripcion} 
                    onChange={(e) => setDescripcion(e.target.value)} 
                    className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    placeholder="Descripción opcional del plan de estudios..." 
                  />
              </div>
          </div>
      </div>
       <div className="mt-12 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Materias Asociadas</h3>
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#9ca3af" className="mb-4 opacity-50"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
             <p className="font-semibold text-gray-600 text-lg mb-1">No hay materias asociadas aún</p>
             <p className="text-sm text-gray-500">Las materias se agregarán en el siguiente paso</p>
          </div>
       </div>
       <div className="flex justify-end mt-8 pt-6">
           <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
             Siguiente
           </Button>
       </div>
    </div>
  );
  
  const renderStep2 = () => {    
    const duracionNumerica = parseInt(duracionTotal) || 1;
    const opcionesAño = Array.from({ length: duracionNumerica }, (_, i) => numberToAño(i + 1));

    const handleUpdateCorrelativas = (materiaId: string, tipo: 'cursada' | 'examen', nuevasCorrelativas: string[]) => {
      setMateriasAsociadas(prevMaterias => 
        prevMaterias.map(m => {
          if (m.materiaId === materiaId) {
            return {
              ...m,
              correlativasCursada: tipo === 'cursada' ? nuevasCorrelativas : m.correlativasCursada,
              correlativasExamen: tipo === 'examen' ? nuevasCorrelativas : m.correlativasExamen,
            };
          }
          return m;
        })
      );
    };

    return (
      <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-100 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Plan de Estudios</h1>
            <p className="text-base text-gray-600">Paso 2: Configurar materias y correlatividades</p>
          </div>
          <button onClick={() => setStep(1)} className="text-sm font-semibold text-gray-700 hover:underline">
            ← Volver a Datos Generales
          </button>
        </div>

        <div className="flex items-center w-full mb-12 px-4">
            <div className="flex items-center relative">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white text-sm font-bold z-10">1</div>
                <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-semibold text-black whitespace-nowrap mt-1">Datos Generales</span>
            </div>
            <div className="flex-1 h-0.5 bg-black mx-2"></div>
            <div className="flex items-center relative">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white text-sm font-bold z-10">2</div>
                <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-semibold text-black whitespace-nowrap mt-1">Asociar Materias</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
            <div className="flex items-center relative opacity-50">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-300 text-gray-700 text-sm font-bold z-10">3</div>
                <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-500 whitespace-nowrap mt-1">Correlatividades</span>
            </div>
        </div>

        {serverError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-4">{serverError}</p>}

        <div className="border border-gray-200 rounded-lg p-6 mb-10">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Agregar Nueva Materia</h3>
            <div className="grid grid-cols-1 md:grid-cols-10 gap-x-6 gap-y-4 items-end">
                <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Materia</label>
                    <select title='Seleccione una materia existente' value={nombreNuevaMateria} onChange={e => setNombreNuevaMateria(e.target.value)} className="w-full p-3 rounded-md border border-gray-300 bg-white shadow-sm">
                        <option value="">Seleccione una materia existente</option>
                        {materiasDisponibles.map(m => <option key={m.codigo} value={m.nombre}>{m.nombre}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
                    <select title='Seleccione un año' value={añoNuevaMateria} onChange={e => setAñoNuevaMateria(e.target.value)} className="w-full p-3 rounded-md border border-gray-300 bg-white shadow-sm">
                      {opcionesAño.map(opcion => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cuatrimestre</label>
                    <select title='Seleccione un cuatrimestre' value={cuatrimestreNuevaMateria} onChange={e => setCuatrimestreNuevaMateria(e.target.value)} className="w-full p-3 rounded-md border border-gray-300 bg-white shadow-sm">
                        <option>1er Cuatrimestre</option> <option>2do Cuatrimestre</option> <option>Anual</option>
                    </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                    <button onClick={handleAgregarMateria} className="w-full md:w-auto bg-gray-800 text-white font-bold py-3 px-6 rounded-md hover:bg-black flex items-center justify-center">
                      <Plus className="mr-2 h-5 w-5" /> Agregar Materia
                    </button>
                </div>
            </div>
        </div>

        <div className="border border-gray-200 rounded-lg">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800">Materias del Plan de Estudios</h3>
              <p className="text-sm text-gray-600 mt-1">Gestionar materias y asignar correlatividades</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Materia</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Año/Cuatrimestre</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Correlativas Cursada</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Correlativas Examen</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {materiasAsociadas.map((m) => (
                            <tr key={m.materiaId}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{m.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.materiaId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${m.año} - ${m.cuatrimestre}`}</td>
                                <td className="px-6 py-4">
                                  <CorrelativasInput 
                                    materiasDisponibles={materiasAsociadas.filter(mat => mat.materiaId !== m.materiaId).map(mat => ({ codigo: mat.materiaId, nombre: mat.nombre }))}
                                    correlativasSeleccionadas={m.correlativasCursada}
                                    onUpdate={(nuevas) => handleUpdateCorrelativas(m.materiaId, 'cursada', nuevas)}
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <CorrelativasInput 
                                    materiasDisponibles={materiasAsociadas.filter(mat => mat.materiaId !== m.materiaId).map(mat => ({ codigo: mat.materiaId, nombre: mat.nombre }))}
                                    correlativasSeleccionadas={m.correlativasExamen}
                                    onUpdate={(nuevas) => handleUpdateCorrelativas(m.materiaId, 'examen', nuevas)}
                                  />
                                </td>
                                <td className="px-6 py-4"><button onClick={() => handleQuitarMateria(m.materiaId)}> a <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-600" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
              {materiasAsociadas.length} materias agregadas
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
           <button onClick={() => onCancel ? onCancel() : router.back()} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-md border border-gray-300 hover:bg-gray-100">
             Cancelar
           </button>
           <button onClick={handleSubmit} disabled={loading} className="bg-gray-800 text-white font-bold py-2 px-6 rounded-md hover:bg-black disabled:opacity-50">
             {loading ? 'Confirmando...' : 'Confirmar'}
           </button>
        </div>
      </div>
    );
  };

  return step === 1 ? renderStep1() : renderStep2();
}