'use client'

import React from 'react'
import { AlumnoCompleto, FinalAprobadoRow, CursadaAprobadaRow } from './page'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, FileText } from 'lucide-react'
import { generateVerificationCode } from '@/lib/utils' 

interface Props {
    alumno: AlumnoCompleto
    finalesAprobados: FinalAprobadoRow[]
    cursadasAprobadas: CursadaAprobadaRow[]
}

export default function CertificadosCliente({ alumno, finalesAprobados, cursadasAprobadas }: Props) {

    const generarCertificadoAnalitico = () => {
        const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        const codigoVerificacion = generateVerificationCode();

        // Mapear las cursadas aprobadas al formato de fila
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

        // Mapear los finales aprobados al formato de fila
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


        const contenido = `
            <html>
            <head>
                <title>Historial Académico - ${alumno.apellido}, ${alumno.nombre}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 2rem; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem; }
                    h1 { margin: 0; font-size: 1.5rem; }
                    h2 { border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-top: 2.5rem; font-size: 1.2rem; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                    .info-item { background-color: #f9f9f9; padding: 0.75rem; border: 1px solid #eee; border-radius: 6px; }
                    .info-item strong { display: block; font-size: 0.8rem; color: #555; margin-bottom: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .footer { text-align: right; margin-top: 3rem; font-style: italic; color: #777; font-size: 0.9rem; }
                    .verification-code { font-style: normal; font-weight: bold; color: #333; margin-top: 1rem; }
                    .status { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; color: #fff; }
                    .status.aprobada { background-color: #28a745; }
                    .status.cursada { background-color: #007bff; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Historial Académico</h1>
                    <p>Universidad de la Innovación</p>
                </div>

                <h2>Datos del Alumno</h2>
                <div class="info-grid">
                    <div class="info-item"><strong>Nombre Completo:</strong> ${alumno.nombre} ${alumno.apellido}</div>
                    <div class="info-item"><strong>DNI:</strong> ${alumno.dni || 'No especificado'}</div>
                    <div class="info-item"><strong>Legajo:</strong> ${alumno.legajo || 'No especificado'}</div>
                    <div class="info-item"><strong>Fecha de Nacimiento:</strong> ${alumno.nacimiento ? new Date(alumno.nacimiento).toLocaleDateString('es-AR') : 'No especificada'}</div>
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

                <div class="footer">
                    <p>Certificado generado el ${fechaGeneracion}.</p>                    
                    <!-- 3. AÑADIMOS EL CÓDIGO AL FOOTER -->
                    <p class="verification-code">Código de Verificación: ${codigoVerificacion}</p>
                </div>
            </body>
            </html>
        `;

        const ventana = window.open("", "_blank", "width=800,height=600");
        if (ventana) {
            ventana.document.write(contenido);
            ventana.document.close();
            setTimeout(() => ventana.print(), 500);
        }
    }
        
    const totalAprobadas = cursadasAprobadas.length + finalesAprobados.length;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Generación de Certificados</h1>
                <p className="text-muted-foreground mt-2">
                    Aquí puedes generar y descargar certificados oficiales de tu progreso académico.
                </p>
            </div>

            <Card className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                        <FileText className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold">Certificado de Estado Académico</h2>
                        <p className="text-muted-foreground mt-1">
                            Este documento oficial lista todas las cursadas y finales que has aprobado hasta la fecha.
                            Actualmente tienes <strong>{cursadasAprobadas.length} cursadas</strong> y <strong>{finalesAprobados.length} finales</strong> aprobados.
                        </p>
                    </div>
                    <Button 
                        onClick={generarCertificadoAnalitico} 
                        className="w-full md:w-auto"
                        disabled={totalAprobadas === 0}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Generar e Imprimir
                    </Button>
                </div>
                {totalAprobadas === 0 && (
                     <p className="text-center text-sm text-amber-700 mt-4 p-3 bg-amber-50 rounded-md">
                        Aún no tienes cursadas ni finales aprobados para generar este certificado.
                    </p>
                )}
            </Card>
        </div>
    )
}