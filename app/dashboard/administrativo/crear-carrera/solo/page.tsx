import CrearCarreraForm from '../crearCarreraForm';

export default async function CrearCarreraSolaPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <CrearCarreraForm />
          </div>
        </main>
      </div>
    </div>
  );
}