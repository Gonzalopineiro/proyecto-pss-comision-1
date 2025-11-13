'use client'

import React, { useState } from 'react' // 1. Importar useState
import { AlumnoCompleto, FinalAprobadoRow, CursadaAprobadaRow } from './page'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle } from 'lucide-react' // 2. Importar el ícono de check
import { generateVerificationCode } from '@/lib/utils' 

interface Props {
    alumno: AlumnoCompleto
    finalesAprobados: FinalAprobadoRow[]
    cursadasAprobadas: CursadaAprobadaRow[]
}

export default function CertificadosCliente({ alumno, finalesAprobados, cursadasAprobadas }: Props) {
    // 3. Crear el estado para controlar la visibilidad del mensaje
    const [success, setSuccess] = useState(false)

    const generarCertificadoAnalitico = () => {
        const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        const codigoVerificacion = generateVerificationCode();

        // Mapear las cursadas aprobadas (sin cambios)
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

        // Mapear los finales aprobados (sin cambios)
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

        // Contenido del HTML (sin cambios)
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
                <div class="header"><h1>Historial Académico</h1><p>Universidad Nacional de Córdoba</p></div>
                <h2>Datos del Alumno</h2>
                <div class="info-grid">
                    <div class="info-item"><strong>Nombre Completo:</strong> ${alumno.nombre} ${alumno.apellido}</div>
                    <div class="info-item"><strong>DNI:</strong> ${alumno.dni || 'No especificado'}</div>
                    <div class="info-item"><strong>Legajo:</strong> ${alumno.legajo || 'No especificado'}</div>
                    <div class="info-item"><strong>Fecha de Nacimiento:</strong> ${alumno.nacimiento ? new Date(alumno.nacimiento).toLocaleDateString('es-AR') : 'No especificada'}</div>
                </div>
                <h2>Detalle de Materias</h2>
                <table><thead><tr><th>Código</th><th>Materia</th><th>Estado</th><th>Nota</th><th>Fecha</th></tr></thead><tbody>${cursadasRows}${finalesRows}</tbody></table>
                <div class="footer"><p>Certificado generado el ${fechaGeneracion}.</p><p class="verification-code">Código de Verificación: ${codigoVerificacion}</p></div>
            </body>
            </html>
        `;

        const ventana = window.open("", "_blank", "width=800,height=600");
        if (ventana) {
            ventana.document.write(contenido);
            ventana.document.close();
            setTimeout(() => ventana.print(), 500);
        }

        // 4. Actualizar el estado para mostrar el mensaje
        setSuccess(true);
    }
        
    const totalAprobadas = cursadasAprobadas.length + finalesAprobados.length;

    return (
        <>
            <Button 
                onClick={generarCertificadoAnalitico} 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={totalAprobadas === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                Generar Certificado
            </Button>
            
            {totalAprobadas === 0 && (
                 <p className="text-center text-sm text-amber-700 mt-4 p-3 bg-amber-50 rounded-md">
                    Aún no tienes cursadas ni finales aprobados para generar este certificado.
                </p>
            )}

            {/* 5. Renderizar el mensaje de éxito condicionalmente */}
            {success && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                    ¡Certificado generado exitosamente! Se abrió una nueva ventana para visualizar el documento.
                    </p>
                </div>
                </div>
            )}
        </>
    )
}