'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestNotifications() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const ejecutarPrueba = async () => {
    setLoading(true)
    try {
      console.log('🚀 Iniciando prueba de notificaciones...')
      const response = await fetch('/api/check-notifications', { 
        method: 'POST' 
      })
      const data = await response.json()
      setResultado(data)
      console.log('📧 Resultado completo:', data)
      
      if (data.success) {
        console.log(`✅ ${data.mesasNotificadas} mesas fueron notificadas`)
      } else {
        console.log('⚠️ No se encontraron mesas para notificar')
      }
    } catch (error: any) {
      console.error('❌ Error:', error)
      setResultado({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            🧪 Test Notificaciones Email
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              📋 Criterios para Notificar:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Fecha del examen: ≥ 2 semanas atrás</li>
              <li>• Estado: 'finalizada'</li>
              <li>• Notas cargadas: false o null</li>
              <li>• Sin notificaciones en las últimas 24 horas</li>
            </ul>
          </div>

          <div className="text-center mb-6">
            <Button 
              onClick={ejecutarPrueba}
              disabled={loading}
              className="px-8 py-3 text-lg"
            >
              {loading ? '⏳ Ejecutando...' : '📧 Probar Notificaciones'}
            </Button>
          </div>

          {resultado && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                📊 Resultado:
              </h3>
              
              {resultado.success ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">✅</span>
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Verificación Exitosa
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-300">
                    <strong>{resultado.mesasNotificadas}</strong> mesa(s) fueron procesadas para notificación
                  </p>
                  {resultado.mesasNotificadas > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      📧 Revisa la consola del servidor para ver los emails enviados
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">❌</span>
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      Error en la Verificación
                    </span>
                  </div>
                  <p className="text-red-700 dark:text-red-300">
                    {resultado.error || 'Error desconocido'}
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  📋 Respuesta Completa:
                </h4>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              💡 Notas Importantes:
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• <strong>Emails simulados:</strong> Se muestran por console.log en la terminal del servidor</li>
              <li>• <strong>Logs detallados:</strong> Aparecen en la consola del navegador (F12)</li>
              <li>• <strong>Base de datos:</strong> Las notificaciones se registran en la tabla 'notificaciones_email'</li>
              <li>• <strong>Fecha actual:</strong> {new Date().toLocaleDateString('es-ES')} (para validar las 2 semanas)</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              🔧 Desarrollado para testing en <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">localhost:3000</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}