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

    // Abrir ventana para mostrar/descargar
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (ventana) {
      ventana.document.write(contenidoHTML)
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