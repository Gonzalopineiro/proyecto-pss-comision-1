import Sidebar from '@/components/dashboard/sidebar';
import CrearMesaForm from './crearMesaForm';

export default async function CrearMesaPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              <ol className="flex items-center space-x-2">
                <li>
                  <a href="/dashboard/alumno" className="hover:text-slate-900 dark:hover:text-white">
                    Inicio
                  </a>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <a href="/dashboard/alumno/mesas-examen" className="hover:text-slate-900 dark:hover:text-white">
                    Mesas de Examen
                  </a>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-900 dark:text-white font-medium">Crear Mesa de Examen (Vista Temporal)</span>
                </li>
              </ol>
            </nav>

            {/* Formulario */}
            <CrearMesaForm />
          </div>
        </main>
      </div>
    </div>
  );
}