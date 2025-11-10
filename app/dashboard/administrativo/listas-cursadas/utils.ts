// Funciones auxiliares para exportar listas de alumnos
import { jsPDF } from 'jspdf';

export function exportarAPDF(
  alumnos: any[],
  cursadaInfo: any,
  adminInfo: any
) {
  // Crear nuevo documento PDF
  const doc = new jsPDF();
  
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Configurar fuente
  doc.setFont('helvetica');
  
  // Título principal
  doc.setFontSize(16);
  doc.text('LISTA DE ALUMNOS INSCRIPTOS', 105, 20, { align: 'center' });
  
  // Información de la materia
  doc.setFontSize(12);
  doc.text(`Materia: ${cursadaInfo.materia_codigo} - ${cursadaInfo.materia_nombre}`, 20, 40);
  doc.text(`Comisión: ${cursadaInfo.comision}`, 20, 50);
  doc.text(`Cuatrimestre: ${cursadaInfo.cuatrimestre}`, 20, 60);
  doc.text(`Total de inscriptos: ${alumnos.length}`, 20, 70);
  
  // Información del administrador
  doc.text(`Generado por: ${adminInfo.nombre} ${adminInfo.apellido}`, 20, 85);
  doc.text(`Email: ${adminInfo.email}`, 20, 95);
  doc.text(`Fecha de generación: ${fecha}`, 20, 105);
  
  // Línea separadora
  doc.line(20, 115, 190, 115);
  
  // Encabezados de la tabla
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Legajo', 25, 130);
  doc.text('Apellido y Nombre', 60, 130);
  doc.text('Email', 120, 130);
  doc.text('Estado', 170, 130);
  
  // Línea bajo encabezados
  doc.line(20, 135, 190, 135);
  
  // Datos de alumnos
  doc.setFont('helvetica', 'normal');
  let yPosition = 145;
  
  alumnos.forEach((alumno, index) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
      
      // Repetir encabezados en nueva página
      doc.setFont('helvetica', 'bold');
      doc.text('Legajo', 25, yPosition);
      doc.text('Apellido y Nombre', 60, yPosition);
      doc.text('Email', 120, yPosition);
      doc.text('Estado', 170, yPosition);
      doc.line(20, yPosition + 5, 190, yPosition + 5);
      yPosition += 15;
      doc.setFont('helvetica', 'normal');
    }
    
    // Datos del alumno
    doc.text(alumno.legajo.toString(), 25, yPosition);
    doc.text(`${alumno.apellido}, ${alumno.nombre}`, 60, yPosition);
    doc.text(alumno.email, 120, yPosition);
    
    const estado = alumno.estado === 'aprobada' ? 'Aprobada' :
                  alumno.estado === 'regular' ? 'Regular' : 'Sin calificar';
    doc.text(estado, 170, yPosition);
    
    yPosition += 10;
  });
  
  // Pie de página en la última página
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setFontSize(8);
  doc.text(`Documento generado el ${fecha}`, 20, 285);
  doc.text(`Sistema de Gestión Académica - ${adminInfo.nombre} ${adminInfo.apellido}`, 20, 292);
  
  // Descargar el PDF
  const nombreArchivo = `lista_inscriptos_${cursadaInfo.materia_codigo}_${cursadaInfo.cuatrimestre}.pdf`;
  doc.save(nombreArchivo);
}

export function exportarAExcel(
  alumnos: any[],
  cursadaInfo: any,
  adminInfo: any
) {
  const fecha = new Date().toLocaleDateString('es-ES');
  
  // Crear contenido CSV
  const csvContent = [
    // Encabezado con información
    [`Lista de Alumnos Inscriptos a Cursada`],
    [`Materia: ${cursadaInfo.materia_codigo} - ${cursadaInfo.materia_nombre}`],
    [`Comisión: ${cursadaInfo.comision}`],
    [`Cuatrimestre: ${cursadaInfo.cuatrimestre}`],
    [`Generado por: ${adminInfo.nombre} ${adminInfo.apellido}`],
    [`Fecha de generación: ${fecha}`],
    [`Total de alumnos: ${alumnos.length}`],
    [], // Línea vacía
    
    // Encabezados de columnas
    ['Legajo', 'Apellido', 'Nombre', 'Email', 'Estado de Inscripción'],
    
    // Datos de alumnos
    ...alumnos.map(alumno => [
      alumno.legajo,
      alumno.apellido,
      alumno.nombre,
      alumno.email,
      alumno.estado === 'aprobada' ? 'Aprobada' :
      alumno.estado === 'regular' ? 'Regular' : 'Sin calificar'
    ])
  ].map(row => row.join(',')).join('\n');

  // Crear y descargar archivo Excel (.xlsx simulado con CSV)
  const nombreArchivo = `lista_inscriptos_${cursadaInfo.materia_codigo}_${cursadaInfo.cuatrimestre}.xlsx`;
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}