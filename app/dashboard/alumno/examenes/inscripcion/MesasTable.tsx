"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { inscribirseEnMesa, MesaDisponible } from './actions'

interface MesasTableProps {
  mesas: MesaDisponible[]
}

const ITEMS_PER_PAGE = 10

export default function MesasTable({ mesas: initialMesas }: MesasTableProps) {
  const [mesas, setMesas] = useState<MesaDisponible[]>(initialMesas)
  const [selectedMesa, setSelectedMesa] = useState<MesaDisponible | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(mesas.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const currentMesas = mesas.slice(startIdx, endIdx)

  function handleInscribirse(mesa: MesaDisponible) {
    setSelectedMesa(mesa)
    setConfirmOpen(true)
  }

  async function doInscripcion() {
    if (!selectedMesa) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('mesaId', selectedMesa.id)
      await inscribirseEnMesa(formData)
      
      setMesas((prev) =>
        prev.map((m) =>
          m.id === selectedMesa.id ? { ...m, ya_inscripto: true } : m
        )
      )
      setConfirmOpen(false)
      setSelectedMesa(null)
    } catch (err) {
      console.error(err)
      alert('Error al inscribirse')
    } finally {
      setLoading(false)
    }
  }

  function getMesaMessage(mesa: MesaDisponible | null) {
    if (!mesa) return ''
    const fecha = new Date(mesa.fecha_examen).toLocaleDateString('es-AR')
    return `¿Deseas inscribirte en el examen de ${mesa.materias?.nombre}?\n\n` +
           `• Fecha: ${fecha}\n` +
           `• Horario: ${mesa.hora_examen}\n` +
           `• Ubicación: ${mesa.ubicacion}`
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Materia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Horario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentMesas.length > 0 ? (
              currentMesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{mesa.materias?.nombre ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(mesa.fecha_examen).toLocaleDateString('es-AR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{mesa.hora_examen}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{mesa.ubicacion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <Button
                      size="sm"
                      disabled={mesa.ya_inscripto}
                      onClick={() => handleInscribirse(mesa)}
                    >
                      {mesa.ya_inscripto ? "Ya estás inscripto" : "Inscribirse"}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
          Mostrando {startIdx + 1} - {Math.min(endIdx, mesas.length)} de {mesas.length} mesas
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setSelectedMesa(null) }}
        title="Confirmar inscripción"
        message={getMesaMessage(selectedMesa)}
        onConfirm={doInscripcion}
        confirmLabel="Sí, inscribirme"
        cancelLabel="Cancelar"
        loading={loading}
      />
    </>
  )
}