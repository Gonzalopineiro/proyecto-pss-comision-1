'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, BookOpen, Loader2 } from 'lucide-react'
import { VerificacionCorrelativas } from './actions'

interface CorrelativasModalProps {
  materia: {
    nombre: string
    codigo_materia: string
  }
  verificacion: VerificacionCorrelativas | null
  loading: boolean
  onProcederInscripcion: () => void
  onCancelar: () => void
  inscribiendo?: boolean
}

export default function CorrelativasModal({
  materia,
  verificacion,
  loading,
  onProcederInscripcion,
  onCancelar,
  inscribiendo = false
}: CorrelativasModalProps) {
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Verificando correlativas...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (!verificacion) return null

  const correlativasPendientes = verificacion.correlativas.filter(c => !c.cumplida)
  const correlativasCumplidas = verificacion.correlativas.filter(c => c.cumplida)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Verificación de Correlativas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {materia.codigo_materia} - {materia.nombre}
              </p>
            </div>
          </div>

          {/* Estado general */}
          <div className={`p-4 rounded-lg border ${
            verificacion.puede_inscribirse 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {verificacion.puede_inscribirse ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    ✅ Puedes inscribirte a esta materia
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-200">
                    ❌ No puedes inscribirte - Correlativas pendientes
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mensaje de error si existe */}
          {verificacion.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200 text-sm">
                  {verificacion.error}
                </span>
              </div>
            </div>
          )}

          {/* Lista de correlativas */}
          {verificacion.correlativas.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Correlativas requeridas para cursar
              </h3>
              
              <div className="space-y-2">
                {verificacion.correlativas.map((correlativa) => (
                  <div
                    key={correlativa.materia_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        {correlativa.codigo} - {correlativa.nombre}
                      </span>
                    </div>
                    <Badge variant={correlativa.cumplida ? "default" : "destructive"}>
                      {correlativa.cumplida ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cumplida
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Pendiente
                        </span>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200 text-sm">
                  Esta materia no tiene correlativas de cursado requeridas.
                </span>
              </div>
            </div>
          )}

          {/* Resumen */}
          {!verificacion.puede_inscribirse && correlativasPendientes.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Para inscribirte debes:</strong> Cursar y aprobar las siguientes materias: {' '}
                {correlativasPendientes.map(c => c.nombre).join(', ')}
              </p>
            </div>
          )}

          {/* Información adicional si hay correlativas cumplidas */}
          {correlativasCumplidas.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Correlativas ya cumplidas:</strong> {' '}
                {correlativasCumplidas.map(c => c.nombre).join(', ')}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            {verificacion.puede_inscribirse ? (
              <Button 
                onClick={onProcederInscripcion}
                disabled={inscribiendo}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {inscribiendo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inscribiendo...
                  </>
                ) : (
                  'Proceder con la Inscripción'
                )}
              </Button>
            ) : (
              <Button variant="outline" onClick={onCancelar} className="flex-1">
                Entendido
              </Button>
            )}
            <Button variant="outline" onClick={onCancelar} disabled={inscribiendo}>
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}