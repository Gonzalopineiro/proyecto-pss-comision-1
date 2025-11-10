"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { obtenerTodasLasCursadas, type CursadaInfo } from './actions';

export default function ListaCursadasPage() {
  const [cursadas, setCursadas] = useState<CursadaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCursadas() {
      try {
        setLoading(true);
        const data = await obtenerTodasLasCursadas();
        setCursadas(data);
      } catch (error) {
        console.error('Error al cargar cursadas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCursadas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Encabezado */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/administrativo">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <List className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Lista de Cursadas Activas
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestión y visualización de todas las cursadas del sistema académico
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Cursadas */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Cursadas Activas
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded ml-2">
              {cursadas.length} cursadas
            </span>
          </h2>
        </div>

        <div className="p-6">
          {cursadas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                No hay cursadas activas
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                No hay cursadas activas registradas en el sistema.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cursadas.map((cursada) => (
                <div 
                  key={cursada.id.toString()} 
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                >
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {cursada.materia_codigo}
                        </h3>
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                          {cursada.comision}
                        </span>
                      </div>
                      
                      <h4 className="text-lg text-slate-700 dark:text-slate-300 mb-3">
                        {cursada.materia_nombre}
                      </h4>
                    </div>
                    
                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Cuatrimestre {cursada.cuatrimestre} - {cursada.anio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{cursada.alumnos_inscriptos} alumnos inscriptos</span>
                      </div>
                      {cursada.docente_nombre && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{cursada.docente_nombre} {cursada.docente_apellido}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <Link href={`/dashboard/administrativo/listas-cursadas/${cursada.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Ver Inscriptos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}