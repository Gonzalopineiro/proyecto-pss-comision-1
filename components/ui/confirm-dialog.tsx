"use client"

import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export default function ConfirmDialog({
  isOpen,
  title = 'Confirmar acción',
  message = '¿Estás seguro?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-end p-3">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
            <Button onClick={() => onConfirm()} variant="destructive" disabled={loading}>{loading ? 'Procesando...' : confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
