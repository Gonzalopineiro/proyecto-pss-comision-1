'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Printer, AlertCircle } from 'lucide-react'
import { verificarElegibilidadConstancia, type ConstanciaData } from './actions'
import { generateVerificationCode } from '@/lib/utils'

interface Props {
  tieneCursadasActivas: boolean
}

export default function GenerarConstanciaClient({ tieneCursadasActivas }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [certificadoGenerado, setCertificadoGenerado] = useState<string | null>(null)
  const [constanciaData, setConstanciaData] = useState<ConstanciaData | null>(null)

  // Generar HTML del certificado
  const generarHTML = (data: ConstanciaData): string => {
    const fechaGeneracion = new Date(data.fecha_generacion).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const codigoVerificacion = generateVerificationCode()

    return `
      <html>
      <head>
        <title>Constancia de Alumno Regular - ${data.alumno.apellido}, ${data.alumno.nombre}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.5; 
            padding: 1.5rem; 
            color: #333; 
            max-width: 100%;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 0.75rem; 
            margin-bottom: 1.5rem; 
          }
          h1 { 
            margin: 0; 
            font-size: 1.5rem; 
          }
          h2 { 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 0.5rem; 
            margin-top: 1.5rem; 
            font-size: 1.1rem; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 0.75rem; 
            margin-bottom: 1.5rem; 
          }
          .info-item { 
            background-color: #f9f9f9; 
            padding: 0.75rem; 
            border: 1px solid #eee; 
            border-radius: 6px; 
          }
          .info-item strong { 
            display: block; 
            font-size: 0.8rem; 
            color: #555; 
            margin-bottom: 4px; 
          }
          .codigo-verificacion {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 1.5rem 0;
          }
          .codigo-verificacion strong {
            display: block;
            font-size: 0.9rem;
            color: #92400e;
            margin-bottom: 0.5rem;
          }
          .codigo-verificacion .codigo {
            font-size: 1.8rem;
            font-weight: bold;
            color: #78350f;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
          .footer { 
            margin-top: 1.5rem; 
            padding-top: 0.75rem; 
            border-top: 1px solid #ccc; 
            text-align: center; 
            font-size: 0.75rem; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 1.1rem; font-weight: bold; color: #1e40af;">${data.alumno.carrera.universidad}</div>
          <h1>CONSTANCIA DE ALUMNO REGULAR</h1>
        </div>

        <p style="text-align: justify; margin-bottom: 2rem; line-height: 1.8;">
          La presente constancia certifica que <strong>${data.alumno.nombre} ${data.alumno.apellido}</strong>, 
          portador/a del DNI N° <strong>${data.alumno.dni}</strong>, con Legajo N° <strong>${data.alumno.legajo}</strong>, 
          reviste la condición de <strong>ALUMNO/A REGULAR</strong> de la carrera 
          <strong>${data.alumno.carrera.nombre}</strong> en esta institución.
        </p>

        <h2>Datos del Estudiante</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre completo</strong>
            ${data.alumno.nombre} ${data.alumno.apellido}
          </div>
          <div class="info-item">
            <strong>DNI</strong>
            ${data.alumno.dni}
          </div>
          <div class="info-item">
            <strong>Legajo</strong>
            ${data.alumno.legajo}
          </div>
          <div class="info-item">
            <strong>Email</strong>
            ${data.alumno.email}
          </div>
          <div class="info-item" style="grid-column: 1 / -1;">
            <strong>Carrera</strong>
            ${data.alumno.carrera.nombre}
          </div>
        </div>

        <div class="codigo-verificacion">
          <strong>CÓDIGO DE VERIFICACIÓN</strong>
          <div class="codigo">${codigoVerificacion}</div>
          <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #92400e;">
            Este código permite verificar la autenticidad del documento
          </div>
        </div>

        <p style="text-align: justify; margin-top: 2rem; font-size: 0.9rem; line-height: 1.6;">
          Se extiende la presente constancia a pedido del interesado/a para ser presentada 
          ante las autoridades que la requieran, en la ciudad de Córdoba, 
          el día <strong>${fechaGeneracion}</strong>.
        </p>

        <div class="footer">
          <p><strong>${data.alumno.carrera.universidad}</strong></p>
          <p>Documento generado automáticamente - ${fechaGeneracion}</p>
          <p>Código de verificación: ${codigoVerificacion}</p>
        </div>
      </body>
      </html>
    `
  }

  const handleGenerar = async () => {
    setError(null)

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

      // Generar HTML y guardar en memoria
      const html = generarHTML(result.data)
      setCertificadoGenerado(html)
      setConstanciaData(result.data)

    } catch (error: any) {
      console.error('Error generando constancia:', error)
      setError('Error interno al generar la constancia')
    }
  }

  const handleDescargar = () => {
    if (!certificadoGenerado || !constanciaData) {
      setError('Primero debes generar el certificado')
      return
    }

    // Crear iframe oculto para generar el PDF
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(certificadoGenerado)
    iframeDoc.close()

    // Cargar html2pdf.js y generar PDF
    const script = iframeDoc.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => {
      const fecha = new Date().toISOString().split('T')[0]
      const nombreArchivo = `Constancia_Alumno_Regular_${constanciaData.alumno.legajo}_${fecha}.pdf`

      const opciones = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      ;(iframe.contentWindow as any).html2pdf()
        .set(opciones)
        .from(iframeDoc.body)
        .save()
    }
    iframeDoc.head.appendChild(script)

    // Limpiar iframe después de un segundo
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }

  const handleImprimir = () => {
    if (!certificadoGenerado) {
      setError('Primero debes generar el certificado')
      return
    }

    const ventana = window.open('', '_blank', 'width=1200,height=900,left=0,top=0')
    if (!ventana) {
      setError('No se pudo abrir la ventana de impresión. Verifica los permisos del navegador.')
      return
    }
    
    // Maximizar la ventana
    ventana.moveTo(0, 0)
    ventana.resizeTo(screen.availWidth, screen.availHeight)

    ventana.document.write(certificadoGenerado)
    ventana.document.close()

    // Esperar a que cargue el contenido
    ventana.onload = () => {
      ventana.focus()
      ventana.print()
    }

    // Auto-cerrar la ventana después de imprimir o cancelar
    ventana.onafterprint = () => {
      ventana.close()
    }

    // Fallback para navegadores que no soportan onafterprint
    ventana.addEventListener('afterprint', () => {
      ventana.close()
    })

    // Fallback adicional por si no se disparan los eventos
    setTimeout(() => {
      if (ventana && !ventana.closed) {
        ventana.close()
      }
    }, 1000)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button 
          onClick={handleGenerar}
          size="sm"
          variant="default"
          disabled={!tieneCursadasActivas}
        >
          <Plus className="w-4 h-4 mr-2" />
          Generar
        </Button>

        <Button 
          onClick={handleDescargar}
          size="sm"
          variant="outline"
          disabled={!certificadoGenerado}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar
        </Button>

        <Button 
          onClick={handleImprimir}
          size="sm"
          variant="outline"
          disabled={!certificadoGenerado}
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>
      
      {!tieneCursadasActivas && (
        <p className="text-center text-sm text-amber-700 p-3 bg-amber-50 rounded-md">
          Aún no tienes cursadas activas para generar este certificado.
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {certificadoGenerado && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5">✓</div>
            <p className="text-sm text-green-800 dark:text-green-200">
              Certificado generado. Puedes descargarlo o imprimirlo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}