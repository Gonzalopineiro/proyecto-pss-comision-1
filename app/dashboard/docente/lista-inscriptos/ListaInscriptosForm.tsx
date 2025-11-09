"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Users, Calendar, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { 
  obtenerCarreras, 
  obtenerMateriasPorCarrera,
  obtenerListaInscriptos,
  type Carrera,
  type Materia,
  type InscriptoData 
} from './actions';
import { exportarAPDF, exportarAExcel } from './exportUtils';

interface ListaInscriptosFormProps {
  userRole: 'docente' | 'administrativo';
}

export default function ListaInscriptosForm({ userRole }: ListaInscriptosFormProps) {
  // Estados del formulario
  const [carreraId, setCarreraId] = useState<string>('');
  const [materiaId, setMateriaId] = useState<string>('');
  const [anio, setAnio] = useState<string>('');
  const [cuatrimestre, setCuatrimestre] = useState<string>('');

  // Estados de datos
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [inscriptos, setInscriptos] = useState<InscriptoData[]>([]);

  // Estados de carga
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [loadingInscriptos, setLoadingInscriptos] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Estados de error
  const [error, setError] = useState<string | null>(null);

  // Cargar carreras al montar el componente
  useEffect(() => {
    async function fetchCarreras() {
      try {
        setLoadingCarreras(true);
        const carrerasData = await obtenerCarreras();
        setCarreras(carrerasData);
      } catch (err) {
        setError('Error al cargar las carreras');
        console.error(err);
      } finally {
        setLoadingCarreras(false);
      }
    }
    fetchCarreras();
  }, []);

  // Cargar materias cuando cambia la carrera
  useEffect(() => {
    if (carreraId) {
      async function fetchMaterias() {
        try {
          setLoadingMaterias(true);
          setMateriaId(''); // Reset materia selection
          const materiasData = await obtenerMateriasPorCarrera(carreraId, userRole);
          setMaterias(materiasData);
        } catch (err) {
          setError('Error al cargar las materias');
          console.error(err);
        } finally {
          setLoadingMaterias(false);
        }
      }
      fetchMaterias();
    } else {
      setMaterias([]);
      setMateriaId('');
    }
  }, [carreraId, userRole]);

  // Obtener año actual para las opciones
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Cargar todas las materias cuando no hay carrera seleccionada
  useEffect(() => {
    if (!carreraId) {
      async function fetchTodasLasMaterias() {
        try {
          setLoadingMaterias(true);
          setMateriaId(''); // Reset materia selection
          const materiasData = await obtenerMateriasPorCarrera('', userRole);
          setMaterias(materiasData);
        } catch (err) {
          setError('Error al cargar las materias');
          console.error(err);
        } finally {
          setLoadingMaterias(false);
        }
      }
      fetchTodasLasMaterias();
    }
  }, [userRole]);

  // Función para buscar inscriptos (ahora con filtros opcionales)
  const buscarInscriptos = async () => {
    // Validar que al menos carrera, materia, año y cuatrimestre estén seleccionados
    if (!carreraId || !materiaId || !anio || !cuatrimestre) {
      setError('Por favor seleccione carrera, materia, año y cuatrimestre para buscar los inscriptos a la cursada');
      return;
    }

    try {
      setLoadingInscriptos(true);
      setError(null);
      const data = await obtenerListaInscriptos({
        carreraId,
        materiaId,
        anio: parseInt(anio),
        cuatrimestre
      });
      setInscriptos(data);
    } catch (err) {
      setError('Error al obtener la lista de inscriptos');
      console.error(err);
    } finally {
      setLoadingInscriptos(false);
    }
  };

  // Función para exportar a PDF
  const handleExportPDF = async () => {
    if (inscriptos.length === 0) return;

    try {
      setExportingPDF(true);
      await exportarAPDF({
        inscriptos,
        filtros: {
          carrera: carreraId ? carreras.find(c => c.id === parseInt(carreraId))?.nombre || 'Todas las carreras' : 'Todas las carreras',
          materia: materiaId ? materias.find(m => m.id === parseInt(materiaId))?.nombre || 'Todas las materias' : 'Todas las materias',
          anio: anio ? parseInt(anio) : 0,
          cuatrimestre: cuatrimestre || 'Todos los cuatrimestres'
        }
      });
    } catch (err) {
      setError('Error al exportar a PDF');
      console.error(err);
    } finally {
      setExportingPDF(false);
    }
  };

  // Función para exportar a Excel
  const handleExportExcel = async () => {
    if (inscriptos.length === 0) return;

    try {
      setExportingExcel(true);
      await exportarAExcel({
        inscriptos,
        filtros: {
          carrera: carreraId ? carreras.find(c => c.id === parseInt(carreraId))?.nombre || 'Todas las carreras' : 'Todas las carreras',
          materia: materiaId ? materias.find(m => m.id === parseInt(materiaId))?.nombre || 'Todas las materias' : 'Todas las materias',
          anio: anio ? parseInt(anio) : 0,
          cuatrimestre: cuatrimestre || 'Todos los cuatrimestres'
        }
      });
    } catch (err) {
      setError('Error al exportar a Excel');
      console.error(err);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de filtros */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Filtros de Búsqueda
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Carrera */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              value={carreraId}
              onChange={(e) => setCarreraId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingCarreras}
              required
            >
              <option value="">
                {loadingCarreras ? 'Cargando carreras...' : 'Seleccione una carrera'}
              </option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Materia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Materia <span className="text-red-500">*</span>
            </label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loadingMaterias || !carreraId}
              required
            >
              <option value="">
                {loadingMaterias 
                  ? 'Cargando materias...' 
                  : !carreraId
                    ? 'Seleccione primero una carrera'
                    : 'Seleccione una materia'
                }
              </option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.codigo_materia} - {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Año <span className="text-red-500">*</span>
            </label>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un año</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Cuatrimestre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cuatrimestre <span className="text-red-500">*</span>
            </label>
            <select
              value={cuatrimestre}
              onChange={(e) => setCuatrimestre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un cuatrimestre</option>
              <option value="1">Primer Cuatrimestre</option>
              <option value="2">Segundo Cuatrimestre</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={buscarInscriptos}
            disabled={loadingInscriptos}
            className="w-full sm:w-auto"
          >
            {loadingInscriptos ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Buscar Inscriptos
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      {inscriptos.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Lista de Inscriptos
              </h2>
              <Badge variant="secondary" className="ml-2">
                {inscriptos.length} alumnos
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exportingPDF || inscriptos.length === 0}
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={exportingExcel || inscriptos.length === 0}
              >
                {exportingExcel ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
            </div>
          </div>

          {/* Información del reporte */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Carrera:</span>
                <p className="text-slate-900 dark:text-white">
                  {carreras.find(c => c.id === parseInt(carreraId))?.nombre}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Materia:</span>
                <p className="text-slate-900 dark:text-white">
                  {materias.find(m => m.id === parseInt(materiaId))?.nombre}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Período:</span>
                <p className="text-slate-900 dark:text-white">
                  {cuatrimestre} Cuatrimestre {anio}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Generado:</span>
                <p className="text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de inscriptos */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Legajo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Alumno
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Estado Cursada
                  </th>
                </tr>
              </thead>
              <tbody>
                {inscriptos.map((inscripto, index) => (
                  <tr 
                    key={`${inscripto.legajo}-${inscripto.email}-${index}`}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-mono">
                      {inscripto.legajo}
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">
                      {inscripto.nombre}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inscripto.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={
                          inscripto.estado === 'Aprobado' ? 'default' :
                          inscripto.estado === 'Desaprobado' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {inscripto.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Estado vacío después de buscar */}
      {loadingInscriptos === false && inscriptos.length === 0 && materiaId && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No hay inscriptos
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No se encontraron alumnos inscriptos para los filtros seleccionados.
          </p>
        </Card>
      )}
    </div>
  );
}