'use client'

import { generarContenidoPDF, generarContenidoCSV } from './actions'
import type { ExportData } from './actions'

/**
 * Exporta la lista a PDF
 */
export async function exportarAPDF(data: ExportData): Promise<void> {
  try {
    const htmlContent = await generarContenidoPDF(data)
    
    // Crear un blob y descargar
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista-inscriptos-${data.filtros.anio}-${data.filtros.cuatrimestre}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('PDF exportado (HTML)')
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    throw error
  }
}

/**
 * Exporta la lista a Excel (CSV)
 */
export async function exportarAExcel(data: ExportData): Promise<void> {
  try {
    const csvContent = await generarContenidoCSV(data)
    
    // Crear archivo y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista-inscriptos-${data.filtros.anio}-${data.filtros.cuatrimestre}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('Excel exportado (CSV)')
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    throw error
  }
}