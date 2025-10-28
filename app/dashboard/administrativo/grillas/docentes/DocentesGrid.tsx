"use client";

import { useState } from 'react';
import { Grilla } from '@/components/ui/grilla';
import AsignarMateriaDialog from './AsignarMateriaDialog';
import DesasignarMateriaDialog from './DesasignarMateriaDialog';
import EditUserModal from '@/components/ui/edit-user-modal';
import { asignarMateriaADocente, obtenerInformacionMaterias } from './actions';

interface MateriaAsignadaDetalle {
  id: number
  codigo: string
  nombre: string
  carrera: string
  año: string
  asignado: string
  estudiantes: number
  tieneMesaVigente?: boolean
}

interface Docente {
  id: string; // UUID en la base de datos
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
  console.log('🎯 DOCENTES VIEW CARGADO - Total docentes:', docentes?.length)
  console.log('🎯 Primer docente completo:', docentes?.[0])
  
  const [isAsignarDialogOpen, setIsAsignarDialogOpen] = useState(false);
  const [isDesasignarDialogOpen, setIsDesasignarDialogOpen] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Docente | null>(null);
  const [materiasDocente, setMateriasDocente] = useState<MateriaAsignadaDetalle[]>([]);
  const [cargandoMaterias, setCargandoMaterias] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docenteToEdit, setDocenteToEdit] = useState<Docente | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

    // Llamar a la función del servidor que tú implementarás
    const result = await asignarMateriaADocente(
      docenteSeleccionado.id,
      materiaId,
      materiaNombre
    );

    // Si fue exitoso, podrías recargar los datos o actualizar el estado
    if (result.success) {
      // Aquí podrías hacer un refresh de la página o actualizar el estado
      console.log('Materia asignada exitosamente');
      // window.location.reload(); // O usar un enfoque más elegante
    }

    return result;
  };

  const abrirDialogoAsignar = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setIsAsignarDialogOpen(true);
  };

  const abrirDialogoDesasignar = async (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setCargandoMaterias(true);
    setIsDesasignarDialogOpen(true);
    
    console.log('=== abrirDialogoDesasignar ===')
    console.log('Docente seleccionado:', docente)
    
    // Obtener la información de las materias directamente del servidor
    const materias = await obtenerInformacionMaterias(docente.id);
    
    console.log('Materias procesadas:', materias)
    setMateriasDocente(materias);
    
    setCargandoMaterias(false);
  };

  // Función placeholder para desasignar materias (tú la implementarás)
  const handleDesasignarMaterias = async (materiasIds: number[]) => {
    // TODO: Implementar lógica de desasignación en actions.ts
    console.log('Desasignando materias:', {
      docenteId: docenteSeleccionado?.id,
      materiasIds
    });

    // Simular respuesta exitosa
    return {
      success: true,
      mensaje: 'Materia(s) desasignada(s) exitosamente'
    };
  };

  // Funciones para editar docente
  function handleEdit(docente: Docente) {
    console.log('🔧 Debug - handleEdit docente:', docente)
    console.log('🔧 Debug - Telefono:', docente.telefono)
    console.log('🔧 Debug - Direccion completa:', docente.direccion_completa)
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
        
        // Mostrar mensaje de éxito - podrías agregar un estado de confirmación aquí
        alert(`Docente ${docenteToEdit.nombre} ${docenteToEdit.apellido} actualizado correctamente`)
        
        // Refrescar la página para mostrar los cambios
        window.location.reload()
      } else {
        alert('No se pudo actualizar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error('Error al actualizar docente:', err)
      alert('Error al actualizar docente')
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
      searchKeys={['nombre', 'legajo']}
      searchPlaceholder="Buscar por nombre o legajo..."
      filters={[]}
      columns={[
        {
          header: 'NOMBRE',
          accessor: (row) => (
            <div>
              <div className="font-medium text-gray-900">{row.nombre}</div>
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
                ✏️ Modificar
              </button>
              <button className="text-red-600 hover:text-red-800 font-medium">
                Eliminar
              </button>
            </div>
          )
        }
      ]}
      actions={
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
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
        onClose={() => setIsDesasignarDialogOpen(false)}
        docenteNombre={`${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`}
        docenteLegajo={docenteSeleccionado.legajo}
        docenteEstado="Activo"  // TODO: Obtener el estado real del docente
        docenteId={docenteSeleccionado.id}
        materiasAsignadas={materiasDocente}
        onDesasignar={handleDesasignarMaterias}
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
    </>
  );
}
