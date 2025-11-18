"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
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
        <div className="p-6 max-w-md bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 animate-spin text-blue-600" />
            <span>Verificando correlativas...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!verificacion) return null

  const correlativasNoAprobadas = verificacion.correlativas.filter(c => !c.cumplida)
  const correlativasAprobadas = verificacion.correlativas.filter(c => c.cumplida)

  return (
    <Dialog open={true} onOpenChange={onCancelar}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {verificacion.puede_inscribirse ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            Inscripción a Cursada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 text-left text-sm text-muted-foreground">
            <div><strong>Materia:</strong> {materia.nombre}</div>
            <div><strong>Código:</strong> {materia.codigo_materia}</div>
          </div>
          {verificacion.correlativas.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-700">
                ¡Perfecto! Esta materia no tiene correlativas de cursado.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Puedes inscribirte directamente a la cursada.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-3">
                Correlativas para Cursado ({verificacion.correlativas.length})
              </h3>
              
              {correlativasAprobadas.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Correlativas Cumplidas ({correlativasAprobadas.length})
                  </h4>
                  <div className="space-y-2">
                    {correlativasAprobadas.map((correlativa) => (
                      <div key={correlativa.materia_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-medium text-green-800">{correlativa.nombre}</p>
                          <p className="text-xs text-green-600">Código: {correlativa.codigo}</p>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completa
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {correlativasNoAprobadas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Correlativas Pendientes ({correlativasNoAprobadas.length})
                  </h4>
                  <div className="space-y-2">
                    {correlativasNoAprobadas.map((correlativa) => (
                      <div key={correlativa.materia_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-red-800">{correlativa.nombre}</p>
                          <p className="text-xs text-red-600">Código: {correlativa.codigo}</p>
                        </div>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!verificacion.puede_inscribirse && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">No puedes inscribirte aún</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Para cursar esta materia, debes aprobar las correlativas de cursado listadas arriba.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancelar}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onProcederInscripcion}
            disabled={!verificacion.puede_inscribirse || inscribiendo}
            className="flex-1"
          >
            {inscribiendo ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Inscribiendo...
              </>
            ) : verificacion.puede_inscribirse ? (
              'Confirmar Inscripción'
            ) : (
              'No Disponible'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}