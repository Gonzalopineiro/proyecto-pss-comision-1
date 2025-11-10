"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { exportarAPDF, exportarAExcel } from '../utils';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar,
  Search,
  Filter,
  FileText,
  Sheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  obtenerAlumnosInscriptos,
  obtenerInfoCursada,
  obtenerInfoAdmin,
  type AlumnoInscripto,
  type CursadaInfo,
  type AdminInfo
} from '@/app/dashboard/administrativo/listas-cursadas/actions';


export default function DetalleCursadaPage() {
  const params = useParams();
  const cursadaId = params.cursadaId as string;
  
  const [alumnos, setAlumnos] = useState<AlumnoInscripto[]>([]);
  const [cursadaInfo, setCursadaInfo] = useState<CursadaInfo | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [alumnosData, cursadaData, adminData] = await Promise.all([
          obtenerAlumnosInscriptos(cursadaId),
          obtenerInfoCursada(cursadaId),
          obtenerInfoAdmin()
        ]);

        setAlumnos(alumnosData);
        setCursadaInfo(cursadaData);
        setAdminInfo(adminData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [cursadaId]);

  // Filtrar alumnos
  const alumnosFiltrados = alumnos.filter(alumno => {
    const term = searchTerm.trim().toLowerCase();
    const coincideBusqueda = !term || 
      alumno.nombre.toLowerCase().includes(term) ||
      alumno.apellido.toLowerCase().includes(term) ||
      alumno.legajo.toString().includes(term);
    
    const coincideEstado = filterEstado === 'todos' || 
      (filterEstado === 'pendiente' && (!alumno.estado || alumno.estado === 'pendiente')) ||
      alumno.estado === filterEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  // Contadores por estado
  const contadores = {
    todos: alumnos.length,
    aprobada: alumnos.filter(a => a.estado === 'aprobada').length,
    regular: alumnos.filter(a => a.estado === 'regular').length,
    sin_calificar: alumnos.filter(a => !a.estado || a.estado === 'pendiente').length
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      aprobada: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      regular: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      pendiente: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      sin_calificar: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };

    const labels = {
      aprobada: 'Aprobada',
      regular: 'Regular', 
      pendiente: 'Sin calificar',
      sin_calificar: 'Sin calificar'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado as keyof typeof estilos] || estilos.sin_calificar}`}>
        {labels[estado as keyof typeof labels] || 'Sin calificar'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Navegación */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/administrativo/listas-cursadas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Lista de Cursadas
          </Button>
        </Link>
      </div>

      {/* Encabezado principal con acciones */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lista de Inscriptos</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{cursadaInfo ? `${cursadaInfo.materia_nombre} - ${cursadaInfo.comision} · ${cursadaInfo.cuatrimestre}` : 'Cursada'}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => adminInfo && exportarAPDF(alumnosFiltrados, cursadaInfo, adminInfo)}
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => adminInfo && exportarAExcel(alumnosFiltrados, cursadaInfo, adminInfo)}
          >
            <Sheet className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      {/* Información compacta (fila de 4 cajas) */}
      {cursadaInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500">Materia</div>
            <div className="font-medium text-slate-900 dark:text-white">{cursadaInfo.materia_nombre}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500">Comisión</div>
            <div className="font-medium text-slate-900 dark:text-white">{cursadaInfo.comision}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500">Cuatrimestre</div>
            <div className="font-medium text-slate-900 dark:text-white">{cursadaInfo.cuatrimestre}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500">Alumnos Inscriptos</div>
            <div className="font-medium text-slate-900 dark:text-white">{cursadaInfo.alumnos_inscriptos}</div>
          </div>
        </div>
      )}

      {/* Acciones y Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Listado de Inscriptos
          </h2>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Total: {contadores.todos} alumnos inscriptos
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none z-10" aria-hidden />
              <Input
                placeholder="Buscar por nombre, apellido o legajo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                style={{ paddingLeft: '2.5rem' }}
                aria-label="Buscar por nombre, apellido o legajo"
              />
            </div>
          </div>
          
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="aprobada">Aprobados ({contadores.aprobada})</SelectItem>
              <SelectItem value="regular">Regulares ({contadores.regular})</SelectItem>
              <SelectItem value="pendiente">Sin calificar ({contadores.sin_calificar})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contadores */}
        <div className="flex gap-4 mt-4 text-sm">
          <span className="text-green-600 font-medium">
            {contadores.aprobada} Aprobados
          </span>
          <span className="text-yellow-600 font-medium">
            {contadores.regular} Regulares
          </span>
          <span className="text-gray-600 font-medium">
            {contadores.sin_calificar} Sin calificar
          </span>
        </div>
      </div>

      {/* Lista de Alumnos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Alumnos Inscriptos
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded ml-2">
              {alumnosFiltrados.length} 
              {searchTerm ? ` de ${contadores.todos} total` : ' alumnos'}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          {alumnosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                No hay alumnos que coincidan con la búsqueda
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay alumnos inscriptos en esta cursada.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-slate-900 dark:text-white">
                    Legajo
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-900 dark:text-white">
                    Alumno
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-900 dark:text-white">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-900 dark:text-white">
                    Estado Cursada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {alumnosFiltrados.map((alumno) => (
                  <tr key={alumno.id.toString()} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-4 px-6 text-slate-900 dark:text-white font-mono">
                      {alumno.legajo}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {alumno.nombre} {alumno.apellido}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {alumno.email}
                    </td>
                    <td className="py-4 px-6">
                      {getEstadoBadge(alumno.estado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}