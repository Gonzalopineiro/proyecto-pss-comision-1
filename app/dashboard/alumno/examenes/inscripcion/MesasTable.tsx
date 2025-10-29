"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  inscribirseEnMesa, 
  MesaDisponible, 
  verificarCorrelativasFinales,
  VerificacionCorrelativasFinales 
} from "./actions";
import CorrelativasFinalesModal from "./CorrelativasFinalesModal";

interface Alumno {
  nombre: string;
  legajo: string;
  mail: string;
}

interface MesasTableProps {
  mesas: MesaDisponible[];
  alumno: Alumno;
}

const ITEMS_PER_PAGE = 10;

export default function MesasTable({
  mesas: initialMesas,
  alumno,
}: MesasTableProps) {
  const [mesas, setMesas] = useState<MesaDisponible[]>(initialMesas);
  const [selectedMesa, setSelectedMesa] = useState<MesaDisponible | null>(null);
  const [verificacion, setVerificacion] = useState<VerificacionCorrelativasFinales | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verificandoCorrelativas, setVerificandoCorrelativas] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(mesas.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentMesas = mesas.slice(startIdx, endIdx);

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedMesa(null);
    setVerificacion(null);
    setVerificandoCorrelativas(false);
    setInscribiendo(false);
  };

  function generarComprobante(mesa: MesaDisponible) {
    const fecha = new Date(mesa.fecha_examen).toLocaleDateString("es-AR");
    const contenido = `
    <h1>Comprobante de Inscripción</h1>
    <p><strong>Alumno:</strong> ${alumno.nombre}</p>
    <p><strong>Legajo:</strong> ${alumno.legajo}</p>
    <p><strong>Email:</strong> ${alumno.mail}</p>
    <p><strong>Materia:</strong> ${mesa.materias?.nombre}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Horario:</strong> ${mesa.hora_examen}</p>
    <p><strong>Ubicación:</strong> ${mesa.ubicacion}</p>
    <p>Este comprobante certifica su inscripción en el examen.</p>
  `;
    const ventana = window.open("", "_blank", "width=600,height=400");
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    }
  }

  const manejarInscripcion = async (mesa: MesaDisponible) => {
    console.log('🎯 INICIANDO manejarInscripcion para mesa:', mesa.id, 'materia:', mesa.materias?.nombre);
    setVerificandoCorrelativas(true);
    setSelectedMesa(mesa);
    
    try {
      const materiaId = parseInt(mesa.materia_id);
      console.log('📋 ID de materia obtenido:', materiaId);
      
      console.log('🔬 Verificando correlativas finales...');
      const verificacionResult = await verificarCorrelativasFinales(materiaId);
      console.log('📊 Resultado de verificación finales:', verificacionResult);
      setVerificacion(verificacionResult);
      setModalOpen(true);
    } catch (error: any) {
      console.error('❌ Error verificando correlativas finales:', error);
      alert(error.message || 'Error al verificar correlativas para el final');
      cerrarModal();
    } finally {
      setVerificandoCorrelativas(false);
    }
  };

  const procederConInscripcion = async () => {
    if (!selectedMesa || !verificacion) return;
    
    setInscribiendo(true);
    try {
      const materiaId = parseInt(selectedMesa.materia_id);
      
      await inscribirseEnMesa(selectedMesa.id, materiaId);
      
      // Actualizar el estado local
      setMesas((prev) =>
        prev.map((m) =>
          m.id === selectedMesa.id ? { ...m, ya_inscripto: true } : m
        )
      );
      
      alert('¡Inscripción exitosa al examen final!');
      cerrarModal();
    } catch (error: any) {
      console.error('❌ Error en inscripción:', error);
      alert(error.message || 'Error al inscribirse en el examen');
    } finally {
      setInscribiendo(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentMesas.length > 0 ? (
              currentMesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {mesa.materias?.nombre ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(mesa.fecha_examen).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {mesa.hora_examen}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {mesa.ubicacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={mesa.ya_inscripto || verificandoCorrelativas}
                        onClick={() => manejarInscripcion(mesa)}
                      >
                        {verificandoCorrelativas && selectedMesa?.id === mesa.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : mesa.ya_inscripto ? (
                          "Ya estás inscripto"
                        ) : (
                          "Inscribirse"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!mesa.ya_inscripto}
                        onClick={() => generarComprobante(mesa)}
                      >
                        Comprobante
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay mesas de examen disponibles para tu carrera
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {startIdx + 1} - {Math.min(endIdx, mesas.length)} de{" "}
          {mesas.length} mesas
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <CorrelativasFinalesModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        verificacion={verificacion}
        mesaInfo={selectedMesa ? {
          materia_nombre: selectedMesa.materias?.nombre || 'Materia desconocida',
          fecha_examen: selectedMesa.fecha_examen,
          hora_examen: selectedMesa.hora_examen,
          ubicacion: selectedMesa.ubicacion
        } : null}
        onConfirm={procederConInscripcion}
        isLoading={inscribiendo}
      />
    </>
  );
}
