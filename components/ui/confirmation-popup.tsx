'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ConfirmationPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  passwordUsed?: string | null
  userType?: 'alumno' | 'administrador' | 'docente'
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  passwordUsed,
  userType = 'usuario'
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Solo cerrar si se hace clic en el fondo, no en el contenido del popup
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl transform transition-all">
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 pt-12 pb-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          
          <p className="text-center text-gray-600 dark:text-gray-300 mb-5">
            {message}
          </p>
          
          {passwordUsed && (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mb-5">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                Contraseña generada:
              </h4>
              <div className="bg-white dark:bg-gray-700 p-3 rounded border border-green-200 dark:border-green-800 font-mono text-lg mb-2">
                {passwordUsed}
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">
                ⚠️ IMPORTANTE: {userType === 'alumno' 
                  ? 'Proporcione esta contraseña al alumno.' 
                  : 'Guarde esta contraseña en un lugar seguro.'} 
                El {userType} deberá cambiarla en su primer inicio de sesión.
              </p>
            </div>
          )}
          
          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-lg font-medium transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPopup