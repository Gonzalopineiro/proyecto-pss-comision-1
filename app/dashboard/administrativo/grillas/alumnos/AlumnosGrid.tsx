"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import ConfirmationPopup from '@/components/ui/confirmation-popup'
import EditUserModal from '@/components/ui/edit-user-modal'
import { useUserRole } from '@/utils/hooks'

interface Alumno {
  id: string
  nombre: string
  apellido: string
  dni?: number | null
  legajo?: number | null
  email?: string | null
  carrera_id?: number | null
  direccion?: string | null
  telefono?: string | null
  nacimiento?: string | null
}

export default function AlumnosGrid({ initialData }: { initialData: Alumno[] }) {
  // Debug: Imprimir los datos recibidos
  console.log('🔍 AlumnosGrid recibió initialData:', initialData)
  console.log('📊 Cantidad de alumnos recibidos:', initialData?.length || 0)
  
  const { role } = useUserRole()
  const [data, setData] = useState<Alumno[]>(initialData || [])
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Alumno | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false)
  const [alumnoName, setAlumnoName] = useState<string | null>(null)
  const [successType, setSuccessType] = useState<'deleted' | 'modified' | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<Alumno | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const router = useRouter()

  // On mount, check if another page set a success message (e.g. after editing an alumno)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('alumnoSuccess')
      if (raw) {
        try {
          const payload = JSON.parse(raw)
          if (payload && typeof payload === 'object') {
            setAlumnoName(payload.name || null)
            setSuccessType(payload.type || 'modified')
            setShowConfirmationPopup(true)
          }
        } catch (e) {
          // not JSON, treat as plain name
          setAlumnoName(String(raw))
          setSuccessType('modified')
          setShowConfirmationPopup(true)
        }
        localStorage.removeItem('alumnoSuccess')
      }
    } catch (e) {
      // ignore (server or blocked storage)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((a) => {
      const nombre = `${a.nombre || ''}`.toLowerCase()
      const apellido = `${a.apellido || ''}`.toLowerCase()
      const legajo = a.legajo ? String(a.legajo) : ''
      return (
        nombre.includes(q) ||
        apellido.includes(q) ||
        legajo.includes(q)
      )
    })
  }, [data, query])
  
  // Reset page when query changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [query])
  
  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginated = filtered.slice(startIndex, endIndex)

  function handleDelete(alumno: Alumno) {
    // Abrir modal de confirmación
    setToDelete(alumno)
    setConfirmOpen(true)
  }

  async function doDelete() {
    if (!toDelete) return

    setLoadingDelete(true)
    setDeletingId(toDelete.id)
    try {
      const deleted = toDelete
      const res = await fetch('/api/alumnos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: toDelete.id, email: toDelete.email })
      })

      const json = await res.json()
      if (json.success) {
        setData((prev) => prev.filter((p) => p.id !== deleted.id))
        setConfirmOpen(false)
        setToDelete(null)
        // Mostrar el popup de confirmación
        setAlumnoName(`${deleted.nombre} ${deleted.apellido}`)
        setSuccessType('deleted')
        setShowConfirmationPopup(true)
      } else {
        alert('No se pudo eliminar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error al eliminar alumno')
    } finally {
      setLoadingDelete(false)
      setDeletingId(null)
    }
  }

  function handleEdit(alumno: Alumno) {
    setUserToEdit(alumno)
    setEditModalOpen(true)
  }

  async function handleSaveEdit(editData: { email: string; telefono: string; direccion: string }) {
    if (!userToEdit) return

    setLoadingEdit(true)
    try {
      const res = await fetch('/api/alumnos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userToEdit.id,
          email: editData.email,
          telefono: editData.telefono,
          direccion: editData.direccion
        })
      })

      const json = await res.json()
      if (json.success) {
        // Actualizar los datos en la grilla
        setData(prev => prev.map(alumno => 
          alumno.id === userToEdit.id 
            ? { ...alumno, ...editData }
            : alumno
        ))
        
        // Cerrar modal
        setEditModalOpen(false)
        setUserToEdit(null)
        
        // Mostrar mensaje de éxito
        setAlumnoName(`${userToEdit.nombre} ${userToEdit.apellido}`)
        setSuccessType('modified')
        setShowConfirmationPopup(true)
      } else {
        alert('No se pudo actualizar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error('Error al actualizar alumno:', err)
      alert('Error al actualizar alumno')
    } finally {
      setLoadingEdit(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Alumnos</h2>
        <Link href="/dashboard/administrativo/registrar-alumno">
          <Button>+ Agregar Alumno</Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o legajo..."
            className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700"
          />
        </div>
        <select 
          className="p-2 border rounded bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700 min-w-[200px]"
          defaultValue=""
        >
          <option value="">Todas las carreras</option>
          <option value="ing-sistemas">Ing. en Sistemas</option>
          <option value="ing-industrial">Ing. Industrial</option>
          <option value="lic-administracion">Lic. Administración</option>
          <option value="lic-contabilidad">Lic. Contabilidad</option>
        </select>
      </div>

      {/* Popup de confirmación para eliminación y modificación */}
      <ConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={() => {
          setShowConfirmationPopup(false)
          router.push('/dashboard/administrativo/grillas/alumnos')
        }}
        title={successType === 'modified' ? '¡Alumno Modificado!' : '¡Alumno Eliminado!'}
        message={alumnoName ? `${successType === 'modified' ? 'El alumno' : 'Se eliminó al alumno'} ${alumnoName} ${successType === 'modified' ? 'ha sido modificado correctamente.' : 'del sistema.'}` : ''}
      />

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-600 dark:text-gray-300 border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">DNI</th>
              <th className="pb-2">Legajo</th>
              <th className="pb-2">Carrera</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr key={a.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-900">
                <td className="py-3">
                  <div className="font-medium">{a.nombre} {a.apellido}</div>
                  <div className="text-sm text-gray-500">{a.email ?? ''}</div>
                </td>
                <td className="py-3">{a.dni ?? '-'}</td>
                <td className="py-3">{a.legajo ?? '-'}</td>
                <td className="py-3">{a.carrera_id ?? '-'}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(a)}
                      disabled={loadingEdit}
                    >
                      ✏️ Modificar
                    </Button>
                    {(role === 'admin' || role === 'super') && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(a)} disabled={loadingDelete && deletingId === a.id}>
                        🗑️ {loadingDelete && deletingId === a.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  <div>No se encontraron alumnos</div>
                  <div className="text-xs mt-2">
                    Debug: Total de datos: {data.length} | Filtrados: {filtered.length} | Página actual: {currentPage}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Vista hasta 40 alumnos.
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Anterior
          </Button>

          {/* Mostrar botones de página (limitados si hay muchas páginas) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let page: number
              
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }

              const isActive = page === currentPage
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${isActive ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border'}`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Siguiente
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null) }}
        title="Confirmar eliminación"
        message={`¿Estás seguro que deseas eliminar a ${toDelete?.nombre} ${toDelete?.apellido}? Esta acción es irreversible.`}
        onConfirm={doDelete}
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Cancelar"
        loading={loadingDelete}
      />

      <EditUserModal
        isOpen={editModalOpen}
        user={userToEdit}
        onClose={() => {
          setEditModalOpen(false)
          setUserToEdit(null)
        }}
        onSave={handleSaveEdit}
        loading={loadingEdit}
      />
    </Card>
  )
}
