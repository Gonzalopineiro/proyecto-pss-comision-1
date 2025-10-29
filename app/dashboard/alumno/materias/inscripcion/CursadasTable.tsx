"use client"
import { Card } from "@/components/ui/card"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { inscribirseEnCursada } from "./actions"

export type Cursada = {
  id: number
  cupo_maximo: number | null
  horarios: {
    horarios: Array<{
      dia: string
      hora_inicio: string
      hora_fin: string
      aula: string
    }>
  } | null
  materia_docente: {
    materia: {
      nombre: string
      codigo_materia: string
    }
    docente: {
      nombre: string
      apellido: string
    }
  }
}

interface CursadasTableProps {
  cursadas: Cursada[]
  cursadasInscripto: Set<number>
}

const ITEMS_PER_PAGE = 6

export default function CursadasTable({ cursadas, cursadasInscripto }: CursadasTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCursada, setSelectedCursada] = useState<Cursada | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.ceil(cursadas.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const currentCursadas = cursadas.slice(startIdx, endIdx)

  function handleInscribirse(cursada: Cursada) {
    setSelectedCursada(cursada)
    setConfirmOpen(true)
  }

  async function doInscripcion() {
    if (!selectedCursada) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("cursadaId", selectedCursada.id.toString())
      await inscribirseEnCursada(formData)

      // Actualizar set de inscripciones
      cursadasInscripto.add(selectedCursada.id)

      setConfirmOpen(false)
      setSelectedCursada(null)
    } catch (err) {
      console.error(err)
      alert("Error al inscribirse")
    } finally {
      setLoading(false)
    }
  }

  // Mensaje de confirmación
  function getCursadaMessage(cursada: Cursada | null) {
    if (!cursada) return ""
    const horariosText = cursada.horarios?.horarios
      ?.map((h) => `• ${h.dia} ${h.hora_inicio}-${h.hora_fin} (${h.aula})`)
      .join("\n")
    return `¿Deseas inscribirte en la cursada de ${cursada.materia_docente.materia.nombre}?\n\n` +
           `• Profesor: ${cursada.materia_docente.docente.nombre} ${cursada.materia_docente.docente.apellido}\n` +
           `• Cupo: ${cursada.cupo_maximo || "Sin límite"}\n` +
           (horariosText ? `• Horarios:\n${horariosText}` : "")
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {currentCursadas.map((cursada) => {
          const yaInscripto = cursadasInscripto.has(cursada.id)
          return (
            <Card
              key={cursada.id}
              className="p-6 aspect-square flex flex-col hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {cursada.materia_docente.materia.nombre}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Código: {cursada.materia_docente.materia.codigo_materia}
                  </p>
                </div>

                <div className="flex-grow">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Profesor:</span>{" "}
                    {cursada.materia_docente.docente.nombre}{" "}
                    {cursada.materia_docente.docente.apellido}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Cupo:</span>{" "}
                    {cursada.cupo_maximo || "Sin límite"}
                  </p>
                  <div className="text-sm whitespace-pre-line">
                    <span className="font-medium">Horarios:</span>
                    <br />
                    {cursada.horarios?.horarios
                      ?.map(
                        (h) => `${h.dia} ${h.hora_inicio}-${h.hora_fin} (${h.aula})`
                      )
                      .join("\n")}
                  </div>
                </div>

                <Button
                  className="mt-4"
                  size="sm"
                  disabled={yaInscripto}
                  onClick={() => handleInscribirse(cursada)}
                >
                  {yaInscripto ? "Ya estás inscripto" : "Inscribirme"}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {startIdx + 1} - {Math.min(endIdx, cursadas.length)} de {cursadas.length} cursadas
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

      {/* Confirmación */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setSelectedCursada(null)
        }}
        title="Confirmar inscripción"
        message={getCursadaMessage(selectedCursada)}
        onConfirm={doInscripcion}
        confirmLabel="Sí, inscribirme"
        cancelLabel="Cancelar"
        loading={loading}
      />
    </>
  )
}