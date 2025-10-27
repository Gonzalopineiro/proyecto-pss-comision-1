"use client";

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// Definición de tipos
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface Filter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface GrillaProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: Filter[];
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  itemsPerPage?: number; // Nuevo: configurable
}

export function Grilla<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  filters = [],
  onRowClick,
  actions,
  emptyMessage = 'No hay datos disponibles',
  isLoading = false,
  itemsPerPage = 40 // Default: 40 items por página
}: GrillaProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    const filtered = data.filter(item => {
      // Filtro de búsqueda
      if (searchTerm && searchKeys.length > 0) {
        const matchesSearch = searchKeys.some(key => 
          String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matchesSearch) return false;
      }

      // Filtros adicionales
      return filters.every(filter => {
        const filterValue = activeFilters[filter.key];
        if (!filterValue) return true;
        return item[filter.key] === filterValue;
      });
    });
    
    // Reset a la primera página cuando cambian los filtros
    setCurrentPage(1);
    return filtered;
  }, [data, searchTerm, activeFilters, searchKeys, filters]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {(title || subtitle) && (
            <div>
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 space-y-4">
          {/* Búsqueda y botón de filtros */}
          <div className="flex gap-3">
            {/* Búsqueda */}
            {searchKeys.length > 0 && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Botón de filtros */}
            {filters.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
                  showFilters || Object.keys(activeFilters).some(k => activeFilters[k])
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
                {Object.keys(activeFilters).some(k => activeFilters[k]) && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                    {Object.keys(activeFilters).filter(k => activeFilters[k]).length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Panel de filtros (colapsable) */}
          {filters.length > 0 && showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
              {filters.map(filter => (
                <select
                  key={filter.key}
                  title={filter.label}
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => setActiveFilters(prev => ({
                    ...prev,
                    [filter.key]: e.target.value
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ))}
              
              {Object.keys(activeFilters).some(k => activeFilters[k]) && (
                <button
                  onClick={() => setActiveFilters({})}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center p-12 text-gray-500 bg-gray-50">
              {emptyMessage}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick?.(row)}
                    className={`${
                      onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''
                    } transition-colors`}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          col.className || 'text-gray-900'
                        }`}
                      >
                        {typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : String(row[col.accessor])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer con paginación */}
        {!isLoading && filteredData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
              <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> de{' '}
              <span className="font-medium">{filteredData.length}</span> resultados
              {filteredData.length !== data.length && (
                <span className="text-gray-500"> (filtrados de {data.length} totales)</span>
              )}
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
