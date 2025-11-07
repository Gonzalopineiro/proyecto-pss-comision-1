"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { VerificacionCorrelativasFinales } from './actions';

interface CorrelativasFinalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificacion: VerificacionCorrelativasFinales | null;
  mesaInfo: {
    materia_nombre: string;
    fecha_examen: string;
    hora_examen: string;
    ubicacion: string;
  } | null;
  onConfirm: () => void;
  isLoading: boolean;
}

const CorrelativasFinalesModal: React.FC<CorrelativasFinalesModalProps> = ({
  isOpen,
  onClose,
  verificacion,
  mesaInfo,
  onConfirm,
  isLoading
}) => {
  if (!verificacion || !mesaInfo) return null;

  const correlativasNoAprobadas = verificacion.correlativas.filter(c => !c.cumplida);
  const correlativasAprobadas = verificacion.correlativas.filter(c => c.cumplida);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {verificacion.puede_inscribirse ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            Inscripción a Examen Final
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 text-left text-sm text-muted-foreground">
            <div><strong>Materia:</strong> {mesaInfo.materia_nombre}</div>
            <div><strong>Fecha:</strong> {(() => {
              const [año, mes, dia] = mesaInfo.fecha_examen.split('-').map(Number);
              const fechaLocal = new Date(año, mes - 1, dia);
              return fechaLocal.toLocaleDateString('es-AR');
            })()}</div>
            <div><strong>Hora:</strong> {mesaInfo.hora_examen}</div>
            <div><strong>Ubicación:</strong> {mesaInfo.ubicacion}</div>
          </div>
          {verificacion.correlativas.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-700">
                ¡Perfecto! Esta materia no tiene correlativas para el examen final.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Puedes inscribirte directamente al examen.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-3">
                Correlativas para Examen Final ({verificacion.correlativas.length})
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
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Cursada: {correlativa.cursada_aprobada ? '✅' : '❌'}
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Final: {correlativa.final_aprobado ? '✅' : '❌'}
                            </span>
                          </div>
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
                          <div className="flex gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              correlativa.cursada_aprobada 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              Cursada: {correlativa.cursada_aprobada ? '✅' : '❌'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              correlativa.final_aprobado 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              Final: {correlativa.final_aprobado ? '✅' : '❌'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          {!correlativa.cursada_aprobada && !correlativa.final_aprobado 
                            ? 'Cursada + Final'
                            : !correlativa.cursada_aprobada 
                            ? 'Cursada'
                            : 'Final'
                          }
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
                    Para rendir el examen final, debes tener APROBADA la cursada Y el examen final de todas las materias correlativas listadas arriba.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    * Se necesitan ambos requisitos: cursada aprobada + final aprobado
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!verificacion.puede_inscribirse || isLoading}
            className="flex-1"
          >
            {isLoading ? (
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
  );
};

export default CorrelativasFinalesModal;