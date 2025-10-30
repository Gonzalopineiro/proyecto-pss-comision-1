"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grilla } from '@/components/ui/grilla';
import AsignarMateriaDialog from './AsignarMateriaDialog';
import DesasignarMateriaDialog from './DesasignarMateriaDialog';
import ConfirmationPopup from '@/components/ui/confirmation-popup';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EditUserModal from '@/components/ui/edit-user-modal';
import { asignarMateriaADocente, obtenerInformacionMaterias, desasignarMateriasDocente, eliminarDocente } from './actions';

interface MateriaAsignadaDetalle {
  id: number
  codigo: string
  nombre: string
  carrera: string
  año: string
  asignado: string
  estudiantes: number
  tieneMesaVigente?: boolean
  fechaMesaVigente?: string
}

interface Docente {
  id: string; // UUID del docente
  nombre: string;
  apellido: string;
  dni: string;
  legajo: string;
  materias: string[];
  email: string;
  telefono?: string | null;
  direccion_completa?: string | null;
  materia_docente_completo?: any[]; // Datos completos de materia_docente
}

interface DocentesViewProps {
  docentes: Docente[];
}

export default function DocentesView({ docentes }: DocentesViewProps) {
  const [isAsignarDialogOpen, setIsAsignarDialogOpen] = useState(false);
  const [isDesasignarDialogOpen, setIsDesasignarDialogOpen] = useState(false);
  const [isModificarPopupOpen, setIsModificarPopupOpen] = useState(false);
  const [isEliminarPopupOpen, setIsEliminarPopupOpen] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Docente | null>(null);
  const [materiasDocente, setMateriasDocente] = useState<MateriaAsignadaDetalle[]>([]);
  const [cargandoMaterias, setCargandoMaterias] = useState(false);
  const [eliminandoDocente, setEliminandoDocente] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docenteToEdit, setDocenteToEdit] = useState<Docente | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validar que docentes no sea undefined o null
  if (!docentes || !Array.isArray(docentes)) {
    return <div>No hay docentes disponibles</div>
  }

  // Función para asignar materia (llama a la acción del servidor)
  const handleAsignarMateria = async (materiaId: string, materiaNombre: string) => {
    if (!docenteSeleccionado?.id) {
      return { 
        success: false, 
        error: 'No se pudo identificar el docente' 
      };
    }

    // Llamar a la función del servidor
    const result = await asignarMateriaADocente(
      docenteSeleccionado.id,
      materiaId,
      materiaNombre
    );

    // Si fue exitoso, mostrar mensaje de éxito
    if (result.success) {
      setIsAsignarDialogOpen(false);
      setSuccessMessage(`Materia asignada exitosamente al docente ${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`);
      setShowSuccessPopup(true);
    }

    return result;
  };

  const abrirDialogoAsignar = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setIsAsignarDialogOpen(true);
  };

  const abrirPopupModificar = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setIsModificarPopupOpen(true);
  };

  const abrirPopupEliminar = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setErrorEliminar('');
    setIsEliminarPopupOpen(true);
  };

  const handleEliminarDocente = async () => {
    if (!docenteSeleccionado?.id) {
      setErrorEliminar('No se pudo identificar el docente');
      return;
    }

    setEliminandoDocente(true);
    setErrorEliminar('');

    try {
      const result = await eliminarDocente(docenteSeleccionado.id);

      if (result.success) {
        // Cerrar el popup de eliminación
        setIsEliminarPopupOpen(false);
        
        // Mostrar mensaje de éxito
        setSuccessMessage(result.mensaje || `El docente ${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido} ha sido eliminado exitosamente`);
        setShowSuccessPopup(true);
      } else {
        setErrorEliminar(result.error || 'Error al eliminar el docente');
      }
    } catch (error: any) {
      setErrorEliminar(error.message || 'Error inesperado al eliminar el docente');
    } finally {
      setEliminandoDocente(false);
    }
  };

  const abrirDialogoDesasignar = async (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setCargandoMaterias(true);
    setIsDesasignarDialogOpen(true);
    
    // Obtener la información de las materias directamente del servidor
    const materias = await obtenerInformacionMaterias(docente.id);
    
    setMateriasDocente(materias);
    
    setCargandoMaterias(false);
  };

  // Función placeholder para desasignar materias (tú la implementarás)
  const handleDesasignarMaterias = async (materiasIds: number[]) => {
    if (!docenteSeleccionado?.id) {
      return {
        success: false,
        error: 'No se pudo identificar el docente'
      };
    }

    // Llamar a la función del servidor
    const result = await desasignarMateriasDocente(
      docenteSeleccionado.id,
      materiasIds
    );


    if (result.success) {
      setIsDesasignarDialogOpen(false);
      setSuccessMessage(result.mensaje || `Materias desasignadas exitosamente del docente ${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`);
      setShowSuccessPopup(true);
    }

    return result;
  };

  // Funciones para editar docente
  function handleEdit(docente: Docente) {
    setDocenteToEdit(docente)
    setEditModalOpen(true)
  }

  async function handleSaveEdit(editData: { email: string; telefono: string; direccion: string }) {
    if (!docenteToEdit) return

    setLoadingEdit(true)
    try {
      const res = await fetch('/api/docentes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docenteToEdit.id,
          email: editData.email,
          telefono: editData.telefono,
          direccion: editData.direccion
        })
      })

      const json = await res.json()
      if (json.success) {
        // Cerrar modal
        setEditModalOpen(false)
        setDocenteToEdit(null)
        
        // Mostrar mensaje de éxito con popup de confirmación
        setSuccessMessage(`Docente ${docenteToEdit.nombre} ${docenteToEdit.apellido} actualizado correctamente`)
        setShowSuccessPopup(true)
      } else {
        // Cerrar modal
        setEditModalOpen(false)
        setDocenteToEdit(null)
        
        // Mostrar mensaje de error con popup
        setErrorMessage('No se pudo actualizar: ' + (json.error || 'Error desconocido'))
        setShowErrorPopup(true)
      }
    } catch (err) {
      console.error('Error al actualizar docente:', err)
      // Cerrar modal
      setEditModalOpen(false)
      setDocenteToEdit(null)
      
      // Mostrar mensaje de error con popup
      setErrorMessage('Error al actualizar docente. Por favor, intente nuevamente.')
      setShowErrorPopup(true)
    } finally {
      setLoadingEdit(false)
    }
  }
  
  // Mapea a solo lo que necesitas para la grilla
  const docentesGrilla: Docente[] = docentes.map(d => ({
    id: d.id,
    nombre: d.nombre,
    apellido: d.apellido,
    dni: d.dni,
    legajo: d.legajo,
    email: d.email,
    telefono: d.telefono,
    direccion_completa: d.direccion_completa,
    materias: d.materias || []
  }))
  
  return (
    <>
    <Grilla
      title="Gestión de Docentes"
      subtitle="Administra y gestiona la información de los docentes"
      data={docentesGrilla}
      searchKeys={['nombre', 'apellido', 'legajo']}
      searchPlaceholder="Buscar por nombre, apellido o legajo..."
      filters={[]}
      columns={[
        {
          header: 'NOMBRE',
          accessor: (row) => (
            <div>
              <div className="font-medium text-gray-900">{row.apellido} {row.nombre}</div>
              <div className="text-gray-500 text-xs">{row.email}</div>
            </div>
          )
        },
        { header: 'DNI', accessor: 'dni' },
        { header: 'LEGAJO', accessor: 'legajo' },
        {
          header: 'MATERIAS',
          accessor: (row) => {
            const materias = row.materias || [];
            const maxVisible = 3; // Mostrar máximo 3 materias antes de colapsar
            const materiasVisibles = materias.slice(0, maxVisible);
            const materiasOcultas = materias.length - maxVisible;
            
            return (
              <div className="flex flex-col gap-2">
                {/* Materias arriba */}
                <div className="flex gap-1 flex-wrap">
                  {materiasVisibles.length > 0 ? (
                    <>
                      {materiasVisibles.map((m, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {m}
                        </span>
                      ))}
                      {materiasOcultas > 0 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          +{materiasOcultas} más
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Sin materias</span>
                  )}
                </div>
                {/* Botones abajo */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => abrirDialogoAsignar(row)}
                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                  >
                    + Asignar
                  </button>
                  <button 
                    onClick={() => abrirDialogoDesasignar(row)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    − Desasignar
                  </button>
                </div>
              </div>
            );
          }
        },
        {
          header: 'ACCIONES',
          accessor: (row) => (
            <div className="flex gap-3">
              <button 
                className="text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => handleEdit(row)}
                disabled={loadingEdit}
              >
                Modificar
              </button>
              <button 
                onClick={() => abrirPopupEliminar(row)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Eliminar
              </button>
            </div>
          )
        }
      ]}
      actions={
        <button 
          onClick={() => router.push('/dashboard/administrativo/registrar-docente')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Agregar Docente
        </button>
      }
    />

    {/* Diálogo para asignar materia */}
    {docenteSeleccionado && (
      <AsignarMateriaDialog
        isOpen={isAsignarDialogOpen}
        onClose={() => setIsAsignarDialogOpen(false)}
        docenteNombre={`${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`}
        docenteId={docenteSeleccionado.id}
        onAsignar={handleAsignarMateria}
      />
    )}

    {/* Diálogo para desasignar materias */}
    {docenteSeleccionado && (
      <DesasignarMateriaDialog
        isOpen={isDesasignarDialogOpen}
        onClose={() => {
          setIsDesasignarDialogOpen(false);
          setMateriasDocente([]); // Limpiar los datos al cerrar/cancelar
        }}
        docenteNombre={`${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`}
        docenteLegajo={docenteSeleccionado.legajo}
        docenteEstado="activo"
        docenteId={docenteSeleccionado.id}
        materiasAsignadas={materiasDocente}
        onDesasignar={handleDesasignarMaterias}
        cargandoMaterias={cargandoMaterias}
      />
    )}

    {/* Diálogo de confirmación para eliminar */}
    {docenteSeleccionado && (
      <ConfirmDialog
        isOpen={isEliminarPopupOpen}
        title="Eliminar Docente"
        message={`¿Está seguro que desea eliminar al docente ${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido} (Legajo: ${docenteSeleccionado.legajo})? Esta acción no se puede deshacer y eliminará todas sus asignaciones de materias.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={eliminandoDocente}
        error={errorEliminar}
        onClose={() => {
          setIsEliminarPopupOpen(false);
          setErrorEliminar('');
        }}
        onConfirm={handleEliminarDocente}
      />
    )}

    {/* Modal de edición */}
    <EditUserModal
      isOpen={editModalOpen}
      user={docenteToEdit ? {
        id: docenteToEdit.id, // Ya es string (UUID)
        nombre: docenteToEdit.nombre,
        apellido: docenteToEdit.apellido,
        email: docenteToEdit.email,
        telefono: docenteToEdit.telefono || '',
        direccion: docenteToEdit.direccion_completa || ''
      } : null}
      onClose={() => {
        setEditModalOpen(false)
        setDocenteToEdit(null)
      }}
      onSave={handleSaveEdit}
      loading={loadingEdit}
      userType="docente"
    />

    {/* Popup de éxito para operaciones exitosas */}
    <ConfirmationPopup
      isOpen={showSuccessPopup}
      onClose={() => {
        setShowSuccessPopup(false)
        // Refrescar la página para mostrar los cambios
        window.location.reload()
      }}
      title="¡Operación Exitosa!"
      message={successMessage}
    />

    {/* Popup de error para modificar docente */}
    <ConfirmationPopup
      isOpen={showErrorPopup}
      onClose={() => {
        setShowErrorPopup(false)
      }}
      title="Error al Actualizar Docente"
      message={errorMessage}
      type="error"
    />
    </>
  );
}
