"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, ListChecks, Calendar, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { crearCursadasParaPlan } from './actions';

interface FinalizacionPlanProps {
  planId: number;
  nombrePlan: string;
  materiasCount: number;
  onVolver: () => void;
  onPlanCreado?: (planId: number) => void;
  planCreadoId?: number | null;
}

export default function FinalizacionPlan({ 
  planId, 
  nombrePlan, 
  materiasCount, 
  onVolver,
  onPlanCreado,
  planCreadoId
}: FinalizacionPlanProps) {
  const [creandoCursadas, setCreandoCursadas] = useState(false);
  const [cursadasCreadas, setCursadasCreadas] = useState<number | null>(null);
  const [errorCursadas, setErrorCursadas] = useState<string | null>(null);
  const [anioAcademico, setAnioAcademico] = useState(new Date().getFullYear());

  const handleCrearCursadas = async () => {
    setCreandoCursadas(true);
    setErrorCursadas(null);
    
    try {
      const resultado = await crearCursadasParaPlan(planId, anioAcademico);
      
      if ('success' in resultado) {
        setCursadasCreadas(resultado.cursadasCreadas);
      } else {
        setErrorCursadas(resultado.error);
      }
    } catch (error) {
      setErrorCursadas('Error inesperado al crear cursadas');
      console.error('Error al crear cursadas:', error);
    } finally {
      setCreandoCursadas(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 mt-4">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Plan de estudios creado exitosamente!</h2>
        <p className="text-gray-600 mb-4 max-w-lg">
          Has completado la creación del plan de estudios <span className="font-semibold">{nombrePlan}</span> con {materiasCount} materias asociadas y sus correlatividades.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-3">Resumen del plan</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">ID del plan:</span>
            <span className="font-medium">{planId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Nombre del plan:</span>
            <span className="font-medium">{nombrePlan}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Materias asociadas:</span>
            <span className="font-medium">{materiasCount}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Estado:</span>
            <span className="font-medium text-green-600">Activo</span>
          </div>
        </div>
      </div>

      {/* Sección para crear cursadas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start mb-4">
          <Calendar className="w-6 h-6 text-blue-600 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Generar Cursadas Automáticamente</h3>
            <p className="text-sm text-blue-700 mb-4">
              Puedes crear automáticamente las cursadas para todas las materias del plan que tengan docentes asignados.
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-blue-800">
                Año académico:
              </label>
              <input
                type="number"
                value={anioAcademico}
                onChange={(e) => setAnioAcademico(parseInt(e.target.value))}
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 2}
                placeholder="Año académico"
                className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {cursadasCreadas !== null && (
              <div className="bg-green-100 border border-green-300 rounded-md p-3 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    {cursadasCreadas} cursadas creadas exitosamente para el año {anioAcademico}
                  </span>
                </div>
              </div>
            )}

            {errorCursadas && (
              <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{errorCursadas}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleCrearCursadas}
              disabled={creandoCursadas || cursadasCreadas !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creandoCursadas ? 'Creando cursadas...' : 
               cursadasCreadas !== null ? 'Cursadas creadas' : 
               'Crear Cursadas'}
              <Users className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
          <div className="flex items-start">
            <div className="mr-4">
              <ListChecks className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Gestión de Materias</h4>
              <p className="text-sm text-gray-700">
                Puedes añadir o eliminar materias de este plan en cualquier momento desde el panel administrativo.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-5">
          <div className="flex items-start">
            <div className="mr-4">
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-800 mb-1">Asignación a Carreras</h4>
              <p className="text-sm text-purple-700">
                Recuerda asignar este plan a las carreras correspondientes para que esté disponible para los alumnos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        {onPlanCreado ? (
          // Modo integrado con carrera
          <>
            <Button 
              variant="outline" 
              className="px-6 py-2"
              onClick={onVolver}
            >
              Cancelar
            </Button>
            <Button 
              variant="default"
              className="px-6 py-2 bg-green-600 hover:bg-green-700"
              onClick={() => onPlanCreado(planId)}
            >
              Usar este Plan para la Carrera
            </Button>
          </>
        ) : (
          // Modo standalone
          <>
            <Link href="/dashboard/administrativo" passHref>
              <Button 
                variant="outline" 
                className="px-6 py-2"
              >
                Volver al Dashboard
              </Button>
            </Link>
            
            <Button 
              variant="default"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
              onClick={onVolver}
            >
              Crear Otro Plan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}