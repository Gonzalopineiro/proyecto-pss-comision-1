'use client'

import React, { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarPresente,
  guardarNota,
  publicarNotas,
  type AlumnoInscripcion,
  type MesaExamenDetalles,
  type Usuario
} from './actions'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

import ConfirmDialog from '@/components/ui/confirm-dialog'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

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
import { Download, Printer, Send, Ban, Save, FileSpreadsheet, FileText } from 'lucide-react'

interface FormularioProps {
  idMesa: string
  initialAlumnos: AlumnoInscripcion[]
  estadoMesa: MesaExamenDetalles['estado']
  detallesMesa: MesaExamenDetalles
  usuario: Usuario
}

// ESTA ES LA LÍNEA CLAVE: El export default que faltaba
export default function FormularioCargaNotas({
  idMesa,
  initialAlumnos,
  estadoMesa,
  detallesMesa,
  usuario
}: FormularioProps) {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState(initialAlumnos)
  const [isPending, startTransition] = useTransition()

  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [popupInfo, setPopupInfo] = useState({ title: '', message: '' })
  const [showExportModal, setShowExportModal] = useState(false)

  const isCargaFinalizada = estadoMesa === 'finalizada' || estadoMesa === 'cancelada'

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
      await guardarNota(inscripcionId, nota)
    })
  }

  const handleGuardarClickeado = () => {
    setPopupInfo({
      title: 'Progreso Guardado',
      message: 'Tus cambios se guardan automáticamente al editar cada fila. Este botón confirma que todo está guardado.'
    })
    setShowInfoPopup(true)
  };

  const handlePublicarClick = () => {
    if (!allGraded) {
      setPopupInfo({
        title: 'Acción Requerida',
        message: 'Debe calificar o marcar como ausente a todos los estudiantes antes de poder publicar.'
      })
      setShowInfoPopup(true)
      return;
    }
    setShowPublishConfirm(true);
  };

  const doPublish = () => {
    setShowPublishConfirm(false);
    startTransition(async () => {
      const result = await publicarNotas(idMesa);
      if (result.success) {
        setPopupInfo({
          title: '¡Notas Publicadas!',
          message: 'Las notas han sido publicadas exitosamente y los estudiantes serán notificados.'
        })
        router.refresh()
      } else {
        setPopupInfo({
          title: 'Error de Publicación',
          message: `No se pudieron publicar las notas: ${result.error}`
        })
      }
      setShowInfoPopup(true);
    });
  };

  const getEstadoBadge = (estado: AlumnoInscripcion['estado']) => {
    const variants: Record<AlumnoInscripcion['estado'], "default" | "secondary" | "destructive" | "outline"> = {
      'inscripto': 'default',
      'presente': 'default',
      'ausente': 'destructive',
      'aprobado': 'secondary',
      'reprobado': 'outline',
    }
    return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>
  }

  const getCommonExportData = () => {
    const fechaGeneracion = new Date().toLocaleString('es-AR')
    const generador = usuario.nombre || usuario.email

    const headers = ["Legajo", "Estudiante", "DNI", "Presente", "Nota", "Firma"]
    const body = alumnos.map(a => [
      a.legajo,
      a.nombreCompleto,
      a.dni,
      (a.estado === 'ausente' || a.estado === 'inscripto') ? 'NO' : 'SI',
      a.nota ?? '',
      ''
    ])

    return { fechaGeneracion, generador, headers, body }
  }

  const handleExportPDF = () => {
    const { fechaGeneracion, generador, headers, body } = getCommonExportData()
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Lista de Inscriptos a Mesa de Examen", 14, 22)
    doc.setFontSize(10)
    doc.text(`Carrera: ${detallesMesa.carreraNombre}`, 14, 32)
    doc.text(`Materia: ${detallesMesa.materiaNombre} (${detallesMesa.materiaCodigo})`, 14, 37)
    doc.text(`Fecha Examen: ${detallesMesa.fecha}`, 14, 42)
    doc.text(`Docente a cargo: ${detallesMesa.docenteNombre}`, 14, 47)
    doc.text(`Generado por: ${generador}`, 14, 57)
    doc.text(`Fecha de Generación: ${fechaGeneracion}`, 14, 62)

    autoTable(doc, {
      startY: 70,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    })

    doc.save(`Inscriptos_${detallesMesa.materiaCodigo}_${detallesMesa.fecha}.pdf`)
    setShowExportModal(false)
  }

  const handleExportExcel = () => {
    const { fechaGeneracion, generador, headers, body } = getCommonExportData()
    const ws = XLSX.utils.book_new()
    const metadata = [
      ["Lista de Inscriptos a Mesa de Examen"],
      ["Carrera:", detallesMesa.carreraNombre],
      ["Materia:", `${detallesMesa.materiaNombre} (${detallesMesa.materiaCodigo})`],
      ["Fecha Examen:", detallesMesa.fecha],
      ["Docente a cargo:", detallesMesa.docenteNombre],
      [],
      ["Generado por:", generador],
      ["Fecha de Generación:", fechaGeneracion],
      []
    ]

    const sheet = XLSX.utils.aoa_to_sheet(metadata)
    XLSX.utils.sheet_add_aoa(sheet, [headers], { origin: 'A10' })
    XLSX.utils.sheet_add_aoa(sheet, body, { origin: 'A11' })

    sheet['!cols'] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(ws, sheet, "Inscriptos")
    XLSX.writeFile(ws, `Inscriptos_${detallesMesa.materiaCodigo}_${detallesMesa.fecha}.xlsx`)
    setShowExportModal(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lista de Estudiantes</h2>
        <span className="text-sm text-slate-500">
          {gradedCount} de {alumnos.length} calificados
        </span>
      </div>
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
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setShowExportModal(true)}
          >
            <Download className="h-4 w-4 mr-2" /> Exportar Lista
          </Button>
          <Button variant="outline" size="sm" disabled={isPending}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir Acta
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {!isCargaFinalizada && (
            <>
              <Button
                size="lg"
                variant="outline"
                className="bg-white dark:bg-slate-800"
                disabled={!allGraded || isPending}
                onClick={handlePublicarClick}
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
                  onClick={handleGuardarClickeado}
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

      <ConfirmationPopup
        isOpen={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
        title={popupInfo.title}
        message={popupInfo.message}
      />
      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        title="Confirmar Publicación"
        message="¿Está seguro de que desea publicar estas notas? Esta acción es irreversible y se notificará a los estudiantes."
        onConfirm={doPublish}
        confirmLabel="Sí, Publicar Notas"
        cancelLabel="Cancelar"
        loading={isPending}
      />
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Lista de Inscriptos</DialogTitle>
            <DialogDescription>
              Seleccione el formato en el que desea descargar la lista.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportPDF}
            >
              <FileText className="h-5 w-5 mr-2" />
              Exportar como PDF
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Exportar como Excel
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowExportModal(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}