// app/dashboard/docente/mesas-examen/[idMesa]/formulario-carga-notas.tsx
'use client'

import React, { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  actualizarPresente, 
  guardarNota,
  publicarNotas,
  type AlumnoInscripcion,
  type MesaExamenDetalles
} from './actions'

// --- NUEVAS IMPORTACIONES ---
import ConfirmDialog from '@/components/ui/confirm-dialog' // Asume que existe aquí
import ConfirmationPopup from '@/components/ui/confirmation-popup' // Asume que existe aquí
// --------------------------

// (Importaciones de Button, Checkbox, etc. se mantienen)
import { Button } from '@/components/ui/button'
// ... (resto de importaciones de UI)
import { Save } from 'lucide-react' // Asegúrate de tener Save

interface FormularioProps {
  // ... (props se mantienen)
}

export default function FormularioCargaNotas({ 
  idMesa, 
  initialAlumnos, 
  estadoMesa 
}: FormularioProps) {

  const router = useRouter()
  const [alumnos, setAlumnos] = useState(initialAlumnos)
  const [isPending, startTransition] = useTransition()
  
  // --- NUEVOS ESTADOS PARA MODALES ---
  const [showPublishConfirm, setShowPublishConfirm] = useState(false) // Para ConfirmDialog (publicar)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false) // Para ConfirmationPopup (éxito)
  const [popupTitle, setPopupTitle] = useState('') // Título del popup de éxito
  const [popupMessage, setPopupMessage] = useState('') // Mensaje del popup de éxito
  // ---------------------------------

  // (Estados derivados como isCargaFinalizada, allGraded se mantienen)
  const isCargaFinalizada = estadoMesa === 'finalizada' || estadoMesa === 'cancelada'
  // ... (resto de estados derivados)

  // (Cálculo de allGraded se mantiene)
  const { allGraded, gradedCount } = useMemo(() => {
     // ... (lógica de allGraded)
  }, [alumnos])

  // (Funciones handlePresenteChange y handleNotaBlur se mantienen sin cambios)
  const handlePresenteChange = // ... (sin cambios)
  const handleNotaBlur = // ... (sin cambios)

  // --- FUNCIONES PARA MANEJAR MODALES ---

  // Botón "Guardar Calificaciones" ahora usa ConfirmationPopup
  const handleGuardarClickeado = () => {
    // Ya no usamos alert()
    setPopupTitle("Progreso Guardado");
    setPopupMessage("Tus cambios han sido guardados. Recuerda que las notas se guardan automáticamente al editar.");
    setShowSuccessPopup(true);
    // Nota: Podrías añadir una llamada a una acción 'guardarTodo' aquí si lo prefieres
    // startTransition(async () => { await guardarTodoElProgreso(); ... });
  };
  
  // Paso 1: Botón "Publicar Notas" abre el diálogo de confirmación
  const handlePublicarClick = () => {
    if (!allGraded) {
      alert('Error: Debe calificar o marcar como ausente a todos los estudiantes antes de poder publicar.');
      return;
    }
    // Abre el ConfirmDialog en lugar de usar confirm()
    setShowPublishConfirm(true); 
  };

  // Paso 2: El ConfirmDialog llama a esta función si se confirma
  const doPublish = () => {
    // Cerramos el diálogo de confirmación
    setShowPublishConfirm(false); 

    startTransition(async () => {
      const result = await publicarNotas(idMesa); 
      if (result.success) {
        // Ya no usamos alert(), mostramos el popup de éxito
        setPopupTitle("¡Notas Publicadas!");
        setPopupMessage("Las notas han sido publicadas correctamente y se ha notificado a los estudiantes.");
        setShowSuccessPopup(true);
        // La página se recargará por revalidatePath, mostrando el estado final
      } else {
        // Mantenemos el alert para errores inesperados
        alert(`Error al publicar las notas: ${result.error}`);
      }
    });
  };

  // (getEstadoBadge se mantiene)
  const getEstadoBadge = // ... (sin cambios)

  // --- JSX (Aquí añadiremos los modales) ---
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden">
      
      {/* (Tabla se mantiene igual) */}
      <div className="p-4 border-b ...">...</div>
      <div className="overflow-x-auto">
         <Table> ... </Table>
      </div>

      {/* Footer de Acciones (Botones llaman a las nuevas funciones) */}
      <div className="p-4 border-t ...">
        {/* Lado izquierdo (Exportar/Imprimir) */}
        <div className="flex gap-2">
           {/* (Botones Exportar/Imprimir sin cambios, usan 'disabled={isPending}') */}
           <Button variant="outline" size="sm" disabled={isPending}>...</Button>
           <Button variant="outline" size="sm" disabled={isPending}>...</Button>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-4">
          {!isCargaFinalizada && (
            <>
              {/* Botón Publicar (Ahora llama a handlePublicarClick) */}
              <Button 
                size="lg"
                variant="outline" 
                disabled={!allGraded || isPending}
                onClick={handlePublicarClick} // <-- Llama a la función que abre el ConfirmDialog
                title={!allGraded ? "Debe calificar a todos los alumnos para publicar" : "Publicar notas (Acción final)"}
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar Notas
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isPending}>
                  Cancelar
                </Button>
                
                {/* Botón "Guardar Calificaciones" (Llama a handleGuardarClickeado) */}
                <Button 
                  size="sm" 
                  onClick={handleGuardarClickeado} // <-- Llama a la función que abre el SuccessPopup
                  disabled={isPending}
                  title="Guardar progreso (se guarda automáticamente al editar)"
                  className="bg-gray-900 ..."
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Calificaciones
                </Button>
              </div>
            </>
          )}

          {isCargaFinalizada && (
            <>
              {/* (Botones Volver y Notas Publicadas se mantienen) */}
               <Button variant="outline" size="sm" onClick={() => router.back()}>Volver</Button>
               <Button size="lg" disabled className="bg-green-700">...</Button>
            </>
          )}
        </div>
      </div>

      {/* --- AÑADIR LOS MODALES AQUÍ --- */}

      {/* 1. Diálogo de Confirmación para Publicar */}
      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)} // Simplemente cierra si cancela
        title="Confirmar Publicación de Notas"
        message="¿Está seguro de que desea publicar estas notas? Esta acción es irreversible y se notificará a los estudiantes."
        onConfirm={doPublish} // Llama a la función que ejecuta la acción
        confirmLabel="Sí, Publicar Notas"
        cancelLabel="Cancelar"
        loading={isPending} // Muestra estado de carga si 'publicarNotas' está en proceso
      />

      {/* 2. Popup de Notificación de Éxito (para Guardar y Publicar) */}
      <ConfirmationPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)} // Cierra el popup
        title={popupTitle} // Título dinámico
        message