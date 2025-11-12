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
  carrera?: {
    id: number
    nombre: string
    codigo: string
  } | null
  direccion?: string | null
  telefono?: string | null
  nacimiento?: string | null
}

export default function AlumnosGrid({ initialData }: { initialData: Alumno[] }) {
  // Debug: Imprimir los datos recibidos
  console.log('📊 Cantidad de alumnos recibidos:', initialData?.length || 0)
  
  const { role } = useUserRole()
  const [data, setData] = useState<Alumno[]>(initialData || [])
  const [query, setQuery] = useState('')
  const [selectedCarrera, setSelectedCarrera] = useState('')
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

  // Obtener carreras únicas de los datos
  const carreras = useMemo(() => {
    const carrerasUnicas = new Map()
    data.forEach(alumno => {
      if (alumno.carrera) {
        carrerasUnicas.set(alumno.carrera.id, alumno.carrera)
      }
    })
    return Array.from(carrerasUnicas.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [data])

  const filtered = useMemo(() => {
    let result = data

    // Filtrar por carrera seleccionada
    if (selectedCarrera) {
      result = result.filter(a => a.carrera?.id === parseInt(selectedCarrera))
    }

    // Filtrar por texto de búsqueda
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((a) => {
        const nombre = `${a.nombre || ''}`.toLowerCase()
        const apellido = `${a.apellido || ''}`.toLowerCase()
        const legajo = a.legajo ? String(a.legajo) : ''
        const carrera = `${a.carrera?.nombre || ''}`.toLowerCase()
        return (
          nombre.includes(q) ||
          apellido.includes(q) ||
          legajo.includes(q) ||
          carrera.includes(q)
        )
      })
    }

    return result
  }, [data, query, selectedCarrera])
  
  // Reset page when query or carrera filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [query, selectedCarrera])
  
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
        console.error('Error al eliminar:', json.error || 'Error desconocido')
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
            placeholder="Buscar por nombre, legajo o carrera..."
            className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700"
          />
        </div>
        <select 
          className="p-2 border rounded bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700 min-w-[200px]"
          title="Filtrar por carrera"
          value={selectedCarrera}
          onChange={(e) => setSelectedCarrera(e.target.value)}
        >
          <option value="">Todas las carreras</option>
          {carreras.map((carrera) => (
            <option key={carrera.id} value={carrera.id.toString()}>
              {carrera.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Indicadores de filtros activos */}
      {(selectedCarrera || query) && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-300">Filtros activos:</span>
          {selectedCarrera && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
              Carrera: {carreras.find(c => c.id.toString() === selectedCarrera)?.nombre}
              <button 
                onClick={() => setSelectedCarrera('')}
                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                title="Quitar filtro de carrera"
              >
                ×
              </button>
            </span>
          )}
          {query && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
              Búsqueda: "{query}"
              <button 
                onClick={() => setQuery('')}
                className="ml-1 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
                title="Limpiar búsqueda"
              >
                ×
              </button>
            </span>
          )}
          <button 
            onClick={() => { setSelectedCarrera(''); setQuery('') }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}

      {/* Popup de confirmación para eliminación y modificación */}
      <ConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={() => {
          setShowConfirmationPopup(false)
          if (successType === 'deleted') {
            // Refresh la página después de eliminar para obtener datos actualizados
            window.location.reload()
          } else {
            // Para modificaciones, solo navegar sin refresh
            router.push('/dashboard/administrativo/grillas/alumnos')
          }
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
                <td className="py-3">{a.carrera?.nombre ?? '-'}</td>
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
                    {selectedCarrera && <div>Filtro de carrera activo: {carreras.find(c => c.id.toString() === selectedCarrera)?.nombre}</div>}
                    {query && <div>Búsqueda activa: "{query}"</div>}
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
          {filtered.length === data.length 
            ? `Mostrando ${Math.min(pageSize, filtered.length)} de ${filtered.length} alumnos`
            : `Mostrando ${Math.min(pageSize, filtered.length)} de ${filtered.length} alumnos filtrados (total: ${data.length})`
          }
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
        userType="estudiante"
      />
    </Card>
  )
}
