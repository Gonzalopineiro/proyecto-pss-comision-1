"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, BookOpen, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmationPopup from '@/components/ui/confirmation-popup';
import {
  crearMesaExamen,
  obtenerMateriasDocente,
  verificarMesaExistente,
  type MesaExamenData,
  type Materia
} from './actions';

export default function CrearMesaForm() {
  const router = useRouter();

  // Estados del formulario
  const [materiaId, setMateriaId] = useState<string>('');
  const [fechaExamen, setFechaExamen] = useState('');
  const [horaExamen, setHoraExamen] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [comentarios, setComentarios] = useState('');

  // Estados de soporte
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [mesaCreada, setMesaCreada] = useState<{ materia: string; fecha: string; hora: string } | null>(null);

  // Cargar materias al montar el componente
  useEffect(() => {
    async function fetchMaterias() {
      try {
        const materiasData = await obtenerMateriasDocente();
        setMaterias(materiasData);
        if (materiasData.length === 0) {
          setServerError('No se encontraron materias asignadas a su perfil de docente.');
        }
      } catch (error) {
        setServerError('Error al cargar las materias disponibles.');
      }
    }

    fetchMaterias();
  }, []);

  // Función de validación
  const validate = async (): Promise<boolean> => {
    const e: { [k: string]: string } = {};

    if (!materiaId) e.materiaId = 'Debe seleccionar una materia';
    if (!fechaExamen) e.fechaExamen = 'La fecha del examen es obligatoria';
    if (!horaExamen) e.horaExamen = 'La hora del examen es obligatoria';
    
    // Validar ubicación (debe contener "aula" y un número)
    if (!ubicacion.trim()) {
      e.ubicacion = 'La ubicación es obligatoria';
    } else {
      const ubicacionLower = ubicacion.toLowerCase().trim();
      const contieneAula = ubicacionLower.includes('aula');
      const contieneNumero = /\d/.test(ubicacion);
      
      if (!contieneAula || !contieneNumero) {
        e.ubicacion = 'La ubicación debe incluir "Aula" y un número (ej: Aula 205)';
      }
    }

    // Validar fecha del examen
    if (fechaExamen) {
      const [year, month, day] = fechaExamen.split('-');
      const fechaSeleccionada = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Fecha límite: 1 año en el futuro
      const fechaMaxima = new Date();
      fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 1);

      if (fechaSeleccionada < hoy) {
        e.fechaExamen = 'La fecha del examen no puede ser anterior a hoy';
      } else if (fechaSeleccionada > fechaMaxima) {
        e.fechaExamen = 'La fecha del examen no puede ser más de un año en el futuro';
      }
    }

    // Verificar si ya existe una mesa para la misma materia, fecha y hora
    if (materiaId && fechaExamen && horaExamen) {
      const existeMesa = await verificarMesaExistente(
        parseInt(materiaId),
        fechaExamen,
        horaExamen
      );
      if (existeMesa) {
        e.general = 'Ya existe una mesa de examen para esta materia en la misma fecha y hora';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setServerError(null);
    setShowSuccessPopup(false);
    setErrors({});

    const isValid = await validate();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const mesaData: MesaExamenData = {
        materia_id: parseInt(materiaId),
        fecha_examen: fechaExamen,
        hora_examen: horaExamen,
        ubicacion: ubicacion.trim(),
        comentarios: comentarios.trim() || undefined
      };

      const result = await crearMesaExamen(mesaData);

      if (result.success) {
        // Obtener el nombre de la materia seleccionada
        const materiaSeleccionada = materias.find(m => m.id === parseInt(materiaId));

        setMesaCreada({
          materia: materiaSeleccionada ? `${materiaSeleccionada.codigo_materia} - ${materiaSeleccionada.nombre}` : 'Materia',
          fecha: fechaExamen,
          hora: horaExamen
        });

        // Limpiar el formulario
        setMateriaId('');
        setFechaExamen('');
        setHoraExamen('');
        setUbicacion('');
        setComentarios('');

        // Mostrar popup de éxito
        setShowSuccessPopup(true);
      } else {
        setServerError(result.error || 'Error al crear la mesa de examen');
      }
    } catch (error) {
      setServerError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Crear Mesa de Examen
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Complete el formulario para crear una nueva mesa de examen para sus estudiantes.
        </p>
      </div>

      {/* Mensajes de estado */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{serverError}</p>
        </div>
      )}



      {errors.general && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-700 dark:text-yellow-300">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Mesa de Examen */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Información de la Mesa de Examen
            </h2>
          </div>

          {/* Materia */}
          <div className="mb-6">
            <label htmlFor="materia" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Materia <span className="text-red-500">*</span>
            </label>
            <select
              id="materia"
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.materiaId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              disabled={loading || materias.length === 0}
            >
              <option value="">Seleccione una materia</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.codigo_materia} - {materia.nombre}
                </option>
              ))}
            </select>
            {errors.materiaId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.materiaId}</p>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Fecha del Examen */}
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha del Examen <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha"
                value={fechaExamen}
                onChange={(e) => setFechaExamen(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fechaExamen ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                disabled={loading}
              />
              {errors.fechaExamen && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaExamen}</p>
              )}
            </div>

            {/* Hora del Examen */}
            <div>
              <label htmlFor="hora" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Hora del Examen <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="hora"
                value={horaExamen}
                onChange={(e) => setHoraExamen(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.horaExamen ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                disabled={loading}
              />
              {errors.horaExamen && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaExamen}</p>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div className="mb-6">
            <label htmlFor="ubicacion" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Ubicación <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Aula 205, Edificio Central"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.ubicacion ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              disabled={loading}
            />
            {errors.ubicacion && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ubicacion}</p>
            )}
          </div>

          {/* Comentarios */}
          <div>
            <label htmlFor="comentarios" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Comentarios (Opcional)
            </label>
            <textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Instrucciones adicionales, materiales permitidos, etc."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/docente')}
            disabled={loading}
            className="sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || materias.length === 0}
            className="sm:order-2"
          >
            {loading ? 'Creando...' : 'Crear Mesa de Examen'}
          </Button>
        </div>
      </form>

      {/* Popup de confirmación */}
      <ConfirmationPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          router.push('/dashboard/docente');
        }}
        title="¡Mesa Creada con Éxito!"
        message={mesaCreada ? 
          `La mesa de examen para "${mesaCreada.materia}" ha sido programada para el ${(() => {
            const [year, month, day] = mesaCreada.fecha.split('-');
            const fechaLocal = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return fechaLocal.toLocaleDateString('es-ES');
          })()} a las ${mesaCreada.hora}.` :
          'La mesa de examen ha sido creada exitosamente.'
        }

      />
    </div>
  );
}