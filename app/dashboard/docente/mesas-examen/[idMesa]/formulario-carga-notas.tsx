'use client'

import React, { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarPresente,
  guardarNota,
  publicarNotas,
  type AlumnoInscripcion,
  type MesaExamenDetalles
} from './actions'

// Componentes de UI para modales
import ConfirmDialog from '@/components/ui/confirm-dialog'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

// Componentes de UI estándar
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Printer, Send, Ban, Save } from 'lucide-react'

interface FormularioProps {
  idMesa: string
  initialAlumnos: AlumnoInscripcion[]
  estadoMesa: MesaExamenDetalles['estado']
}

export default function FormularioCargaNotas({
  idMesa,
  initialAlumnos,
  estadoMesa
}: FormularioProps) {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState(initialAlumnos)
  const [isPending, startTransition] = useTransition()

  // Estados para las modales
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [popupInfo, setPopupInfo] = useState({ title: '', message: '' })

  const isCargaFinalizada = estadoMesa === 'finalizada' || estadoMesa === 'cancelada'
  const isPublicada = estadoMesa === 'finalizada'

  const { allGraded, gradedCount } = useMemo(() => {
    const count = alumnos.filter(a =>
      a.estado !== 'inscripto' && a.estado !== 'presente'
    ).length
    return {
      allGraded: count === alumnos.length,
      gradedCount: count
    }
  }, [alumnos])

  const handlePresenteChange = (inscripcionId: string, isChecked: boolean) => {
    const nuevoEstado = isChecked ? 'presente' : 'ausente'
    setAlumnos(currentAlumnos =>
      currentAlumnos.map(a =>
        a.inscripcionId === inscripcionId
          ? { ...a, estado: nuevoEstado, nota: null } : a
      )
    )
    startTransition(async () => {
      // El guardado se hace en background
      await actualizarPresente(inscripcionId, isChecked)
    })
  }

  const handleNotaBlur = (inscripcionId: string, notaStr: string) => {
    const nota = notaStr === '' ? null : parseFloat(notaStr)
    if (nota !== null && (nota < 0 || nota > 10 || isNaN(nota))) {
      setPopupInfo({ title: 'Error de Nota', message: 'La nota debe ser un número entre 0 y 10.' })
      setShowInfoPopup(true)
      return
    }

    let nuevoEstado: AlumnoInscripcion['estado']
    if (nota === null) {
      nuevoEstado = 'presente'
    } else {
      nuevoEstado = nota >= 4 ? 'aprobado' : 'reprobado'
    }

    setAlumnos(currentAlumnos =>
      currentAlumnos.map(a =>
        a.inscripcionId === inscripcionId
          ? { ...a, nota: nota, estado: nuevoEstado } : a
      )
    )
    startTransition(async () => {
      // El guardado se hace en background
      await guardarNota(inscripcionId, nota)
    })
  }

  // --- Manejadores de Botones ---

  // Muestra un popup informativo sobre el guardado automático
  const handleGuardarClickeado = () => {
    setPopupInfo({
      title: 'Progreso Guardado',
      message: 'Tus cambios se guardan automáticamente al editar cada fila. Este botón confirma que todo está guardado.'
    })
    setShowInfoPopup(true)
  };

  // Abre el diálogo de confirmación para publicar
  const handlePublicarClick = () => {
    if (!allGraded) {
      setPopupInfo({
        title: 'Acción Requerida',
        message: 'Debe calificar o marcar como ausente a todos los estudiantes antes de poder publicar.'
      })
      setShowInfoPopup(true)
      return;
    }
    // Abre el diálogo de confirmación
    setShowPublishConfirm(true);
  };

  // Acción final de publicar, llamada por el ConfirmDialog
  const doPublish = () => {
    setShowPublishConfirm(false); // Cierra el diálogo de confirmación

    startTransition(async () => {
      const result = await publicarNotas(idMesa);
      if (result.success) {
        setPopupInfo({
          title: '¡Notas Publicadas!',
          message: 'Las notas han sido publicadas exitosamente y los estudiantes serán notificados.'
        })
        // Refrescar la página o el router para actualizar el estado de la mesa
        router.refresh()
      } else {
        setPopupInfo({
          title: 'Error de Publicación',
          message: `No se pudieron publicar las notas: ${result.error}`
        })
      }
      setShowInfoPopup(true); // Muestra el popup de éxito o error
    });
  };

  const getEstadoBadge = (estado: AlumnoInscripcion['estado']) => {
    const variants = {
      'inscripto': 'default',
      'presente': 'info',
      'ausente': 'destructive',
      'aprobado': 'success',
      'reprobado': 'warning',
    }
    return <Badge variant={variants[estado] as any}>{estado}</Badge>
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden">

      {/* Cabecera */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lista de Estudiantes</h2>
        <span className="text-sm text-slate-500">
          {gradedCount} de {alumnos.length} calificados
        </span>
      </div>

      {/* Tabla de Alumnos */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Legajo</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead className="text-center">Presente</TableHead>
              <TableHead className="w-[100px]">Nota</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumnos.map((a) => {
              const isPresente = a.estado !== 'inscripto' && a.estado !== 'ausente'
              const isNotaEnabled = isPresente
              return (
                <TableRow key={a.inscripcionId}>
                  <TableCell>{a.legajo}</TableCell>
                  <TableCell className="font-medium">{a.nombreCompleto}</TableCell>
                  <TableCell>{a.dni}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isPresente}
                      onCheckedChange={(isChecked) => handlePresenteChange(a.inscripcionId, isChecked as boolean)}
                      disabled={isPending || isCargaFinalizada}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01" min="0" max="10"
                      defaultValue={a.nota ?? ''}
                      onBlur={(e) => handleNotaBlur(a.inscripcionId, e.target.value)}
      
                      disabled={!isNotaEnabled || isPending || isCargaFinalizada}
                      className="w-[80px] text-center"
                    />
                  </TableCell>
                  <TableCell>{getEstadoBadge(a.estado)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer de Acciones */}
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">

        {/* Acciones de Exportación */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isPending}>
            <Download className="h-4 w-4 mr-2" /> Exportar Lista
          </Button>
          <Button variant="outline" size="sm" disabled={isPending}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir Acta
          </Button>
        </div>

        {/* Acciones Principales */}
        <div className="flex items-center gap-4">

          {/* Estado: Carga en Progreso */}
          {!isCargaFinalizada && (
            <>
              <Button
                size="lg"
                variant="outline"
                className="bg-white dark:bg-slate-800"
                disabled={!allGraded || isPending}
                onClick={handlePublicarClick} // Llama al diálogo de confirmación
                title={!allGraded ? "Debe calificar a todos los alumnos para publicar" : "Publicar notas (Acción final)"}
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar Notas
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancelar
                </Button>

                <Button
                  size="sm"
                  onClick={handleGuardarClickeado} // Muestra popup informativo
                  disabled={isPending}
                  title="Guardar progreso (se guarda automáticamente al editar)"
                  className="bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? 'Guardando...' : 'Guardar Calificaciones'}
                </Button>
              </div>
            </>
          )}

          {/* Estado: Carga Finalizada (Publicada) */}
          {isCargaFinalizada && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                Volver
              </Button>
              <Button size="lg" disabled className="bg-green-700">
                <Ban className="h-4 w-4 mr-2" />
                {estadoMesa === 'finalizada' ? 'Notas Publicadas' : 'Mesa Cancelada'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* --- Modales --- */}

      {/* Popup de Éxito/Info (para Guardar, Errores, etc.) */}
      <ConfirmationPopup
        isOpen={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
        title={popupInfo.title}
        message={popupInfo.message}
      />

      {/* Dialog de Confirmación (para Publicar) */}
      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        title="Confirmar Publicación"
        message="¿Está seguro de que desea publicar estas notas? Esta acción es irreversible y se notificará a los estudiantes."
        onConfirm={doPublish}
        confirmLabel="Sí, Publicar Notas"
        cancelLabel="Cancelar"
        loading={isPending} // Se deshabilita mientras se publica
      />
    </div>
  )
}
