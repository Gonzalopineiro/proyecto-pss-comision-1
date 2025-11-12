'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CancelExamDialogProps {
  isOpen: boolean
  examName: string
  examDate: string // fecha_examen (YYYY-MM-DD)
  examTime: string // hora_examen (HH:mm:ss)
  onClose: () => void
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export default function CancelExamDialog({
  isOpen,
  examName,
  examDate,
  examTime,
  onClose,
  onConfirm,
  loading = false
}: CancelExamDialogProps) {
  if (!isOpen) return null

  // Combinar fecha y hora del examen en un solo Date
  const examDateTime = new Date(`${examDate}T${examTime}`)
  const now = new Date()

  // Diferencia en horas
  const diffHours = (examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = diffHours >= 24

  const formattedDateTime = examDateTime.toLocaleString('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short'
  })

  const message = canCancel
    ? `¿Seguro que deseas cancelar tu inscripción al examen "${examName}"?`
    : `No es posible cancelar la inscripción porque faltan menos de 24 horas para el examen (${formattedDateTime}).`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Cancelar inscripción
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">
            {message}
          </p>

          {!canCancel && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Solo puedes cancelar tu inscripción con al menos 24 horas de
                  anticipación.
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cerrar
            </Button>
            {canCancel && (
              <Button
                onClick={() => onConfirm()}
                variant="destructive"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Cancelar inscripción'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}