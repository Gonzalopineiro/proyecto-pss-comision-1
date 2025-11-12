"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface MesaDisponible {
  id: string;
  materia_id: string;
  fecha_examen: string;
  hora_examen: string;
  ubicacion: string;
  estado: string;
  materias: { nombre: string };
  materia_nombre: string;
  ya_inscripto: boolean;
}

export interface CorrelativaFinalInfo {
  materia_id: number;
  nombre: string;
  codigo: string;
  cursada_aprobada: boolean;
  final_aprobado: boolean;
  cumplida: boolean;
}

export interface VerificacionCorrelativasFinales {
  puede_inscribirse: boolean;
  correlativas: CorrelativaFinalInfo[];
  plan_id: number;
  error?: string;
}

interface MesaRaw {
  id: string;
  materia_id: string;
  fecha_examen: string;
  hora_examen: string;
  ubicacion: string;
  estado: string;
  materias: { nombre: string } | { nombre: string }[];
}

export async function obtenerMateriaIdPorCodigo(
  codigoMateria: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materias")
    .select("id")
    .eq("codigo_materia", codigoMateria)
    .single();

  if (error || !data) {
    throw new Error(`No se encontró la materia con código: ${codigoMateria}`);
  }

  return data.id;
}

export async function verificarCorrelativasFinales(
  materiaId: number
): Promise<VerificacionCorrelativasFinales> {
  console.log(
    "🚀 INICIANDO verificarCorrelativasFinales para materia ID:",
    materiaId
  );

  const supabase = await createClient();

  try {
    // Obtener el usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      console.error("❌ Error de autenticación:", authError);
      throw new Error("No hay sesión activa");
    }

    console.log("👤 Usuario autenticado:", user.email, "ID:", user.id);

    return await verificarCorrelativasFinalesTypeScript(
      user.email,
      user.id,
      materiaId,
      supabase
    );
  } catch (error) {
    console.error("Error en verificarCorrelativasFinales:", error);
    throw new Error("Error al verificar correlativas de final");
  }
}

// Función que hace la verificación de correlativas para finales en TypeScript
async function verificarCorrelativasFinalesTypeScript(
  email: string,
  userId: string,
  materiaId: number,
  supabase: any
): Promise<VerificacionCorrelativasFinales> {
  console.log(`🔍 INICIANDO VERIFICACIÓN DE CORRELATIVAS FINALES`);
  console.log(`📧 Email: ${email}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📚 Materia ID: ${materiaId}`);

  // 1. Obtener el plan de estudios del alumno
  const { data: alumnoData, error: alumnoError } = await supabase
    .from("usuarios")
    .select(
      `
      id,
      carrera_id,
      carreras!carrera_id (
        plan_de_estudio_id
      )
    `
    )
    .eq("email", email)
    .single();

  if (alumnoError || !alumnoData?.carreras) {
    console.error("❌ Error obteniendo datos del alumno:", alumnoError);
    throw new Error("No se encontró el alumno o su carrera");
  }

  const planId = (alumnoData.carreras as any).plan_de_estudio_id;
  console.log(`📋 Plan de estudios ID: ${planId}`);

  // 2. Obtener correlativas requeridas para esta materia (para finales)
  const { data: correlativasRequeridas, error: correlativasError } =
    await supabase
      .from("correlatividades_final")
      .select(
        `
      correlativa_id
    `
      )
      .eq("plan_id", planId)
      .eq("materia_id", materiaId);

  if (correlativasError) {
    console.error("❌ Error obteniendo correlativas:", correlativasError);
    throw new Error("Error al obtener correlativas requeridas");
  }

  console.log(
    `📊 Correlativas finales requeridas encontradas:`,
    correlativasRequeridas
  );

  // Si no hay correlativas, puede inscribirse
  if (!correlativasRequeridas || correlativasRequeridas.length === 0) {
    return {
      puede_inscribirse: true,
      correlativas: [],
      plan_id: planId,
    };
  }

  // Obtener información de las materias correlativas por separado
  const correlativaIds = correlativasRequeridas.map(
    (c: any) => c.correlativa_id
  );

  const { data: materiasCorrelativas, error: materiasError } = await supabase
    .from("materias")
    .select("id, nombre, codigo_materia")
    .in("id", correlativaIds);

  if (materiasError) {
    console.error("❌ Error obteniendo materias correlativas:", materiasError);
    throw new Error("Error al obtener información de materias correlativas");
  }

  console.log(`📚 Materias correlativas obtenidas:`, materiasCorrelativas);

  // 3. Verificar qué correlativas ya cumplió el alumno
  // Para finales, necesita tener:
  // 1. Cursada aprobada de las materias correlativas
  // 2. Final aprobado de las materias que son correlativas de final
  const correlativasConEstado = await Promise.all(
    correlativasRequeridas.map(async (correlativa: any) => {
      // Encontrar la información de la materia correlativa
      const materiaInfo = materiasCorrelativas?.find(
        (m: any) => m.id === correlativa.correlativa_id
      );

      console.log(
        `🔍 Verificando correlativa final: ${materiaInfo?.nombre} (ID: ${correlativa.correlativa_id})`
      );

      // PASO 1: Verificar que tenga cursada aprobada
      const { data: cursadasMateria, error: cursadasError } = await supabase
        .from("cursadas")
        .select(
          `
          id,
          materia_docente!inner (
            materia_id
          )
        `
        )
        .eq("materia_docente.materia_id", correlativa.correlativa_id);

      let cursadaAprobada = false;
      let cursadaIds: any[] = [];

      if (cursadasError) {
        console.error("Error obteniendo cursadas:", cursadasError);
      } else if (cursadasMateria && cursadasMateria.length > 0) {
        cursadaIds = cursadasMateria.map((c: any) => c.id);

        const { data: inscripcionesCursada, error: inscripcionesError } =
          await supabase
            .from("inscripciones_cursada")
            .select("estado, cursada_id")
            .eq("alumno_id", userId)
            .in("cursada_id", cursadaIds)
            .eq("estado", "aprobada");

        if (
          !inscripcionesError &&
          inscripcionesCursada &&
          inscripcionesCursada.length > 0
        ) {
          cursadaAprobada = true;
        }
      }

      console.log(
        `📚 Cursada ${materiaInfo?.nombre}: ${
          cursadaAprobada ? "✅ APROBADA" : "❌ NO APROBADA"
        }`
      );

      // PASO 2: Verificar que tenga final aprobado
      let finalAprobado = false;

      // Buscar mesas de examen de esta materia
      const { data: mesasExamen, error: mesasError } = await supabase
        .from("mesas_examen")
        .select("id")
        .eq("materia_id", correlativa.correlativa_id);

      if (mesasError) {
        console.error("Error obteniendo mesas de examen:", mesasError);
      } else if (mesasExamen && mesasExamen.length > 0) {
        const mesaIds = mesasExamen.map((m: any) => m.id);

        // Verificar si el alumno tiene inscripciones en estas mesas con nota aprobatoria
        const { data: inscripcionesMesa, error: inscripcionesMesaError } =
          await supabase
            .from("inscripciones_mesa_examen")
            .select("mesa_examen_id, nota, estado")
            .eq("estudiante_id", userId)
            .in("mesa_examen_id", mesaIds)
            .not("nota", "is", null) // Solo inscripciones con nota cargada
            .gte("nota", 4); // Nota >= 4 (aprobado)

        if (
          !inscripcionesMesaError &&
          inscripcionesMesa &&
          inscripcionesMesa.length > 0
        ) {
          finalAprobado = true;
        }
      }

      console.log(
        `🎓 Final ${materiaInfo?.nombre}: ${
          finalAprobado ? "✅ APROBADO" : "❌ NO APROBADO"
        }`
      );

      // La correlativa está cumplida solo si AMBOS están aprobados
      const cumplida = cursadaAprobada && finalAprobado;

      console.log(
        `${cumplida ? "✅" : "❌"} Correlativa final ${materiaInfo?.nombre}: ${
          cumplida ? "CUMPLIDA (cursada + final aprobados)" : "NO CUMPLIDA"
        }`
      );

      return {
        materia_id: correlativa.correlativa_id,
        nombre: materiaInfo?.nombre || "Materia desconocida",
        codigo: materiaInfo?.codigo_materia || "Sin código",
        cursada_aprobada: cursadaAprobada,
        final_aprobado: finalAprobado,
        cumplida,
      };
    })
  );

  // 4. Determinar si puede inscribirse
  const puede_inscribirse = correlativasConEstado.every((c: any) => c.cumplida);

  return {
    puede_inscribirse,
    correlativas: correlativasConEstado,
    plan_id: planId,
  };
}

export async function obtenerMesasDisponibles(): Promise<MesaDisponible[]> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const userId = userData.user.id;

  const { data: alumno } = await supabase
    .from("usuarios")
    .select("carrera_id")
    .eq("email", userData.user.email)
    .single();
  if (!alumno) return [];

  const { data: carrera } = await supabase
    .from("carreras")
    .select("plan_de_estudio_id")
    .eq("id", alumno.carrera_id)
    .single();
  if (!carrera) return [];

  const { data: materiasPlan } = await supabase
    .from("plan_materia")
    .select("materia_id")
    .eq("plan_id", carrera.plan_de_estudio_id);

  if (!materiasPlan) return [];
  const materiasIds = materiasPlan.map((m) => m.materia_id);
  if (materiasIds.length === 0) return [];

  const { data: mesas } = await supabase
    .from("mesas_examen")
    .select(
      `
      id,
      materia_id,
      fecha_examen,
      hora_examen,
      ubicacion,
      estado,
      materias (nombre)
    `
    )
    .eq("estado", "programada")
    .in("materia_id", materiasIds);

  if (!mesas) return [];

  const { data: inscripciones } = await supabase
    .from("inscripciones_mesa_examen")
    .select("mesa_examen_id, estado")
    .eq("estudiante_id", userId)
    .neq("estado", "cancelado");

  const inscriptasIds = new Set(
    (inscripciones || []).map((i) => i.mesa_examen_id)
  );

  return (mesas as MesaRaw[]).map((mesa) => {
    const materia =
      Array.isArray(mesa.materias) && mesa.materias.length > 0
        ? mesa.materias[0]
        : (mesa.materias as { nombre: string });

    return {
      ...mesa,
      materias: materia,
      materia_nombre: materia?.nombre ?? "—",
      ya_inscripto: inscriptasIds.has(mesa.id),
    };
  });
}

// 🔹 Server Action con revalidación de la página y verificación de correlativas
export async function inscribirseEnMesa(mesaId: string, materiaId: number) {
  console.log(
    "🎯 INICIANDO inscribirseEnMesa para mesa:",
    mesaId,
    "materia:",
    materiaId
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay sesión activa");
  }

  // Verificar correlativas antes de inscribirse
  const verificacion = await verificarCorrelativasFinales(materiaId);

  if (!verificacion.puede_inscribirse) {
    const correlativasNoAprobadas = verificacion.correlativas
      .filter((c: any) => !c.cumplida)
      .map((c: any) => c.nombre)
      .join(", ");

    throw new Error(
      `No puedes inscribirte al final. Necesitas aprobar las siguientes materias: ${correlativasNoAprobadas}`
    );
  }

  // Si pasa la verificación, proceder con la inscripción
  const { error } = await supabase.from("inscripciones_mesa_examen").insert({
    mesa_examen_id: mesaId,
    estudiante_id: user.id,
    fecha_inscripcion: new Date().toISOString(),
  });

  if (error) {
    console.error("Error inscribiendo en mesa:", error);
    throw new Error("Error al inscribirse en el examen");
  }

  console.log("✅ Inscripción exitosa en mesa:", mesaId);

  // 🔹 Revalidar la ruta para que la página se vuelva a renderizar con los datos actualizados
  revalidatePath("/dashboard/alumno/examenes/inscripcion");
}

export async function cancelarInscripcionMesa(mesaId: string) {
  console.log("🚫 Cancelando inscripción a mesa:", mesaId);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay sesión activa");
  }

  // 🕒 Obtener la fecha y hora del examen
  const { data: mesa, error: mesaError } = await supabase
    .from("mesas_examen")
    .select("fecha_examen, hora_examen")
    .eq("id", mesaId)
    .single();

  if (mesaError || !mesa) {
    console.error("❌ Error al obtener la mesa de examen:", mesaError);
    throw new Error("No se pudo obtener la información de la mesa de examen.");
  }

  // Combinar fecha y hora del examen en un solo objeto Date
  const examenDateTime = new Date(`${mesa.fecha_examen}T${mesa.hora_examen}`);

  // Calcular el límite para cancelar (24h antes del examen)
  const limiteCancelacion = new Date(
    examenDateTime.getTime() - 24 * 60 * 60 * 1000
  );
  const ahora = new Date();

  // 🚫 Verificar si ya pasó el límite
  if (ahora >= limiteCancelacion) {
    console.warn(
      "❌ No se puede cancelar: faltan menos de 24h para el examen."
    );
    throw new Error(
      "No se puede cancelar la inscripción porque faltan menos de 24 horas para el examen."
    );
  }

  // ✅ Eliminar la inscripción de la base de datos
  const { error } = await supabase
    .from("inscripciones_mesa_examen")
    .delete()
    .eq("mesa_examen_id", mesaId)
    .eq("estudiante_id", user.id)
    .eq("estado", "inscripto"); // solo si estaba efectivamente inscripto

  if (error) {
    console.error("❌ Error al eliminar inscripción:", error);
    throw new Error("Error al cancelar la inscripción al examen.");
  }

  console.log("✅ Inscripción eliminada con éxito.");

  revalidatePath("/dashboard/alumno/examenes/inscripcion");
}