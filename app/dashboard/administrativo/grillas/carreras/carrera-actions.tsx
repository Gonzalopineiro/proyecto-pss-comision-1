'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { eliminarCarrera, type CarreraCompleta } from '@/app/dashboard/administrativo/crear-carrera/actions';

interface CarreraActionsProps {
  carrera: CarreraCompleta;
  onCarreraEliminada: (id: number) => void; 
}

export function CarreraActions({ carrera, onCarreraEliminada }: CarreraActionsProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tieneInscriptos = carrera.inscriptos > 0;

  const handleEliminar = async () => {
    setIsDeleting(true);
    const result = await eliminarCarrera(carrera.id);
    
    if ('error' in result && result.error) {
      alert(result.error);
    } else {      
      onCarreraEliminada(carrera.id);
    }
    
    setIsAlertOpen(false);
    setIsDeleting(false);
  };

  return (
    <>
      <div className="flex gap-2 justify-end">
                {/* 2. Envuelve el botón de Editar con el componente Link */}
                <Link href={`/dashboard/administrativo/carreras/${carrera.id}`}>
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                    </Button>
                </Link>
                
                {/* El botón de eliminar se queda como está */}
                <Button
                    variant="outline" size="sm"
                    onClick={() => setIsAlertOpen(true)}
                    disabled={tieneInscriptos}
                    title={tieneInscriptos ? 'No se puede eliminar con estudiantes activos' : 'Eliminar carrera'}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de que desea eliminar esta carrera?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la carrera
              <span className="font-semibold"> {carrera.nombre}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}