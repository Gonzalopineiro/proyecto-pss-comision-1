import SidebarAlumno from "@/components/ui/sidebar_alumno";
import { obtenerMesasDisponibles, MesaDisponible } from "./actions";
import MesasTable from "./MesasTable";

export default async function InscripcionExamenesPage() {
  const mesas: MesaDisponible[] = await obtenerMesasDisponibles();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <aside className="w-64">
          <SidebarAlumno />
        </aside>
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Inscripción a Exámenes
            </h1>
            <p className="text-muted-foreground mb-6">
              Selecciona los exámenes a los que deseas inscribirte para el
              período lectivo actual
            </p>

            <MesasTable mesas={mesas} />
          </div>
        </main>
      </div>
    </div>
  );
}