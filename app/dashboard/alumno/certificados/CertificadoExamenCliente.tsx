'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Printer, AlertCircle } from 'lucide-react'
import { generateVerificationCode } from '@/lib/utils'

export type ExamenAprobadoData = {
  id: number
  nota: number
  fecha_examen: string
  materia: {
    codigo_materia: string
    nombre: string
  }
  docente: {
    nombre: string
    apellido: string
    legajo: string
  }
}

export type AlumnoExamenData = {
  nombre: string
  apellido: string
  dni: number | null
  legajo: number | null
  email: string | null
  carrera: {
    nombre: string
  } | null
}

interface Props {
  alumno: AlumnoExamenData
  examenesAprobados: ExamenAprobadoData[]
}

export default function CertificadoExamenCliente({ alumno, examenesAprobados }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [selectedExamen, setSelectedExamen] = useState<ExamenAprobadoData | null>(null)
  const [certificadoGenerado, setCertificadoGenerado] = useState<string | null>(null)
  const [examenGenerado, setExamenGenerado] = useState<ExamenAprobadoData | null>(null)

  const convertirNotaALetras = (nota: number): string => {
    const notas: { [key: number]: string } = {
      10: 'DIEZ',
      9: 'NUEVE',
      8: 'OCHO',
      7: 'SIETE',
      6: 'SEIS',
      5: 'CINCO',
      4: 'CUATRO'
    }
    return notas[nota] || nota.toString()
  }

  // Generar HTML del certificado
  const generarHTML = (examen: ExamenAprobadoData): string => {
    const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const fechaExamen = new Date(examen.fecha_examen).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const codigoVerificacion = generateVerificationCode()

    return `
      <html>
      <head>
        <title>Certificado de Examen - ${alumno.apellido}, ${alumno.nombre}</title>
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
          .nota-destacada {
            text-align: center;
            background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
          }
          .nota-destacada .label {
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .nota-destacada .valor {
            font-size: 3.5rem;
            font-weight: bold;
          }
          .nota-destacada .texto {
            font-size: 1rem;
            margin-top: 0.5rem;
          }
          .footer { 
            text-align: right; 
            margin-top: 3rem; 
            font-style: italic; 
            color: #777; 
            font-size: 0.9rem; 
          }
          .verification-code { 
            font-style: normal; 
            font-weight: bold; 
            color: #333; 
            margin-top: 1rem; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Certificado de Examen Final</h1>
          <p>Universidad Nacional de Córdoba</p>
        </div>
        
        <h2>Datos del Estudiante</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre Completo:</strong> 
            ${alumno.nombre} ${alumno.apellido}
          </div>
          <div class="info-item">
            <strong>DNI:</strong> 
            ${alumno.dni || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Legajo:</strong> 
            ${alumno.legajo || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Carrera:</strong> 
            ${alumno.carrera?.nombre || 'No especificada'}
          </div>
        </div>
        
        <h2>Información del Examen</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Materia:</strong> 
            ${examen.materia.nombre}
          </div>
          <div class="info-item">
            <strong>Código:</strong> 
            ${examen.materia.codigo_materia}
          </div>
          <div class="info-item">
            <strong>Fecha de Examen:</strong> 
            ${fechaExamen}
          </div>
          <div class="info-item">
            <strong>Docente Evaluador:</strong> 
            ${examen.docente.nombre} ${examen.docente.apellido} (Leg. ${examen.docente.legajo})
          </div>
        </div>
        
        <div class="nota-destacada">
          <div class="label">CALIFICACIÓN OBTENIDA</div>
          <div class="valor">${examen.nota}</div>
          <div class="texto">(${convertirNotaALetras(examen.nota)})</div>
        </div>
        
        <div class="footer">
          <p>Certificado generado el ${fechaGeneracion}.</p>
          <p class="verification-code">Código de Verificación: ${codigoVerificacion}</p>
        </div>
      </body>
      </html>
    `
  }

  // Opción 2: Generar (guarda en memoria)
  const handleGenerar = (examen: ExamenAprobadoData) => {
    try {
      setError(null)
      const html = generarHTML(examen)
      setCertificadoGenerado(html)
      setExamenGenerado(examen)
    } catch (err) {
      setError('Error al generar el certificado')
    }
  }

  // Opción 2: Descargar (descarga el PDF generado)
  const handleDescargar = () => {
    if (!certificadoGenerado || !examenGenerado) {
      setError('Primero debes generar el certificado')
      return
    }
    
    try {
      setError(null)
      
      // Crear un iframe oculto para generar el PDF
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      
      const iframeDoc = iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(certificadoGenerado)
        iframeDoc.close()
        
        // Agregar script de html2pdf si no está cargado
        const script = iframeDoc.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        script.onload = () => {
          // Esperar a que se cargue el script
          setTimeout(() => {
            const nombreArchivo = `Certificado_Examen_${examenGenerado.materia.codigo_materia}_${alumno.legajo}_${new Date().toISOString().split('T')[0]}.pdf`
            
            const opciones = {
              margin: 0.5,
              filename: nombreArchivo,
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
            }
            
            // @ts-ignore - html2pdf está cargado dinámicamente
            if (iframe.contentWindow?.html2pdf) {
              // @ts-ignore
              iframe.contentWindow.html2pdf()
                .set(opciones)
                .from(iframeDoc.body)
                .save()
                .then(() => {
                  // Limpiar el iframe después de la descarga
                  setTimeout(() => document.body.removeChild(iframe), 1000)
                })
            }
          }, 500)
        }
        iframeDoc.head.appendChild(script)
      }
    } catch (err) {
      setError('Error al descargar el certificado')
    }
  }

  // Opción 2: Imprimir (imprime el certificado generado)
  const handleImprimir = () => {
    if (!certificadoGenerado) {
      setError('Primero debes generar el certificado')
      return
    }
    
    try {
      setError(null)
      const ventana = window.open("", "_blank", "width=1200,height=900,left=0,top=0")
      if (ventana) {
        // Maximizar la ventana
        ventana.moveTo(0, 0)
        ventana.resizeTo(screen.availWidth, screen.availHeight)
        
        ventana.document.write(certificadoGenerado)
        ventana.document.close()
        
        // Agregar event listeners para cerrar la ventana después de imprimir
        ventana.onafterprint = () => {
          ventana.close()
        }
        
        // Para navegadores que no soportan onafterprint
        ventana.addEventListener('afterprint', () => {
          ventana.close()
        })
        
        // Abrir diálogo de impresión
        setTimeout(() => {
          ventana.print()
          
          // Fallback: cerrar después de un tiempo si el usuario cancela
          // Detectar si el usuario canceló la impresión
          setTimeout(() => {
            if (!ventana.closed) {
              ventana.close()
            }
          }, 1000)
        }, 500)
      }
    } catch (err) {
      setError('Error al imprimir el certificado')
    }
  }

  if (examenesAprobados.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button size="sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Generar
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
        
        <p className="text-center text-sm text-amber-700 p-3 bg-amber-50 rounded-md">
          Aún no tienes exámenes aprobados para generar este certificado.
        </p>
      </div>
    )
  }

  // Si solo hay un examen, mostrar botones directamente
  if (examenesAprobados.length === 1) {
    const examen = examenesAprobados[0]
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleGenerar(examen)}>
            <Plus className="w-4 h-4 mr-2" />
            Generar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!certificadoGenerado || examenGenerado?.id !== examen.id}
            onClick={handleDescargar}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!certificadoGenerado || examenGenerado?.id !== examen.id}
            onClick={handleImprimir}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}
        
        {certificadoGenerado && examenGenerado?.id === examen.id && (
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

  // Si hay múltiples exámenes, mostrar selector primero
  return (
    <div className="space-y-3">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Selecciona el examen:
        </p>
        <div className="space-y-2">
          {examenesAprobados.map((examen) => (
            <div
              key={examen.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedExamen?.id === examen.id
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
              onClick={() => setSelectedExamen(examen)}
            >
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {examen.materia.nombre}
              </p>
              <div className="flex gap-4 mt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Nota: <span className="font-semibold text-purple-600 dark:text-purple-400">{examen.nota}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(examen.fecha_examen).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          disabled={!selectedExamen}
          onClick={() => selectedExamen && handleGenerar(selectedExamen)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Generar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!certificadoGenerado || examenGenerado?.id !== selectedExamen?.id}
          onClick={handleDescargar}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!certificadoGenerado || examenGenerado?.id !== selectedExamen?.id}
          onClick={handleImprimir}
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {certificadoGenerado && examenGenerado?.id === selectedExamen?.id && (
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
