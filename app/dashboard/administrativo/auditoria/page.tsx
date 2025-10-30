"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, Filter, RefreshCw, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: {
    updated_fields?: any;
    updated_by?: string;
    timestamp?: string;
    auth_user_id?: string;
  };
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Cargar auditorías
  const loadAuditLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.userId && { userId: filters.userId })
      });

      const response = await fetch(`/api/audit?${params}`);
      const result = await response.json();

      if (result.success) {
        setAuditLogs(result.data);
        setPagination(result.pagination);
        if (result.warning) {
          setWarning(result.warning);
        }
      } else {
        setError(result.error || 'Error al cargar auditorías');
        console.error('Error al cargar auditorías:', result.error);
      }
    } catch (error) {
      setError('Error de conexión al cargar auditorías');
      console.error('Error al cargar auditorías:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Aplicar filtros
  const handleApplyFilters = () => {
    loadAuditLogs(1); // Resetear a la página 1 cuando se aplican filtros
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      search: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      userId: ''
    });
    // Recargar después de limpiar
    setTimeout(() => loadAuditLogs(1), 100);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtener nombre de acción legible
  const getActionName = (action: string) => {
    const actionNames: { [key: string]: string } = {
      'UPDATE_OWN_PROFILE': 'Modificó perfil propio',
      'UPDATE_DOCENTE_DATA': 'Modificó datos de docente',
      'UPDATE_USER_DATA': 'Modificó datos de alumno',
      'UPDATE_ADMINISTRATIVO_DATA': 'Modificó datos de administrativo'
    };
    return actionNames[action] || action;
  };

  // Obtener color de la acción
  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'UPDATE_OWN_PROFILE': 'bg-blue-100 text-blue-800',
      'UPDATE_DOCENTE_DATA': 'bg-green-100 text-green-800',
      'UPDATE_USER_DATA': 'bg-purple-100 text-purple-800',
      'UPDATE_ADMINISTRATIVO_DATA': 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Auditoría del Sistema</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Historial completo de cambios y modificaciones del sistema
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAuditLogs(pagination.page)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {warning && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-yellow-700 dark:text-yellow-400">
                  <strong>⚠️ Aviso:</strong> {warning}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWarning(null)}
                  className="ml-auto text-yellow-700 hover:text-yellow-800"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buscar</label>
                  <Input
                    placeholder="ID de usuario, acción..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Acción</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-slate-700"
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="">Todas las acciones</option>
                    <option value="UPDATE_OWN_PROFILE">Modificación de perfil propio</option>
                    <option value="UPDATE_DOCENTE_DATA">Modificación de docente</option>
                    <option value="UPDATE_USER_DATA">Modificación de alumno</option>
                    <option value="UPDATE_ADMINISTRATIVO_DATA">Modificación de administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Desde</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Hasta</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ID de Usuario</label>
                  <Input
                    placeholder="ID específico..."
                    value={filters.userId}
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button onClick={handleApplyFilters} size="sm">
                  Aplicar Filtros
                </Button>
                <Button variant="outline" onClick={handleClearFilters} size="sm">
                  Limpiar
                </Button>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resumen</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Total de registros: {pagination.total} | Página {pagination.page} de {pagination.totalPages}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Auditorías */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario Afectado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Modificado Por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Cargando auditorías...
                        </div>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron registros de auditoría
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {getActionName(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {log.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {log.details?.updated_by ? (
                            <div className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                              {log.details.updated_by}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver Detalles
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-slate-700 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAuditLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm px-3 py-1 bg-white dark:bg-slate-800 rounded border">
                    {pagination.page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAuditLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Modal de Detalles */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalles de la Auditoría</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID del Registro</label>
                      <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">{selectedLog.id}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha y Hora</label>
                      <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acción</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                        {getActionName(selectedLog.action)}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuario Afectado</label>
                      <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">{selectedLog.user_id}</p>
                    </div>
                    
                    {selectedLog.details?.updated_by && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modificado Por</label>
                        <p className="text-sm bg-blue-100 dark:bg-blue-900 p-2 rounded font-mono">{selectedLog.details.updated_by}</p>
                      </div>
                    )}
                    
                    {selectedLog.details?.updated_fields && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campos Modificados</label>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                          {JSON.stringify(selectedLog.details.updated_fields, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Detalles Completos</label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}