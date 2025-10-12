"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Book } from 'lucide-react';
import { 
  crearPlanDeEstudios, 
  verificarPlanExistente, 
  asociarMateriaAPlan,
  obtenerMateriasDePlan
} from './actions';
import { eliminarMateriaAsociada } from './eliminarMateriaAsociada';
import AsociarMaterias from './asociarMaterias';
import ListaMateriasAsociadas from './listaMateriasAsociadas';
import GestionCorrelativas from './gestionCorrelativas';

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

function generarCodigoPlan(): string {
  // Genera un código en formato DCIC-XX similar al de la imagen
  const prefijo = "DCIC";
  const numero = Math.floor(1 + Math.random() * 99).toString().padStart(2, '0');
  return `${prefijo}-${numero}`;
}

export default function CrearPlanForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // --- Step 1 States ---
  const [nombrePlan, setNombrePlan] = useState('');
  const [codigoPlan, setCodigoPlan] = useState('DCIC-01');
  const [añoCreacion, setAñoCreacion] = useState(new Date().getFullYear().toString());
  const [duracionTotal, setDuracionTotal] = useState('5');
  const [descripcion, setDescripcion] = useState('');
  
  // --- Step 2 States ---
  const [planId, setPlanId] = useState<number | null>(null);
  const [materiasAsociadas, setMateriasAsociadas] = useState<any[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  
  // --- Loading y Errores ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Generar código al cargar el componente
  useEffect(() => {
    setCodigoPlan(generarCodigoPlan());
  }, []);

  async function validateStep1() {
    const e: { [k: string]: string } = {};
    if (!nombrePlan.trim()) {
      e.nombrePlan = 'El nombre del plan es obligatorio';
    } else {
      // Verificar si ya existe un plan con el mismo nombre
      const planExistente = await verificarPlanExistente(nombrePlan);
      if (planExistente) {
        e.nombrePlan = 'Ya existe un plan de estudios con este nombre';
      }
    }
    
    if (!duracionTotal || parseInt(duracionTotal) <= 0) {
      e.duracionTotal = 'La duración debe ser un número positivo';
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  
  async function handleNextStep() {
    if (step === 1) {
      // Avanzar del paso 1 al paso 2
      setLoading(true);
      setServerError(null);
      
      if (await validateStep1()) {
        try {
          // Crear plan de estudios en la base de datos
          const result = await crearPlanDeEstudios({
            nombre: nombrePlan,
            anio_creacion: parseInt(añoCreacion),
            duracion: `${duracionTotal} Años`,
            descripcion,
            codigo: codigoPlan
          });
          
          if ('error' in result) {
            setServerError(result.error);
            setLoading(false);
            return;
          }
          
          // Guardar el ID del plan creado para usar en el paso 2
          setPlanId(result.id);
          
          // Avanzar al paso 2
          setStep(2);
          setLoading(false);
          
        } catch (error) {
          console.error('Error al crear el plan de estudios:', error);
          setServerError('Ocurrió un error al procesar la solicitud');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } else if (step === 2) {
      // Avanzar del paso 2 al paso 3 (correlatividades)
      setStep(3);
    } else if (step === 3) {
      // Avanzar del paso 3 al paso 4 (finalizar)
      // Por ahora, redirigiremos a la página administrativa
      if (onCancel) {
        onCancel();
      } else {
        router.push('/dashboard/administrativo');
      }
    }
  }
  
  // Función para manejar la vuelta al paso anterior
  function handleAnterior() {
    setStep(1);
  }
  
  // Estado para mensajes de éxito
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Función para asociar una materia al plan
  async function handleAsociarMateria(materiaId: number, anio: number, cuatrimestre: number) {
    if (!planId) return;
    
    setLoadingMaterias(true);
    setServerError(null);
    setSuccessMessage(null);
    
    try {
      const result = await asociarMateriaAPlan(
        planId,
        codigoPlan,
        {
          materia_id: materiaId,
          anio,
          cuatrimestre
        },
        materiasAsociadas.length + 1
      );
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Recargar las materias asociadas
      await cargarMateriasAsociadas();
      setSuccessMessage('Materia asociada correctamente al plan');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error al asociar materia:', error);
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Error al asociar la materia al plan');
      }
    } finally {
      setLoadingMaterias(false);
    }
  }
  
  // Función para eliminar una materia asociada
  async function handleRemoveMateria(id: number) {
    setLoadingMaterias(true);
    setServerError(null);
    setSuccessMessage(null);
    
    try {
      const result = await eliminarMateriaAsociada(id);
      if ('error' in result) {
        setServerError(result.error);
      } else {
        // Recargar la lista después de eliminar
        await cargarMateriasAsociadas();
        setSuccessMessage('Materia eliminada correctamente del plan');
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      setServerError('No se pudo eliminar la materia del plan');
    } finally {
      setLoadingMaterias(false);
    }
  }

  // Función para cargar las materias asociadas al plan
  async function cargarMateriasAsociadas() {
    if (!planId) return;
    
    setLoadingMaterias(true);
    try {
      const materias = await obtenerMateriasDePlan(planId);
      if (materias) {
        setMateriasAsociadas(materias);
      }
    } catch (error) {
      console.error('Error al cargar materias asociadas:', error);
      setServerError('No se pudieron cargar las materias asociadas');
    } finally {
      setLoadingMaterias(false);
    }
  }

  // Cargar materias asociadas cuando se tenga un planId
  useEffect(() => {
    if (planId) {
      cargarMateriasAsociadas();
    }
  }, [planId]);
  
  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    await handleNextStep();
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">Planes de Estudio &gt; Crear Nuevo Plan</div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Plan de Estudios</h1>
      </div>
      
      {/* Indicador de pasos */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="w-full absolute top-1/2 h-px bg-gray-200"></div>
        
        <div className="flex items-center justify-center relative z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 1 ? 'bg-slate-800 text-white' : 'bg-green-500 text-white'
          } text-sm font-medium`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <span className="absolute mt-10 text-xs font-medium">Datos Generales</span>
        </div>
        
        <div className="flex items-center justify-center relative z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 2 ? 'bg-slate-800 text-white' : 
            step > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
          } text-sm font-medium`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <span className={`absolute mt-10 text-xs font-medium ${step >= 2 ? '' : 'text-gray-500'}`}>Asociar Materias</span>
        </div>
        
        <div className="flex items-center justify-center relative z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 3 ? 'bg-slate-800 text-white' : 
            step > 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
          } text-sm font-medium`}>
            {step > 3 ? '✓' : '3'}
          </div>
          <span className={`absolute mt-10 text-xs font-medium ${step >= 3 ? '' : 'text-gray-500'}`}>Correlatividades</span>
        </div>
        
        <div className="flex items-center justify-center relative z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 4 ? 'bg-slate-800 text-white' : 'bg-gray-300 text-gray-500'
          } text-sm font-medium`}>
            4
          </div>
          <span className={`absolute mt-10 text-xs font-medium ${step >= 4 ? '' : 'text-gray-500'}`}>Finalizar</span>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {serverError}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Paso 1: Información General del Plan */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Información General del Plan</h2>
            
            <div className="flex justify-end mb-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Código generado automáticamente:</span>
                <span className="font-bold ml-2">{codigoPlan}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombrePlan" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan de Estudios *
                </label>
                <input
                  id="nombrePlan"
                  type="text"
                  value={nombrePlan}
                  onChange={(e) => setNombrePlan(e.target.value)}
                  placeholder="Ej: Licenciatura en Sistemas 2025"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.nombrePlan ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.nombrePlan && (
                  <p className="text-xs text-red-600 mt-1">{errors.nombrePlan}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="añoCreacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Año de Creación *
                </label>
                <select
                  id="añoCreacion"
                  title="Año de creación"
                  value={añoCreacion}
                  onChange={(e) => setAñoCreacion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={i} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label htmlFor="duracionTotal" className="block text-sm font-medium text-gray-700 mb-1">
                  Duración Total *
                </label>
                <div className="flex gap-3">
                  <input
                    id="duracionTotal"
                    type="number"
                    min="1"
                    max="10"
                    value={duracionTotal}
                    onChange={(e) => setDuracionTotal(e.target.value)}
                    className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.duracionTotal ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <select
                    title="Unidad de duración"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Años</option>
                  </select>
                </div>
                {errors.duracionTotal && (
                  <p className="text-xs text-red-600 mt-1">{errors.duracionTotal}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción opcional del plan de estudios..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Sección de materias asociadas - Vista previa */}
            <div className="mb-6 mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Materias Asociadas</h3>
              <div className="flex flex-col items-center justify-center py-14 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <Book className="w-12 h-12 text-gray-400 mb-2" />
                <p className="font-medium text-gray-600 text-base mb-1">No hay materias asociadas aún</p>
                <p className="text-sm text-gray-500">Las materias se agregarán en el siguiente paso</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Paso 2: Asociar Materias */}
        {step === 2 && (
          <div>
            {/* Componente para asociar materias */}
            <AsociarMaterias 
              planId={planId!}
              codigoPlan={codigoPlan}
              onAsociarMateria={handleAsociarMateria}
              onContinuar={handleNextStep}
              onAnterior={handleAnterior}
            />
            
            {/* Componente para listar materias asociadas */}
            <ListaMateriasAsociadas 
              materias={materiasAsociadas}
              loading={loadingMaterias}
              onRemoveMateria={handleRemoveMateria}
            />
          </div>
        )}
        
        {/* Paso 3: Gestionar correlatividades */}
        {step === 3 && (
          <div>
            <GestionCorrelativas 
              planId={planId!}
              materias={materiasAsociadas}
              onContinuar={handleNextStep}
              onAnterior={handleAnterior}
              loading={loading}
            />
          </div>
        )}
        
        {/* Botones de acción - solo visibles en el paso 1 */}
        {step === 1 && (
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancel ? onCancel() : router.push('/dashboard/administrativo')}
              className="px-4 py-2"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              variant="default" 
              disabled={loading}
              className="px-6 py-2"
            >
              {loading ? 'Procesando...' : 'Siguiente'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}