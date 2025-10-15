"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, ListChecks } from 'lucide-react';
import Link from 'next/link';

interface FinalizacionPlanProps {
  planId: number;
  nombrePlan: string;
  materiasCount: number;
  onVolver: () => void;
}

export default function FinalizacionPlan({ 
  planId, 
  nombrePlan, 
  materiasCount, 
  onVolver 
}: FinalizacionPlanProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <div className="flex items-start">
            <div className="mr-4">
              <ListChecks className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Gestión de Materias</h4>
              <p className="text-sm text-blue-700">
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
      </div>
    </div>
  );
}