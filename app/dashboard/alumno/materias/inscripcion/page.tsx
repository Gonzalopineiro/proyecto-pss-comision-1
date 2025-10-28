import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { inscribirseEnCursada } from "./actions";

type Cursada = {
  id: number;
  cupo_maximo: number | null;
  horarios: {
    horarios: Array<{
      dia: string;
      hora_inicio: string;
      hora_fin: string;
      aula: string;
    }>;
  } | null;
  materia_docente: {
    materia: {
      nombre: string;
      codigo_materia: string;
    };
    docente: {
      nombre: string;
      apellido: string;
    };
  };
};

export default async function InscripcionCursadasPage() {
  const supabase = await createClient();

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <p>No hay sesión activa</p>;
  }

  // Obtener cursadas activas
  const { data: cursadasData } = await supabase
    .from("cursadas")
    .select(
      `
      id,
      cupo_maximo,
      horarios,
      materia_docente_id,
      materia_docente:materia_docente_id(
        materia:materia_id(
          nombre,
          codigo_materia
        ),
        docente:docente_id(
          nombre,
          apellido
        )
      )
    `
    )
    .eq("estado", "activa")
    .order("created_at");

  // Obtener inscripciones del usuario
  const { data: inscripcionesData } = await supabase
    .from("inscripciones_cursada")
    .select("cursada_id")
    .eq("alumno_id", user.id);

  const cursadasInscripto = new Set(
    (inscripcionesData || []).map((i) => i.cursada_id)
  );

  const cursadas = (cursadasData || [])
    .map((cursada: any) => {
      if (!cursada?.materia_docente) return null;

      const { materia, docente } = cursada.materia_docente;

      return {
        id: cursada.id,
        cupo_maximo: cursada.cupo_maximo,
        horarios: cursada.horarios,
        materia_docente: {
          materia: {
            nombre: materia?.nombre || "Sin nombre",
            codigo_materia: materia?.codigo_materia || "Sin código",
          },
          docente: {
            nombre: docente?.nombre || "Sin nombre",
            apellido: docente?.apellido || "Sin apellido",
          },
        },
      };
    })
    .filter(Boolean) as Cursada[];

  // Fechas de inscripción
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentCuatrimestre = currentMonth <= 6 ? "Primer" : "Segundo";

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const inscripcionInicio = new Date(
    currentYear,
    currentCuatrimestre === "Primer" ? 2 : 7,
    15
  );
  const inscripcionFin = new Date(
    currentYear,
    currentCuatrimestre === "Primer" ? 3 : 8,
    1
  );

  const fechaInicio = formatDate(inscripcionInicio);
  const fechaFin = formatDate(inscripcionFin);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Inscripción a Cursadas
              </h1>
              <p className="text-muted-foreground">
                Selecciona las materias a las que deseas inscribirte para el
                período lectivo actual
              </p>

              <Card className="p-6">
                <div className="grid grid-cols-2">
                  <div>
                    <h2 className="text-xl font-semibold text-black-600 dark:text-white-600 mb">
                      Período de Inscripción Activo
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {currentCuatrimestre} Cuatrimestre {currentYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Válido desde
                    </p>
                    <p className="text-sm">
                      {fechaInicio} al {fechaFin}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Grid de cursadas */}
              <div className="mt-8">
                <div className="grid grid-cols-3 gap-6">
                  {cursadas.map((cursada: Cursada) => {
                    const yaInscripto = cursadasInscripto.has(cursada.id);
                    return (
                      <Card
                        key={cursada.id}
                        className="p-6 aspect-square flex flex-col hover:border-primary transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col h-full">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">
                              {cursada.materia_docente.materia.nombre}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Código:{" "}
                              {
                                cursada.materia_docente.materia
                                  .codigo_materia
                              }
                            </p>
                          </div>

                          <div className="flex-grow">
                            <p className="text-sm mb-2">
                              <span className="font-medium">Profesor:</span>{" "}
                              {cursada.materia_docente.docente.nombre}{" "}
                              {cursada.materia_docente.docente.apellido}
                            </p>
                            <p className="text-sm mb-2">
                              <span className="font-medium">Cupo:</span>{" "}
                              {cursada.cupo_maximo || "Sin límite"}
                            </p>
                            <div className="text-sm whitespace-pre-line">
                              <span className="font-medium">Horarios:</span>
                              <br />
                              {cursada.horarios?.horarios
                                ?.map(
                                  (h) =>
                                    `${h.dia} ${h.hora_inicio}-${h.hora_fin} (${h.aula})`
                                )
                                .join("\n")}
                            </div>
                          </div>

                          <form action={inscribirseEnCursada}>
                            <input
                              type="hidden"
                              name="cursadaId"
                              value={cursada.id}
                            />
                            <Button
                              type="submit"
                              className="mt-4"
                              size="sm"
                              disabled={yaInscripto}
                            >
                              {yaInscripto
                                ? "Ya estás inscripto"
                                : "Inscribirme"}
                            </Button>
                          </form>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Paginación */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {Math.min(6, cursadas.length)} de{" "}
                    {cursadas.length} cursadas disponibles
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cursadas.length <= 6}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}