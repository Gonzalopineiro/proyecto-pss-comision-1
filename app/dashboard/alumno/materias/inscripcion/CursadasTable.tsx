"use client";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, User, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { 
  verificarCorrelativasCursado, 
  inscribirseACursada, 
  obtenerMateriaIdPorCodigo,
  VerificacionCorrelativas 
} from './actions';
import CorrelativasModal from './CorrelativasModal';

export type Cursada = {
  id: number;
  cupo_maximo: number | null;
  horarios: {
    horarios: Array<{
      dia: string;
      hora_inicio: string;
      hora_fin: string;
      aula: string;
    }>;
  } | null;
  materia_docente: {
    materia: {
      nombre: string;
      codigo_materia: string;
    };
    docente: {
      nombre: string;
      apellido: string;
    };
  };
};

interface Alumno {
  nombre: string;
  legajo: string | number;
  mail: string;
}

interface CursadasTableProps {
  cursadas: Cursada[];
  cursadasInscripto: Set<number>;
  alumno: Alumno;
}

const ITEMS_PER_PAGE = 6;

export default function CursadasTable({
  cursadas,
  cursadasInscripto,
  alumno,
}: CursadasTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [verificandoCorrelativas, setVerificandoCorrelativas] = useState(false);
  const [verificacion, setVerificacion] = useState<VerificacionCorrelativas | null>(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<Cursada | null>(null);
  const [inscribiendo, setInscribiendo] = useState(false);

  const totalPages = Math.ceil(cursadas.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentCursadas = cursadas.slice(startIdx, endIdx);

  function generarComprobante(cursada: Cursada, alumno: Alumno) {
    const horariosText =
      cursada.horarios?.horarios
        ?.map((h) => `${h.dia} ${h.hora_inicio}-${h.hora_fin} (${h.aula})`)
        .join("<br>") || "—";

    const contenido = `
    <h1>Comprobante de Inscripción</h1>
    <p><strong>Alumno:</strong> ${alumno.nombre}</p>
    <p><strong>Legajo:</strong> ${alumno.legajo}</p>
    <p><strong>Mail:</strong> ${alumno.mail}</p>
    <p><strong>Materia:</strong> ${cursada.materia_docente.materia.nombre}</p>
    <p><strong>Código:</strong> ${
      cursada.materia_docente.materia.codigo_materia
    }</p>
    <p><strong>Profesor:</strong> ${cursada.materia_docente.docente.nombre} ${
      cursada.materia_docente.docente.apellido
    }</p>
    <p><strong>Cupo:</strong> ${cursada.cupo_maximo || "Sin límite"}</p>
    <p><strong>Horarios:</strong><br>${horariosText}</p>
    <p>Este comprobante certifica su inscripción en la cursada.</p>
  `;
    const ventana = window.open("", "_blank", "width=600,height=400");
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    }
  }

  const manejarInscripcion = async (cursada: Cursada) => {
    console.log('🎯 INICIANDO manejarInscripcion para cursada:', cursada.id, 'materia:', cursada.materia_docente.materia.nombre);
    setVerificandoCorrelativas(true);
    setMateriaSeleccionada(cursada);
    
    try {
      // Obtener el ID de la materia desde el código
      console.log('🔍 Obteniendo ID de materia para código:', cursada.materia_docente.materia.codigo_materia);
      const materiaId = await obtenerMateriaIdPorCodigo(cursada.materia_docente.materia.codigo_materia);
      console.log('📋 ID de materia obtenido:', materiaId);
      
      console.log('🔬 Verificando correlativas...');
      const verificacionResult = await verificarCorrelativasCursado(materiaId);
      console.log('📊 Resultado de verificación:', verificacionResult);
      setVerificacion(verificacionResult);
    } catch (error: any) {
      console.error('❌ Error verificando correlativas:', error);
      // Si hay error, mostrar un alert simple y no abrir el modal
      alert(error.message || 'Error al verificar correlativas');
      cerrarModal();
    } finally {
      setVerificandoCorrelativas(false);
    }
  };

  const procederConInscripcion = async () => {
    if (!materiaSeleccionada || !verificacion) return;
    
    setInscribiendo(true);
    try {
      const materiaId = await obtenerMateriaIdPorCodigo(materiaSeleccionada.materia_docente.materia.codigo_materia);
      
      await inscribirseACursada(materiaSeleccionada.id, materiaId);
      
      // Actualizar el estado local
      cursadasInscripto.add(materiaSeleccionada.id);
      
      alert('¡Inscripción realizada exitosamente!');
      
      // Recargar la página para actualizar el estado completo
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Error al procesar la inscripción');
    } finally {
      setInscribiendo(false);
      cerrarModal();
    }
  };

  const cerrarModal = () => {
    setVerificacion(null);
    setMateriaSeleccionada(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCursadas.map((cursada) => {
          const yaInscripto = cursadasInscripto.has(cursada.id);
          const horariosFormateados = cursada.horarios?.horarios
            ?.map((h) => `${h.dia} ${h.hora_inicio}-${h.hora_fin} (${h.aula})`)
            .join(', ') || 'Sin horarios definidos';

          return (
            <Card key={cursada.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header con nombre y estado */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {cursada.materia_docente.materia.nombre}
                    </h3>
                    {yaInscripto && (
                      <Badge variant="default" className="bg-green-600 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Inscripto
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Código: {cursada.materia_docente.materia.codigo_materia}
                  </p>
                </div>

                {/* Información del curso */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      Prof. {cursada.materia_docente.docente.nombre} {cursada.materia_docente.docente.apellido}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Cupo: {cursada.cupo_maximo || "Sin límite"}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{horariosFormateados}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full"
                    disabled={yaInscripto || verificandoCorrelativas || inscribiendo}
                    variant={yaInscripto ? "outline" : "default"}
                    onClick={() => manejarInscripcion(cursada)}
                  >
                    {verificandoCorrelativas ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : yaInscripto ? (
                      "Ya inscripto"
                    ) : (
                      "Inscribirme"
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!yaInscripto}
                    onClick={() => generarComprobante(cursada, alumno)}
                  >
                    Comprobante
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mensaje cuando no hay cursadas */}
      {cursadas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay cursadas disponibles en este momento</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIdx + 1} - {Math.min(endIdx, cursadas.length)} de{" "}
            {cursadas.length} cursadas
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
      )}

      {/* Modal de correlativas */}
      {(verificandoCorrelativas || verificacion) && materiaSeleccionada && (
        <CorrelativasModal
          materia={materiaSeleccionada.materia_docente.materia}
          verificacion={verificacion}
          loading={verificandoCorrelativas}
          onProcederInscripcion={procederConInscripcion}
          onCancelar={cerrarModal}
          inscribiendo={inscribiendo}
        />
      )}
    </>
  );
}
