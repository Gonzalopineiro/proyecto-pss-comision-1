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
  type?: 'success' | 'error'
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  passwordUsed,
  userType = 'usuario',
  type = 'success'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-xs sm:max-w-sm md:max-w-md shadow-xl transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition bg-white dark:bg-gray-800 rounded-full p-1"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </div>
        
        <div className="p-3 pt-8 pb-4 sm:p-4 sm:pt-10 sm:pb-5 md:p-6 md:pt-12 md:pb-5">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
            {type === 'success' ? (
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4 sm:mb-5 text-sm sm:text-base">
            {message}
          </p>
          
          {passwordUsed && type === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/30 p-3 sm:p-4 rounded-md mb-4 sm:mb-5">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 text-sm sm:text-base">
                Contraseña generada:
              </h4>
              <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border border-green-200 dark:border-green-800 font-mono text-sm sm:text-lg mb-2 break-all">
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
          
          <div className="mt-4 sm:mt-5">
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition text-sm sm:text-base"
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