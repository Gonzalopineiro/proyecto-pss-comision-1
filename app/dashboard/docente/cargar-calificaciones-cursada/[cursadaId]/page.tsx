"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar,
  Download,
  Save,
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Sheet,
  Check,
  X,
  Clock,
  UserX,
  CheckCircle,
  AlertCircle
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
import ConfirmationPopup from '@/components/ui/confirmation-popup';
import ConfirmDialog from '@/components/ui/confirm-dialog';

import { 
  obtenerAlumnosInscriptos, 
  obtenerInfoCursada, 
  obtenerInfoDocente,
  actualizarCalificaciones,
  publicarNotas,
  verificarNotasPublicadas,
  type AlumnoInscripto, 
  type CursadaInfo,
  type DocenteInfo
} from '../actions';
import { exportarAPDF, exportarAExcel } from '../utils';

export default function ListaAlumnosPage() {
  const params = useParams();
  const cursadaId = params.cursadaId as string;
  
  const [alumnos, setAlumnos] = useState<AlumnoInscripto[]>([]);
  const [cursadaInfo, setCursadaInfo] = useState<CursadaInfo | null>(null);
  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  
  // Estados para manejo de calificaciones
  const [notasPublicadas, setNotasPublicadas] = useState(false);
  const [publicandoNotas, setPublicandoNotas] = useState(false);
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const [cambiosGuardados, setCambiosGuardados] = useState(false);
  const [actualizandoNota, setActualizandoNota] = useState<string | null>(null);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  
  // Estado para trackear cambios locales que necesitan ser guardados
  const [cambiosLocales, setCambiosLocales] = useState<Map<number, string>>(new Map());
  
  // Estados para popups de confirmación
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [alumnosData, cursadaData, docenteData, notasPublicadasData] = await Promise.all([
          obtenerAlumnosInscriptos(cursadaId),
          obtenerInfoCursada(cursadaId),
          obtenerInfoDocente(),
          verificarNotasPublicadas(cursadaId)
        ]);

        setAlumnos(alumnosData);
        setCursadaInfo(cursadaData);
        setDocenteInfo(docenteData);
        setNotasPublicadas(notasPublicadasData);
        
        // Si las notas están publicadas, no hay cambios pendientes
        if (notasPublicadasData) {
          setCambiosGuardados(true);
          setCambiosPendientes(false);
        }
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
    
    const coincideEstado = filterEstado === 'todos' || alumno.estado === filterEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  // Contadores por estado
  const contadores = {
    todos: alumnos.length,
    aprobada: alumnos.filter(a => a.estado === 'aprobada').length,
    regular: alumnos.filter(a => a.estado === 'regular').length, // Desaprobado
    abandonada: alumnos.filter(a => a.estado === 'abandonada').length, // Ausente
    sin_calificar: alumnos.filter(a => !a.estado || a.estado === 'pendiente').length
  };

  // Verificar si todas las calificaciones están cargadas
  const todasCalificadas = alumnos.length > 0 && contadores.sin_calificar === 0;
  // Verificar si se puede publicar (todas calificadas Y cambios guardados)
  const puedePublicar = todasCalificadas && cambiosGuardados && !cambiosPendientes;

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExportarPDF = () => {
    if (!cursadaInfo || !docenteInfo || alumnos.length === 0) return;
    exportarAPDF(alumnosFiltrados, cursadaInfo, docenteInfo);
  };

  const handleExportarExcel = () => {
    if (!cursadaInfo || !docenteInfo || alumnos.length === 0) return;
    exportarAExcel(alumnosFiltrados, cursadaInfo, docenteInfo);
  };

  // Función para actualizar el estado de un alumno (solo en estado local)
  const handleActualizarEstado = async (alumnoId: number, nuevoEstado: string) => {
    if (notasPublicadas) return;
    
    try {
      setActualizandoNota(alumnoId.toString());
      
      // Actualizar estado local inmediatamente
      setAlumnos(prevAlumnos => 
        prevAlumnos.map(alumno => 
          alumno.id === alumnoId 
            ? { ...alumno, estado: nuevoEstado }
            : alumno
        )
      );
      
      // Guardar el cambio en los cambios locales
      setCambiosLocales(prev => {
        const newChanges = new Map(prev);
        newChanges.set(alumnoId, nuevoEstado);
        return newChanges;
      });
      
      // Marcar que hay cambios pendientes de guardar
      setCambiosPendientes(true);
      setCambiosGuardados(false);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      
      // Mostrar popup de error
      setErrorMessage({
        title: 'Error al Actualizar',
        message: 'No se pudo actualizar la calificación. Inténtelo nuevamente.'
      });
      setShowErrorPopup(true);
    } finally {
      setActualizandoNota(null);
    }
  };

  // Función para guardar cambios en la base de datos
  const handleGuardarCambios = async () => {
    if (!cambiosPendientes || cambiosLocales.size === 0) return;

    try {
      setGuardandoCambios(true);
      
      // Preparar las calificaciones para enviar al backend
      const calificacionesParaActualizar = Array.from(cambiosLocales.entries()).map(([inscripcionId, estado]) => ({
        inscripcionId,
        estado
      }));
      
      console.log('Guardando calificaciones:', calificacionesParaActualizar);
      
      // Llamar a la función del backend
      await actualizarCalificaciones(cursadaId, calificacionesParaActualizar);
      
      // Limpiar cambios locales
      setCambiosLocales(new Map());
      setCambiosPendientes(false);
      setCambiosGuardados(true);
      
      // Mostrar popup de éxito
      setSuccessMessage({
        title: '¡Cambios Guardados!',
        message: 'Las calificaciones se han guardado correctamente en la base de datos.'
      });
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error guardando cambios:', error);
      
      // Mostrar popup de error
      setErrorMessage({
        title: 'Error al Guardar',
        message: 'No se pudieron guardar los cambios. Verifique su conexión e inténtelo nuevamente.'
      });
      setShowErrorPopup(true);
    } finally {
      setGuardandoCambios(false);
    }
  };

  // Función para publicar notas
  const handlePublicarNotas = async () => {
    if (!puedePublicar) {
      let mensaje = '';
      if (!todasCalificadas) {
        mensaje = 'Debe calificar a todos los alumnos antes de publicar las notas.';
      } else if (cambiosPendientes) {
        mensaje = 'Debe guardar los cambios antes de publicar las notas.';
      } else if (!cambiosGuardados) {
        mensaje = 'Debe guardar las calificaciones antes de publicar.';
      }
      
      setErrorMessage({
        title: 'No se Puede Publicar',
        message: mensaje
      });
      setShowErrorPopup(true);
      return;
    }

    // Mostrar diálogo de confirmación
    setShowPublishConfirm(true);
  };

  // Función para confirmar la publicación de notas
  const handleConfirmarPublicacion = async () => {
    setShowPublishConfirm(false);

    try {
      setPublicandoNotas(true);
      
      // Llamar a la función del backend para publicar
      await publicarNotas(cursadaId);
      
      setNotasPublicadas(true);
      
      // Mostrar popup de éxito
      setSuccessMessage({
        title: '¡Notas Publicadas!',
        message: 'Las notas se han publicado correctamente. Los estudiantes han sido notificados y podrán ver sus calificaciones.'
      });
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error publicando notas:', error);
      
      // Mostrar popup de error
      setErrorMessage({
        title: 'Error al Publicar',
        message: error instanceof Error 
          ? error.message 
          : 'No se pudieron publicar las notas. Verifique su conexión e inténtelo nuevamente.'
      });
      setShowErrorPopup(true);
    } finally {
      setPublicandoNotas(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      aprobada: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      regular: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', // Desaprobado
      abandonada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', // Ausente
      pendiente: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };

    const labels = {
      aprobada: 'Aprobado',
      regular: 'Desaprobado', // Cambiar a Desaprobado
      abandonada: 'Ausente', // Cambiar a Ausente
      pendiente: 'Sin calificar'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado as keyof typeof estilos] || estilos.pendiente}`}>
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
        <Link href="/dashboard/docente/cargar-calificaciones-cursada">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cursadas
          </Button>
        </Link>
      </div>

      {/* Encabezado principal con acciones */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cargar Calificaciones de Cursada</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{cursadaInfo ? `${cursadaInfo.materia_nombre} - ${cursadaInfo.comision} · ${cursadaInfo.cuatrimestre}` : 'Cursada'}</p>
        </div>

        <div className="flex items-center gap-3">
          {notasPublicadas ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Notas Publicadas</span>
            </div>
          ) : (
            <>
              {/* Botón Guardar Cambios */}
              <Button 
                onClick={handleGuardarCambios}
                disabled={!cambiosPendientes || guardandoCambios || notasPublicadas}
                variant="outline"
                className={`${
                  cambiosPendientes && !guardandoCambios
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-50' 
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {guardandoCambios ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                    {cambiosPendientes && (
                      <span className="ml-1 w-2 h-2 bg-orange-400 rounded-full"></span>
                    )}
                  </>
                )}
              </Button>

              {/* Botón Publicar Notas */}
              <Button 
                onClick={handlePublicarNotas}
                disabled={!puedePublicar || publicandoNotas}
                className={`${
                  puedePublicar
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {publicandoNotas ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publicar Notas ({alumnos.length - contadores.sin_calificar}/{alumnos.length})
                  </>
                )}
              </Button>
            </>
          )}
          
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white" 
            onClick={handleExportarPDF}
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white" 
            onClick={handleExportarExcel}
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

      {/* Estado de Calificaciones */}
      {!notasPublicadas && (
        <div className={`rounded-lg p-4 mb-6 ${
          puedePublicar
            ? 'bg-green-50 border border-green-200' 
            : cambiosPendientes
            ? 'bg-orange-50 border border-orange-200'
            : todasCalificadas && cambiosGuardados
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {puedePublicar ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : cambiosPendientes ? (
              <Save className="h-5 w-5 text-orange-600" />
            ) : todasCalificadas && cambiosGuardados ? (
              <CheckCircle className="h-5 w-5 text-blue-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className={`font-medium ${
                puedePublicar ? 'text-green-800' 
                : cambiosPendientes ? 'text-orange-800'
                : todasCalificadas && cambiosGuardados ? 'text-blue-800'
                : 'text-yellow-800'
              }`}>
                {puedePublicar 
                  ? '¡Listo para publicar las notas!' 
                  : cambiosPendientes
                  ? 'Hay cambios sin guardar'
                  : todasCalificadas && cambiosGuardados
                  ? 'Cambios guardados - Listo para publicar'
                  : `Faltan ${contadores.sin_calificar} alumnos por calificar`
                }
              </p>
              <p className={`text-sm ${
                puedePublicar ? 'text-green-600' 
                : cambiosPendientes ? 'text-orange-600'
                : todasCalificadas && cambiosGuardados ? 'text-blue-600'
                : 'text-yellow-600'
              }`}>
                {puedePublicar 
                  ? 'Puede publicar las notas para notificar a los estudiantes.'
                  : cambiosPendientes
                  ? 'Guarde los cambios antes de publicar las notas.'
                  : todasCalificadas && cambiosGuardados
                  ? 'Puede proceder a publicar las notas.'
                  : 'Complete todas las calificaciones y guarde los cambios si desea publicar las notas.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Acciones y Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {notasPublicadas ? 'Calificaciones Publicadas' : 'Cargar Calificaciones'}
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none z-10" aria-hidden />
              <Input
                placeholder="Buscar por nombre o legajo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                style={{ paddingLeft: '2.5rem' }}
                aria-label="Buscar por nombre o legajo"
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
              <SelectItem value="regular">Desaprobados ({contadores.regular})</SelectItem>
              <SelectItem value="abandonada">Ausentes ({contadores.abandonada})</SelectItem>
              <SelectItem value="pendiente">Sin calificar ({contadores.sin_calificar})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contadores */}
        <div className="flex gap-4 mt-4 text-sm">
          <span className="text-green-600 font-medium">
            {contadores.aprobada} Aprobados
          </span>
          <span className="text-red-600 font-medium">
            {contadores.regular} Desaprobados
          </span>
          <span className="text-gray-600 font-medium">
            {contadores.abandonada} Ausentes
          </span>
          <span className="text-gray-600 font-medium">
            {contadores.sin_calificar} Sin calificar
          </span>
          {cambiosPendientes && (
            <span className="text-orange-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              Cambios pendientes
            </span>
          )}
        </div>
      </div>

      {/* Lista de Alumnos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Lista de Alumnos
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded ml-2">
              {alumnosFiltrados.length} alumnos
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          {alumnosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                No hay alumnos que coincidan con los filtros
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Ajusta los filtros de búsqueda o estado.
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
                  <th className="text-left py-3 px-6 font-semibold text-slate-900 dark:text-white">
                    Calificación
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
                    <td className="py-4 px-6">
                      {notasPublicadas ? (
                        <div className="flex items-center gap-2">
                          {getEstadoBadge(alumno.estado)}
                          <span className="text-xs text-gray-500">Publicado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Select 
                            value={alumno.estado || 'pendiente'} 
                            onValueChange={(valor) => handleActualizarEstado(alumno.id, valor)}
                            disabled={actualizandoNota === alumno.id.toString()}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-600" />
                                  Sin calificar
                                </div>
                              </SelectItem>
                              <SelectItem value="aprobada">
                                <div className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-600" />
                                  Aprobado
                                </div>
                              </SelectItem>
                              <SelectItem value="regular">
                                <div className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-red-600" />
                                  Desaprobado
                                </div>
                              </SelectItem>
                              <SelectItem value="abandonada">
                                <div className="flex items-center gap-2">
                                  <UserX className="h-4 w-4 text-gray-600" />
                                  Ausente
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {actualizandoNota === alumno.id.toString() && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Popups de confirmación */}
      <ConfirmationPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successMessage.title}
        message={successMessage.message}
        type="success"
      />

      <ConfirmationPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title={errorMessage.title}
        message={errorMessage.message}
        type="error"
      />

      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        title="Confirmar Publicación de Notas"
        message="¿Está seguro de que desea publicar las notas? Una vez publicadas no se pueden modificar y los estudiantes serán notificados."
        onConfirm={handleConfirmarPublicacion}
        confirmLabel="Publicar Notas"
        cancelLabel="Cancelar"
        loading={publicandoNotas}
      />
    </div>
  );
}