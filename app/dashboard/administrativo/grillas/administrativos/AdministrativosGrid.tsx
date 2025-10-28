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

interface Administrativo {
  id: string
  nombre: string
  apellido: string
  dni?: number | null
  legajo?: number | null
  email?: string | null
}

export default function AdministrativosGrid({ initialData }: { initialData: Administrativo[] }) {
  const { role } = useUserRole()
  const [data, setData] = useState<Administrativo[]>(initialData || [])
  const [query, setQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Administrativo | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [successType, setSuccessType] = useState<'deleted' | 'modified' | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<Administrativo | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const router = useRouter()

  // On mount, check if another page set a success message (e.g. after editing an admin)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('adminSuccess')
      if (raw) {
        try {
          const payload = JSON.parse(raw)
          if (payload && typeof payload === 'object') {
            setAdminName(payload.name || null)
            setSuccessType(payload.type || 'modified')
            setShowConfirmationPopup(true)
          }
        } catch (e) {
          // not JSON, treat as plain name
          setAdminName(String(raw))
          setSuccessType('modified')
          setShowConfirmationPopup(true)
        }
        localStorage.removeItem('adminSuccess')
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

  function handleDelete(admin: Administrativo) {
    // Abrir modal de confirmación
    setToDelete(admin)
    setConfirmOpen(true)
  }

  async function doDelete() {
    if (!toDelete) return

    setLoadingDelete(true)
    setDeletingId(toDelete.id)
    try {
      const deleted = toDelete
      const res = await fetch('/api/administrativos/delete', {
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
        setAdminName(`${deleted.nombre} ${deleted.apellido}`)
        setSuccessType('deleted')
        setShowConfirmationPopup(true)
      } else {
        alert('No se pudo eliminar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error al eliminar administrativo')
    } finally {
      setLoadingDelete(false)
      setDeletingId(null)
    }
  }

  function handleEdit(admin: Administrativo) {
    setUserToEdit(admin)
    setEditModalOpen(true)
  }

  async function handleSaveEdit(editData: { email: string; telefono: string; direccion: string }) {
    if (!userToEdit) return

    setLoadingEdit(true)
    try {
      const res = await fetch('/api/administrativos/update', {
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
        setData(prev => prev.map(admin => 
          admin.id === userToEdit.id 
            ? { ...admin, ...editData }
            : admin
        ))
        
        // Cerrar modal
        setEditModalOpen(false)
        setUserToEdit(null)
        
        // Mostrar mensaje de éxito
        setAdminName(`${userToEdit.nombre} ${userToEdit.apellido}`)
        setSuccessType('modified')
        setShowConfirmationPopup(true)
      } else {
        alert('No se pudo actualizar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error('Error al actualizar administrativo:', err)
      alert('Error al actualizar administrativo')
    } finally {
      setLoadingEdit(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Administrativos</h2>
        <Link href="/dashboard/administrativo/registrar-administrativo">
          <Button>Regitrar Administrativo</Button>
        </Link>
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, apellido o legajo..."
          className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-700"
        />
      </div>

      {/* Popup de confirmación para eliminación y modificación */}
      <ConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={() => {
          setShowConfirmationPopup(false)
          router.push('/dashboard/administrativo/grillas/administrativos')
        }}
        title={successType === 'modified' ? '¡Administrador Modificado!' : '¡Administrador Eliminado!'}
        message={adminName ? `${successType === 'modified' ? 'El administrador' : 'Se eliminó al administrador'} ${adminName} ${successType === 'modified' ? 'ha sido modificado correctamente.' : 'del sistema.'}` : ''}
      />

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-600 dark:text-gray-300 border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">DNI</th>
              <th className="pb-2">Legajo</th>
              <th className="pb-2">Mail</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
              {paginated.map((a) => (
              <tr key={a.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-900">
                <td className="py-3">
                  <div className="font-medium">{a.nombre} {a.apellido}</div>
                </td>
                <td className="py-3">{a.dni ?? '-'}</td>
                <td className="py-3">{a.legajo ?? '-'}</td>
                <td className="py-3">{a.email ?? '-'}</td>
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
                    {role === 'super' && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(a)} disabled={loadingDelete && deletingId === a.id}>
                        {loadingDelete && deletingId === a.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

              {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">No se encontraron administrativos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        {/* Paginación */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} de {totalItems}</div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Anterior
            </Button>

            {/* Mostrar botones de página (limitados si hay muchas páginas) */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1
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
          userType="administrativo"
        />
    </Card>
  )
}