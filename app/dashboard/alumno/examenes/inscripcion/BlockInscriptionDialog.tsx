'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlockInscriptionDialogProps {
  isOpen: boolean
  examName: string
  examDate: string
  examTime: string
  onClose: () => void
}

export default function BlockInscriptionDialog({
  isOpen,
  examName,
  examDate,
  examTime,
  onClose
}: BlockInscriptionDialogProps) {
  if (!isOpen) return null

  const examDateTime = new Date(`${examDate}T${examTime}`)
  const formattedDateTime = examDateTime.toLocaleString('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short'
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            No puedes inscribirte
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">
            No es posible inscribirse en el examen "{examName}" porque faltan
            menos de 24 horas para su fecha ({formattedDateTime}).
          </p>

          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                La inscripción debe realizarse con al menos 24 horas de
                anticipación.
              </span>
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}