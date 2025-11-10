'use server';

import { createClient } from '@/utils/supabase/server';

export interface AlumnoInscripto {
  id: number;
  legajo: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: string;
  fecha_inscripcion: string;
}

export interface CursadaInfo {
  id: number;
  materia_codigo: string;
  materia_nombre: string;
  comision: string;
  cuatrimestre: string;
  anio: number;
  alumnos_inscriptos: number;
}

export interface DocenteInfo {
  nombre: string;
  apellido: string;
  email: string;
}

export async function obtenerCursadasDocente(): Promise<CursadaInfo[]> {
  const supabase = await createClient();

  try {
    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('🔍 Usuario autenticado:', user.email);

    // Obtener el docente_id desde la tabla docentes usando el email
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single();

    if (docenteError || !docenteData) {
      console.error('❌ Error al obtener datos del docente:', docenteError);
      return [];
    }

    console.log('✅ Docente encontrado, ID:', docenteData.id);

    // Obtener las relaciones materia_docente para este docente
    const { data: materiasDocente, error: materiasError } = await supabase
      .from('materia_docente')
      .select('id, materia_id')
      .eq('docente_id', docenteData.id);

    if (materiasError || !materiasDocente) {
      console.error('❌ Error al obtener materias del docente:', materiasError);
      return [];
    }

    console.log(`✅ Materias del docente encontradas: ${materiasDocente.length}`);

    if (materiasDocente.length === 0) {
      console.log('❌ El docente no tiene materias asignadas');
      return [];
    }

    const materiaDocenteIds = materiasDocente.map(md => md.id);
    console.log('🔍 IDs de materia_docente:', materiaDocenteIds);

    // Buscar cursadas para estas relaciones materia_docente
    const { data: cursadas, error: cursadasError } = await supabase
      .from('cursadas')
      .select('id, anio, cuatrimestre, materia_docente_id, estado')
      .in('materia_docente_id', materiaDocenteIds);

    console.log('🔍 Query cursadas result:', { cursadas, error: cursadasError });

    if (cursadasError || !cursadas || cursadas.length === 0) {
      console.log('❌ No hay cursadas encontradas');
      return [];
    }

    console.log(`✅ Cursadas reales encontradas: ${cursadas.length}`);

    // Para cada cursada, obtener información de la materia y contar alumnos
    const cursadasCompletas = await Promise.all(
      cursadas.map(async (cursada: any) => {
        // Obtener info de la materia
        const materiaDocente = materiasDocente.find(md => md.id === cursada.materia_docente_id);
        if (!materiaDocente) return null;

        const { data: materia, error: materiaError } = await supabase
          .from('materias')
          .select('codigo_materia, nombre')
          .eq('id', materiaDocente.materia_id)
          .single();

        if (materiaError || !materia) {
          console.error('Error al obtener materia:', materiaError);
          return null;
        }

        // Contar alumnos inscriptos REALES (todos los estados)
        const { count } = await supabase
          .from('inscripciones_cursada')
          .select('*', { count: 'exact', head: true })
          .eq('cursada_id', cursada.id);

        return {
          id: cursada.id,
          materia_codigo: materia.codigo_materia,
          materia_nombre: materia.nombre,
          comision: 'Comisión A',
          cuatrimestre: `${cursada.cuatrimestre}-${cursada.anio}`,
          anio: cursada.anio,
          alumnos_inscriptos: count || 0
        };
      })
    );

    // Filtrar nulls y retornar
    const cursadasValidas = cursadasCompletas.filter(Boolean) as CursadaInfo[];
    console.log('✅ Cursadas válidas procesadas:', cursadasValidas.length);
    
    return cursadasValidas;

  } catch (error) {
    console.error('💥 Error en obtenerCursadasDocente:', error);
    throw error;
  }
}

export async function obtenerAlumnosInscriptos(cursadaId: string): Promise<AlumnoInscripto[]> {
  const supabase = await createClient();

  try {
    // Verificar el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('🔍 Obteniendo alumnos para cursada ID:', cursadaId);

    // Obtener el docente_id desde la tabla docentes usando el email (igual que en obtenerCursadasDocente)
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single();

    if (docenteError || !docenteData) {
      console.error('❌ Error al obtener datos del docente:', docenteError);
      throw new Error('No se encontró información del docente');
    }

    console.log('✅ Docente encontrado, ID:', docenteData.id);

    // Verificar que la cursada pertenece al docente logueado
    // Usamos consultas secuenciales en vez de selects anidados para evitar depender
    // de relaciones definidas en PostgREST/Supabase (que pueden no existir o tener nombres distintos)
    const { data: cursadaRaw, error: cursadaRawError } = await supabase
      .from('cursadas')
      .select('id, materia_docente_id')
      .eq('id', cursadaId)
      .single();

    if (cursadaRawError || !cursadaRaw) {
      console.error('❌ Error al obtener la cursada para verificación:', cursadaRawError, 'cursadaRaw=', cursadaRaw);
      throw new Error('No se encontró la cursada solicitada');
    }

    console.log('🔍 Cursada encontrada:', cursadaRaw);

    // Obtener el registro materia_docente asociado a la cursada
    const { data: mdRecord, error: mdError } = await supabase
      .from('materia_docente')
      .select('id, docente_id, materia_id')
      .eq('id', cursadaRaw.materia_docente_id)
      .single();

    if (mdError || !mdRecord) {
      console.error('❌ Error al obtener materia_docente:', mdError, 'materia_docente_id=', cursadaRaw.materia_docente_id);
      throw new Error('No se pudo verificar la relación materia-docente');
    }

    console.log('🔍 materia_docente encontrada:', mdRecord);

    // Comparar explícitamente el docente asociado
    if (String(mdRecord.docente_id) !== String(docenteData.id)) {
      console.error('❌ El docente autenticado NO es responsable de esta cursada:', {
        docenteLogueado: docenteData.id,
        docenteCursada: mdRecord.docente_id
      });
      throw new Error('No tienes acceso a esta cursada');
    }

    console.log('✅ Acceso a cursada verificado (docente coincide)');

    // Obtener inscripciones para esta cursada
    const { data: inscripciones, error: inscripcionesError } = await supabase
      .from('inscripciones_cursada')
      .select('id, estado, fecha_inscripcion, alumno_id')
      .eq('cursada_id', cursadaId);

    if (inscripcionesError) {
      console.error('❌ Error al obtener inscripciones:', inscripcionesError);
      throw new Error('Error al obtener las inscripciones');
    }

    if (!inscripciones || inscripciones.length === 0) {
      console.log('❌ No hay inscripciones para esta cursada');
      return [];
    }

    console.log(`✅ Inscripciones encontradas: ${inscripciones.length}`);

    // Paso 2: Para cada inscripción, obtener el email desde auth.users y luego el alumno desde usuarios
    const alumnosInscriptos = await Promise.all(
      inscripciones.map(async (inscripcion: any, index: number) => {
        try {
          // Obtener el email del alumno usando la función RPC get_email_from_auth_user
          const { data: emailData, error: rpcError } = await supabase.rpc('get_email_from_auth_user', {
            uid: inscripcion.alumno_id,
          });

          if (rpcError || !emailData) {
            console.warn(`⚠️ No se pudo obtener email para alumno_id ${inscripcion.alumno_id}`, rpcError);
            return null;
          }

          const alumnoEmail = emailData;

          // Buscar datos del alumno en la tabla usuarios usando el email
          const { data: usuario, error: usuarioError } = await supabase
            .from('usuarios')
            .select('nombre, apellido, legajo, email')
            .eq('email', alumnoEmail)
            .single();

          if (usuarioError || !usuario) {
            console.warn(`⚠️ No se encontró usuario en tabla usuarios para email ${alumnoEmail}`);
            return null;
          }

          return {
            id: inscripcion.id,
            legajo: usuario.legajo,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            estado: inscripcion.estado,
            fecha_inscripcion: inscripcion.fecha_inscripcion,
          };
        } catch (err) {
          console.error(`❌ Error procesando inscripción ${index}:`, err);
          return null;
        }
      })
    );

    // Filtrar nulls y ordenar por legajo
    const alumnosValidos = alumnosInscriptos.filter(Boolean) as AlumnoInscripto[];
    const alumnosOrdenados = alumnosValidos.sort((a, b) => a.legajo - b.legajo);

    console.log(`✅ Alumnos válidos procesados: ${alumnosOrdenados.length}`);
    
    return alumnosOrdenados;

  } catch (error) {
    console.error('💥 Error en obtenerAlumnosInscriptos:', error);
    throw error;
  }
}

export async function obtenerInfoDocente(): Promise<DocenteInfo> {
  const supabase = await createClient();

  try {
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No hay usuario autenticado');
    }

    // Buscar información del docente por email en la tabla docentes
    const { data: docente, error } = await supabase
      .from('docentes')
      .select('nombre, apellido, email')
      .eq('email', user.email)
      .single();

    if (error || !docente) {
      console.error('❌ No se encontró docente con ese email:', user.email);
      throw new Error('No se encontró información del docente');
    }

    return {
      nombre: docente.nombre,
      apellido: docente.apellido,
      email: docente.email
    };

  } catch (error) {
    console.error('💥 Error en obtenerInfoDocente:', error);
    throw error;
  }
}

export async function obtenerInfoCursada(cursadaId: string): Promise<CursadaInfo> {
  const supabase = await createClient();

  try {
    // Verificar el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('🔍 Obteniendo información de cursada ID:', cursadaId);

    // Obtener el docente_id desde la tabla docentes usando el email (igual que en obtenerCursadasDocente)
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single();

    if (docenteError || !docenteData) {
      console.error('❌ Error al obtener datos del docente:', docenteError);
      throw new Error('No se encontró información del docente');
    }

    console.log('✅ Docente encontrado, ID:', docenteData.id);

    // Obtener la cursada (sin joins complejos)
    const { data: cursadaRow, error: cursadaRowError } = await supabase
      .from('cursadas')
      .select('id, anio, cuatrimestre, materia_docente_id')
      .eq('id', cursadaId)
      .single();

    if (cursadaRowError || !cursadaRow) {
      console.error('❌ Error al obtener cursada:', cursadaRowError);
      throw new Error('No se pudo obtener la cursada o no tienes acceso');
    }

    // Obtener materia_docente y verificar docente
    const { data: mdRecord, error: mdError } = await supabase
      .from('materia_docente')
      .select('id, docente_id, materia_id')
      .eq('id', cursadaRow.materia_docente_id)
      .single();

    if (mdError || !mdRecord) {
      console.error('❌ Error al obtener materia_docente para la cursada:', mdError);
      throw new Error('No se pudo obtener la información de la relación materia-docente');
    }

    if (String(mdRecord.docente_id) !== String(docenteData.id)) {
      console.error('❌ Docente no coincide para la cursada:', { docenteLogueado: docenteData.id, docenteCursada: mdRecord.docente_id });
      throw new Error('No tienes acceso a esta cursada');
    }

    // Obtener la materia
    const { data: materiaRow, error: materiaError } = await supabase
      .from('materias')
      .select('codigo_materia, nombre')
      .eq('id', mdRecord.materia_id)
      .single();

    if (materiaError || !materiaRow) {
      console.error('❌ Error al obtener materia:', materiaError);
      throw new Error('No se pudo obtener la información de la materia');
    }

    // Contar alumnos inscriptos reales (todos los estados)
    const { count } = await supabase
      .from('inscripciones_cursada')
      .select('*', { count: 'exact', head: true })
      .eq('cursada_id', cursadaId);

    const cursadaInfo: CursadaInfo = {
      id: cursadaRow.id,
      materia_codigo: materiaRow.codigo_materia,
      materia_nombre: materiaRow.nombre,
      comision: 'Comisión A', // Este valor puede venir de la BD en futuras versiones
      cuatrimestre: `${cursadaRow.cuatrimestre}-${cursadaRow.anio}`,
      anio: cursadaRow.anio,
      alumnos_inscriptos: count || 0
    };

    console.log('✅ Información de cursada obtenida:', cursadaInfo);
    return cursadaInfo;

  } catch (error) {
    console.error('💥 Error en obtenerInfoCursada:', error);
    throw error;
  }
}