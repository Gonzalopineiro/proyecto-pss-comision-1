"use client"

import React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  error?: string
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
  error,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-end p-3">
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">{message}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
            <Button onClick={() => onConfirm()} variant="destructive" disabled={loading}>{loading ? 'Procesando...' : confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
