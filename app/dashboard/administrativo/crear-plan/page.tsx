import Sidebar from '@/components/dashboard/sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CrearPlanForm from './crearPlanForm';
import { Users, User, Book, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';


export default async function CrearPlanPage() {

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <Suspense fallback={<div>Cargando...</div>}>
              <CrearPlanForm />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}