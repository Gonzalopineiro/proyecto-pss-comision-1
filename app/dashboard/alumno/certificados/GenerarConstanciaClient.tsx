'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { verificarElegibilidadConstancia, type ConstanciaData } from './actions'

export default function GenerarConstanciaClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const generarConstancia = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Verificar elegibilidad
      const result = await verificarElegibilidadConstancia()
      
      if (!result.success) {
        setError(result.error || 'Error desconocido')
        return
      }

      if (!result.data) {
        setError('No se pudieron obtener los datos necesarios')
        return
      }

      // Generar PDF
      generarPDF(result.data)
      setSuccess(true)

    } catch (error: any) {
      console.error('Error generando constancia:', error)
      setError('Error interno al generar la constancia')
    } finally {
      setLoading(false)
    }
  }

  const generarPDF = (data: ConstanciaData) => {
    const fechaGeneracion = new Date(data.fecha_generacion).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Constancia de Alumno Regular</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #1e40af; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .universidad { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 5px; 
          }
          .titulo { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 20px 0; 
            color: #1e40af; 
          }
          .contenido { 
            margin: 30px 0; 
          }
          .datos-alumno { 
            background-color: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .datos-row { 
            display: flex; 
            margin-bottom: 10px; 
          }
          .datos-label { 
            font-weight: bold; 
            width: 150px; 
            color: #374151; 
          }
          .datos-value { 
            color: #111827; 
          }

          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 12px; 
            color: #6b7280; 
          }
          .codigo-verificacion { 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .codigo-verificacion .label { 
            font-weight: bold; 
            color: #92400e; 
            font-size: 14px; 
          }
          .codigo-verificacion .codigo { 
            font-size: 18px; 
            font-weight: bold; 
            color: #92400e; 
            font-family: 'Courier New', monospace; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="universidad">${data.alumno.carrera.universidad}</div>
          <div class="titulo">CONSTANCIA DE ALUMNO REGULAR</div>
        </div>

        <div class="contenido">
          <p style="text-align: justify; margin-bottom: 20px;">
            La presente constancia certifica que <strong>${data.alumno.nombre} ${data.alumno.apellido}</strong>, 
            portador/a del DNI N° <strong>${data.alumno.dni}</strong>, con Legajo N° <strong>${data.alumno.legajo}</strong>, 
            reviste la condición de <strong>ALUMNO/A REGULAR</strong> de la carrera 
            <strong>${data.alumno.carrera.nombre}</strong> en esta institución.
          </p>

          <div class="datos-alumno">
            <h3 style="margin-top: 0; color: #374151;">Datos del Estudiante</h3>
            <div class="datos-row">
              <span class="datos-label">Nombre completo:</span>
              <span class="datos-value">${data.alumno.nombre} ${data.alumno.apellido}</span>
            </div>
            <div class="datos-row">
              <span class="datos-label">DNI:</span>
              <span class="datos-value">${data.alumno.dni}</span>
            </div>
            <div class="datos-row">
              <span class="datos-label">Legajo:</span>
              <span class="datos-value">${data.alumno.legajo}</span>
            </div>
            <div class="datos-row">
              <span class="datos-label">Email:</span>
              <span class="datos-value">${data.alumno.email}</span>
            </div>
            <div class="datos-row">
              <span class="datos-label">Carrera:</span>
              <span class="datos-value">${data.alumno.carrera.nombre}</span>
            </div>
          </div>



          <div class="codigo-verificacion">
            <div class="label">CÓDIGO DE VERIFICACIÓN</div>
            <div class="codigo">${data.codigo_verificacion}</div>
            <div style="margin-top: 8px; font-size: 12px; color: #92400e;">
              Este código permite verificar la autenticidad del documento
            </div>
          </div>

          <p style="text-align: justify; margin-top: 30px; font-size: 14px;">
            Se extiende la presente constancia a pedido del interesado/a para ser presentada 
            ante las autoridades que la requieran, en la ciudad de Córdoba, 
            el día <strong>${fechaGeneracion}</strong>.
          </p>
        </div>

        <div class="footer">
          <p><strong>${data.alumno.carrera.universidad}</strong></p>
          <p>Documento generado automáticamente el ${fechaGeneracion}</p>
          <p>Para verificar la autenticidad de este documento utilice el código: ${data.codigo_verificacion}</p>
        </div>
      </body>
      </html>
    `

    // Solo abrir ventana para mostrar la constancia (SIN descarga automática)
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = `Constancia_Alumno_Regular_${data.alumno.legajo}_${fecha}`
    
    // Agregar barra de herramientas estilo navegador
    const contenidoConBarra = contenidoHTML.replace(
      '<body>',
      `<body>
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          height: 48px; 
          background: #f8f9fa; 
          border-bottom: 1px solid #e5e7eb; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 0 16px; 
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368;">
            <span>📄</span>
            <span>${nombreArchivo}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button onclick="descargarPDF()" style="
              background: none; 
              border: none; 
              cursor: pointer; 
              padding: 8px; 
              border-radius: 4px; 
              color: #5f6368;
              font-size: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
            " title="Descargar">
              ⬇️
            </button>
            <button onclick="imprimirCertificado()" style="
              background: none; 
              border: none; 
              cursor: pointer; 
              padding: 8px; 
              border-radius: 4px; 
              color: #5f6368;
              font-size: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
            " title="Imprimir">
              🖨️
            </button>
          </div>
        </div>
        <div style="margin-top: 48px;">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          function descargarPDF() {
            // Ocultar la barra de herramientas para el PDF
            const barra = document.querySelector('div[style*="position: fixed"]');
            const contenido = document.querySelector('div[style*="margin-top: 48px"]');
            
            if (barra) barra.style.display = 'none';
            if (contenido) contenido.style.marginTop = '0';
            
            // Configuración para html2pdf
            const opciones = {
              margin: 0.5,
              filename: '${nombreArchivo}.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true
              },
              jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait' 
              }
            };
            
            // Generar y descargar PDF
            html2pdf()
              .set(opciones)
              .from(contenido || document.body)
              .save()
              .then(() => {
                // Restaurar la barra después de generar el PDF
                if (barra) barra.style.display = 'flex';
                if (contenido) contenido.style.marginTop = '48px';
              });
          }

          function imprimirCertificado() {
            // Ocultar la barra de herramientas para la impresión
            const barra = document.querySelector('div[style*="position: fixed"]');
            const contenido = document.querySelector('div[style*="margin-top: 48px"]');
            
            if (barra) barra.style.display = 'none';
            if (contenido) contenido.style.marginTop = '0';
            
            // Abrir diálogo de impresión
            setTimeout(() => {
              window.print();
              
              // Restaurar la barra después de cerrar el diálogo de impresión
              setTimeout(() => {
                if (barra) barra.style.display = 'flex';
                if (contenido) contenido.style.marginTop = '48px';
              }, 1000);
            }, 100);
          }
        </script>`
    ).replace('</body>', '</div></body>')
    
    // Abrir ventana solo para mostrar (sin automatizar nada)
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (ventana) {
      ventana.document.write(contenidoConBarra)
      ventana.document.title = nombreArchivo
      ventana.document.close()
    }
  }

  return (
    <div>
      <Button 
        onClick={generarConstancia}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verificando elegibilidad...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Generar Constancia
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">
              ¡Constancia generada exitosamente! Se abrió una nueva ventana para descargar el documento.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}