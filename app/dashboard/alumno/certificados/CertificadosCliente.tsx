'use client'

import React, { useState } from 'react'
import { AlumnoCompleto, FinalAprobadoRow, CursadaAprobadaRow } from './page'
import { Button } from '@/components/ui/button'
import { Plus, Download, Printer, AlertCircle } from 'lucide-react'
import { generateVerificationCode } from '@/lib/utils' 

interface Props {
    alumno: AlumnoCompleto
    finalesAprobados: FinalAprobadoRow[]
    cursadasAprobadas: CursadaAprobadaRow[]
}

export default function CertificadosCliente({ alumno, finalesAprobados, cursadasAprobadas }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [certificadoGenerado, setCertificadoGenerado] = useState<string | null>(null)

    // Generar HTML del certificado
    const generarHTML = (): string => {
        const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        const codigoVerificacion = generateVerificationCode();

        // Mapear las cursadas aprobadas
        const cursadasRows = cursadasAprobadas.map(cursada => {
            const materia = cursada.cursadas?.materia_docente?.materias;
            return `
                <tr>
                    <td>${materia?.codigo_materia || '—'}</td>
                    <td>${materia?.nombre || '—'}</td>
                    <td><span class="status cursada">Cursada</span></td>
                    <td>—</td>
                    <td>—</td>
                </tr>
            `;
        }).join('');

        // Mapear los finales aprobados
        const finalesRows = finalesAprobados.map(calif => {
            return `
                <tr>
                    <td>${calif.mesas_examen.materias.codigo_materia || '—'}</td>
                    <td>${calif.mesas_examen.materias.nombre || '—'}</td>
                    <td><span class="status aprobada">Aprobada</span></td>
                    <td><strong>${calif.nota}</strong></td>
                    <td>${calif.mesas_examen.fecha_examen ? new Date(calif.mesas_examen.fecha_examen).toLocaleDateString('es-AR') : '—'}</td>
                </tr>
            `;
        }).join('');

        return `
            <html>
            <head>
                <title>Certificado Analítico - ${alumno.apellido}, ${alumno.nombre}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                        line-height: 1.6; 
                        padding: 2rem; 
                        color: #333; 
                        max-width: 100%;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 1rem; 
                        margin-bottom: 2rem; 
                    }
                    h1 { 
                        margin: 0; 
                        font-size: 1.5rem; 
                    }
                    h2 { 
                        border-bottom: 1px solid #ccc; 
                        padding-bottom: 0.5rem; 
                        margin-top: 2rem; 
                        margin-bottom: 1rem; 
                        font-size: 1.2rem; 
                    }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 1rem; 
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
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 1rem; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 0.75rem; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: 600;
                    }
                    .status { 
                        padding: 4px 8px; 
                        border-radius: 12px; 
                        font-size: 0.8rem; 
                        font-weight: 600; 
                        color: #fff; 
                        display: inline-block;
                    }
                    .status.aprobada { 
                        background-color: #28a745; 
                    }
                    .status.cursada { 
                        background-color: #007bff; 
                    }
                    .codigo-verificacion {
                        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                        border: 2px solid #f59e0b;
                        padding: 1.5rem;
                        border-radius: 8px;
                        text-align: center;
                        margin: 2rem 0 1rem 0;
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
                        margin-bottom: 0; 
                        padding-top: 1rem; 
                        padding-bottom: 0; 
                        border-top: 1px solid #ccc; 
                        text-align: center; 
                        font-size: 0.75rem; 
                        color: #666; 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="font-size: 1.1rem; font-weight: bold; color: #1e40af;">Universidad Nacional de Córdoba</div>
                    <h1>CERTIFICADO ANALÍTICO</h1>
                </div>

                <h2>Datos del Estudiante</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Nombre completo</strong>
                        ${alumno.nombre} ${alumno.apellido}
                    </div>
                    <div class="info-item">
                        <strong>DNI</strong>
                        ${alumno.dni || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Legajo</strong>
                        ${alumno.legajo || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Fecha de nacimiento</strong>
                        ${alumno.nacimiento ? new Date(alumno.nacimiento).toLocaleDateString('es-AR') : 'No especificada'}
                    </div>
                </div>

                <h2>Detalle de Materias</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Materia</th>
                            <th>Estado</th>
                            <th>Nota</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cursadasRows}
                        ${finalesRows}
                    </tbody>
                </table>

                <div class="codigo-verificacion">
                    <strong>CÓDIGO DE VERIFICACIÓN</strong>
                    <div class="codigo">${codigoVerificacion}</div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #92400e;">
                        Este código permite verificar la autenticidad del documento
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Universidad Nacional de Córdoba</strong></p>
                    <p>Documento generado automáticamente - ${fechaGeneracion}</p>
                    <p>Código de verificación: ${codigoVerificacion}</p>
                </div>
            </body>
            </html>
        `;
    }

    const handleGenerar = () => {
        setError(null)

        const totalAprobadas = cursadasAprobadas.length + finalesAprobados.length
        if (totalAprobadas === 0) {
            setError('No tienes cursadas ni finales aprobados para generar este certificado')
            return
        }

        const html = generarHTML()
        setCertificadoGenerado(html)
    }

    const handleDescargar = () => {
        if (!certificadoGenerado) {
            setError('Primero debes generar el certificado')
            return
        }
        
        try {
            setError(null)
            
            // Crear iframe oculto para generar el PDF
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

                // Cargar html2pdf.js y generar PDF
                const script = iframeDoc.createElement('script')
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
                script.onload = () => {
                    // Esperar a que se cargue el script
                    setTimeout(() => {
                        const fecha = new Date().toISOString().split('T')[0]
                        const nombreArchivo = `Certificado_Analitico_${alumno.legajo}_${fecha}.pdf`

                        const opciones = {
                            margin: 0.5,
                            filename: nombreArchivo,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { 
                                scale: 2,
                                useCORS: true,
                                letterRendering: true
                            },
                            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
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

    const totalAprobadas = cursadasAprobadas.length + finalesAprobados.length

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Button 
                    onClick={handleGenerar}
                    size="sm"
                    variant="default"
                    disabled={totalAprobadas === 0}
                >
                    <Plus className="h-4 w-4 mr-2" />
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
            
            {totalAprobadas === 0 && (
                <p className="text-center text-sm text-amber-700 p-3 bg-amber-50 rounded-md">
                    Aún no tienes cursadas ni finales aprobados para generar este certificado.
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