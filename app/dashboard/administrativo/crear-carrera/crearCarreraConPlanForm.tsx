"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CrearCarreraForm from './crearCarreraForm';
import CrearPlanForm from '../crear-plan/crearPlanForm';

export type ModoCreacion = 'solo-carrera' | 'carrera-con-plan';

interface CrearCarreraConPlanFormProps {
  modo?: ModoCreacion;
}

export default function CrearCarreraConPlanForm({ modo = 'solo-carrera' }: CrearCarreraConPlanFormProps) {
  const router = useRouter();
  const [creandoPlan, setCreandoPlan] = useState(false);
  const [planCreadoId, setPlanCreadoId] = useState<number | null>(null);
  const [datosCarrera, setDatosCarrera] = useState<{
    nombre: string;
    departamento: string;
    codigo: string;
  } | null>(null);

  // Función que se llama cuando el usuario elige crear un nuevo plan
  const handleCrearNuevoPlan = (datos: { nombre: string; departamento: string; codigo: string }) => {
    setDatosCarrera(datos);
    setCreandoPlan(true);
  };

  // Función que se llama cuando se termina de crear el plan
  const handlePlanCreado = (planId: number) => {
    setPlanCreadoId(planId);
    setCreandoPlan(false);
    // El formulario de carrera se actualizará automáticamente con el plan seleccionado
  };

  // Función para cancelar la creación del plan y volver al formulario de carrera
  const handleCancelarPlan = () => {
    setCreandoPlan(false);
    setDatosCarrera(null);
  };

  if (creandoPlan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto mt-6">
              {/* Header con breadcrumb */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">
                  Crear Carrera &gt; Crear Plan de Estudios
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Crear Plan para "{datosCarrera?.nombre}"
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Complete el plan de estudios que se asociará a la carrera
                </p>
              </div>

              <CrearPlanForm 
                onCancel={handleCancelarPlan}
                onPlanCreado={handlePlanCreado}
                tituloPersonalizado={`Plan para ${datosCarrera?.nombre}`}
                contextoCarrera={datosCarrera}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      {planCreadoId && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">Plan creado exitosamente</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            El plan de estudios ha sido creado y está seleccionado automáticamente. 
            Complete los datos de la carrera para finalizar el proceso.
          </p>
        </div>
      )}
      
      <CrearCarreraForm 
        onCrearNuevoPlan={handleCrearNuevoPlan}
        planCreadoId={planCreadoId}
        modoIntegrado={modo === 'carrera-con-plan'}
      />
    </div>
  );
}