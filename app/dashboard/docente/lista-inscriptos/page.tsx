import { ArrowLeft } from 'lucide-react';
import ListaInscriptosForm from './ListaInscriptosForm';

export default function ListaInscriptosPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            {/* Botón de volver */}
            <div className="mb-6">
              <a 
                href="/dashboard/docente"
                className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel Docente
              </a>
            </div>

            {/* Encabezado */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Lista de Inscriptos por Cursada
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Genere y exporte listas de alumnos inscriptos por materia, carrera y período académico
              </p>
            </div>

            {/* Formulario */}
            <ListaInscriptosForm userRole="docente" />
          </div>
        </main>
      </div>
    </div>
  );
}