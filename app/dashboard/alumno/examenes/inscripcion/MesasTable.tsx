"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmationPopup from "@/components/ui/confirmation-popup";
import CancelExamDialog from "./CancelExamDialog";
import BlockInscriptionDialog from "./BlockInscriptionDialog";
import { Loader2 } from "lucide-react";
import {
  inscribirseEnMesa,
  cancelarInscripcionMesa,
  MesaDisponible,
  verificarCorrelativasFinales,
  VerificacionCorrelativasFinales,
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
  const [verificacion, setVerificacion] =
    useState<VerificacionCorrelativasFinales | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verificandoCorrelativas, setVerificandoCorrelativas] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(mesas.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentMesas = mesas.slice(startIdx, endIdx);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canCancel, setCanCancel] = useState(true);

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedMesa(null);
    setVerificacion(null);
    setVerificandoCorrelativas(false);
    setInscribiendo(false);
  };

  // Función para formatear fecha sin problemas de zona horaria
  const formatearFechaSinDesfase = (fechaString: string) => {
    const [año, mes, dia] = fechaString.split("-").map(Number);
    const fechaLocal = new Date(año, mes - 1, dia);
    return fechaLocal.toLocaleDateString("es-AR");
  };

  function generarComprobante(mesa: MesaDisponible) {
    const fecha = formatearFechaSinDesfase(mesa.fecha_examen);
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
    // 🧮 Calcular si faltan al menos 24 horas
    const examDateTime = new Date(`${mesa.fecha_examen}T${mesa.hora_examen}`);
    const now = new Date();
    const diffHours =
      (examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      setSelectedMesa(mesa);
      setBlockDialogOpen(true);
      return; // ⛔ No sigue con correlativas ni inscripción
    }

    // 🟢 Si pasa la regla de 24 h, sigue como antes
    setVerificandoCorrelativas(true);
    setSelectedMesa(mesa);

    try {
      const materiaId = parseInt(mesa.materia_id);
      const verificacionResult = await verificarCorrelativasFinales(materiaId);
      setVerificacion(verificacionResult);
      setModalOpen(true);
    } catch (error: any) {
      console.error("❌ Error verificando correlativas finales:", error);
      alert(error.message || "Error al verificar correlativas para el final");
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

      setMesas((prev) =>
        prev.map((m) =>
          m.id === selectedMesa.id ? { ...m, ya_inscripto: true } : m
        )
      );

      setPopupTitle("¡Inscripción exitosa!");
      setPopupMessage(
        "Tu inscripción al examen final se realizó correctamente ✅"
      );
      setPopupType("success");
      setPopupOpen(true);

      cerrarModal();
    } catch (error: any) {
      console.error("❌ Error en inscripción:", error);
      setPopupTitle("Error al inscribirse");
      setPopupMessage(
        error.message || "Ocurrió un error al inscribirte en el examen."
      );
      setPopupType("error");
      setPopupOpen(true);
    } finally {
      setInscribiendo(false);
    }
  };

  const manejarCancelacion = (mesa: MesaDisponible) => {
    setSelectedMesa(mesa);

    // 🧮 Calcular si faltan al menos 24 horas para el examen
    const examDateTime = new Date(`${mesa.fecha_examen}T${mesa.hora_examen}`);
    const now = new Date();
    const diffHours =
      (examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const puedeCancelar = diffHours >= 24;
    setCanCancel(puedeCancelar);

    setCancelDialogOpen(true);
  };

  const confirmarCancelacion = async () => {
    if (!selectedMesa) return;

    try {
      await cancelarInscripcionMesa(selectedMesa.id);

      // Actualizamos el estado local: ya no está inscripto
      setMesas((prev) =>
        prev.map((m) =>
          m.id === selectedMesa.id ? { ...m, ya_inscripto: false } : m
        )
      );

      setPopupTitle("Inscripción cancelada");
      setPopupMessage("Tu inscripción fue cancelada correctamente ✅");
      setPopupType("success");
    } catch (error: any) {
      console.error("❌ Error al cancelar inscripción:", error);
      setPopupTitle("Error al cancelar inscripción");
      setPopupMessage(
        error.message || "Ocurrió un error al cancelar la inscripción."
      );
      setPopupType("error");
    } finally {
      setPopupOpen(true);
      setSelectedMesa(null);
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
                    {formatearFechaSinDesfase(mesa.fecha_examen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {mesa.hora_examen}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {mesa.ubicacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex gap-2">
                      {mesa.ya_inscripto ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => manejarCancelacion(mesa)}
                        >
                          Cancelar inscripción
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={verificandoCorrelativas}
                          onClick={() => manejarInscripcion(mesa)}
                        >
                          {verificandoCorrelativas &&
                          selectedMesa?.id === mesa.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            "Inscribirse"
                          )}
                        </Button>
                      )}
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
        mesaInfo={
          selectedMesa
            ? {
                materia_nombre:
                  selectedMesa.materias?.nombre || "Materia desconocida",
                fecha_examen: selectedMesa.fecha_examen,
                hora_examen: selectedMesa.hora_examen,
                ubicacion: selectedMesa.ubicacion,
              }
            : null
        }
        onConfirm={procederConInscripcion}
        isLoading={inscribiendo}
      />

      {selectedMesa && (
        <CancelExamDialog
          isOpen={cancelDialogOpen}
          examName={selectedMesa.materias?.nombre || "Examen"}
          examDate={selectedMesa.fecha_examen}
          examTime={selectedMesa.hora_examen}
          onClose={() => {
            setCancelDialogOpen(false);
            setSelectedMesa(null);
          }}
          onConfirm={async () => {
            await confirmarCancelacion();
            setCancelDialogOpen(false);
          }}
        />
      )}

      {selectedMesa && (
        <BlockInscriptionDialog
          isOpen={blockDialogOpen}
          examName={selectedMesa.materias?.nombre || "Examen"}
          examDate={selectedMesa.fecha_examen}
          examTime={selectedMesa.hora_examen}
          onClose={() => {
            setBlockDialogOpen(false);
            setSelectedMesa(null);
          }}
        />
      )}

      <ConfirmationPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
      />
    </>
  );
}