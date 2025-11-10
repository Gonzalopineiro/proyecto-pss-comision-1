'use server';

import { createClient } from '@/utils/supabase/server'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

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
  docente_nombre?: string;
  docente_apellido?: string;
  docente_email?: string;
}

export interface AdminInfo {
  nombre: string;
  apellido: string;
  email: string;
}


// ─────────────────────────────────────────────
// 🔍 NUEVA FUNCIÓN ADMINISTRATIVA
// ─────────────────────────────────────────────

export async function obtenerTodasLasCursadas(): Promise<CursadaInfo[]> {
  const supabase = await createClient();

  try {
    console.log('🔍 ADMIN: Obteniendo todas las cursadas del sistema...');

    // Obtener TODAS las cursadas, sin importar docente ni materia
    const { data: cursadasData, error: cursadasError } = await supabase
      .from('cursadas')
      .select(`
        id,
        comision,
        cuatrimestre,
        anio,
        materia_docente: materia_docente (
          materia_id,
          docente_id,
          materias (
            codigo_materia,
            nombre
          ),
          docentes (
            nombre,
            apellido,
            email
          )
        )
      `)
      .order('anio', { ascending: false })
      .order('cuatrimestre', { ascending: false });

    if (cursadasError) {
      console.error('❌ Error al obtener cursadas:', cursadasError);
      throw new Error('No se pudieron obtener las cursadas');
    }

    if (!cursadasData || cursadasData.length === 0) {
      console.log('ℹ️ No se encontraron cursadas en el sistema');
      return [];
    }

    console.log(`📚 ADMIN: Encontradas ${cursadasData.length} cursadas`);

    // Procesar cada cursada para agregar materia, docente y cantidad de alumnos
    const cursadasConInfo: CursadaInfo[] = [];

    for (const cursada of cursadasData) {
      const materiaDocente = cursada.materia_docente as any;
      const materia = materiaDocente?.materias;
      const docente = materiaDocente?.docentes;

      // Contar inscriptos
      const { count } = await supabase
        .from('inscripciones_cursada')
        .select('*', { count: 'exact', head: true })
        .eq('cursada_id', cursada.id);

      cursadasConInfo.push({
        id: cursada.id,
        materia_codigo: materia?.codigo_materia || 'SIN CÓDIGO',
        materia_nombre: materia?.nombre || 'Materia no encontrada',
        comision: cursada.comision || 'A',
        cuatrimestre: String(cursada.cuatrimestre),
        anio: cursada.anio,
        alumnos_inscriptos: count || 0,
        docente_nombre: docente?.nombre || 'No asignado',
        docente_apellido: docente?.apellido || '',
        docente_email: docente?.email || ''
      });
    }

    console.log(`✅ ADMIN: ${cursadasConInfo.length} cursadas procesadas correctamente`);
    return cursadasConInfo;

  } catch (error) {
    console.error('💥 Error general en obtenerTodasLasCursadas (admin):', error);
    throw error;
  }
}

export async function obtenerAlumnosInscriptos(cursadaId: string): Promise<AlumnoInscripto[]> {
  const supabase = await createClient();

  try {
    console.log('🔍 ADMIN: Obteniendo alumnos inscriptos para cursada ID:', cursadaId);

    // Obtener inscripciones (solo id, estado, alumno_id)
    const { data: inscripciones, error: inscripcionesError } = await supabase
      .from('inscripciones_cursada')
      .select('id, estado, fecha_inscripcion, alumno_id')
      .eq('cursada_id', cursadaId);

    if (inscripcionesError) {
      console.error('❌ Error al obtener inscripciones:', inscripcionesError);
      throw new Error('Error al obtener las inscripciones');
    }

    if (!inscripciones || inscripciones.length === 0) {
      console.log('ℹ️ No hay inscripciones registradas para esta cursada');
      return [];
    }

    console.log(`📚 ADMIN: ${inscripciones.length} inscripciones encontradas`);

    // Procesar todas en paralelo usando Promise.all
    const alumnosProcesados = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        try {
          // Obtener email desde auth.users (RPC ya creada)
          const { data: emailData, error: rpcError } = await supabase.rpc('get_email_from_auth_user', {
            uid: inscripcion.alumno_id,
          });

          if (rpcError || !emailData) {
            console.warn(`⚠️ No se pudo obtener email para alumno_id=${inscripcion.alumno_id}`);
            return null;
          }

          const alumnoEmail = emailData;

          // Buscar datos académicos del alumno
          const { data: usuario, error: usuarioError } = await supabase
            .from('usuarios')
            .select('nombre, apellido, legajo, email')
            .eq('email', alumnoEmail)
            .single();

          if (usuarioError || !usuario) {
            console.warn(`⚠️ No se encontró usuario con email=${alumnoEmail}`);
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
          } as AlumnoInscripto;
        } catch (error) {
          console.error(`❌ Error procesando inscripción ${inscripcion.id}:`, error);
          return null;
        }
      })
    );

    // Filtrar nulls y ordenar
    const alumnosValidos = alumnosProcesados.filter(Boolean) as AlumnoInscripto[];
    const ordenados = alumnosValidos.sort((a, b) => a.legajo - b.legajo);

    console.log(`✅ ADMIN: Alumnos procesados correctamente (${ordenados.length})`);
    return ordenados;
  } catch (error) {
    console.error('💥 Error general en obtenerAlumnosInscriptos (admin):', error);
    throw error;
  }
}

export async function obtenerInfoCursada(cursadaId: string): Promise<CursadaInfo> {
  const supabase = await createClient();

  try {
    console.log('🔍 ADMIN: Obteniendo información de cursada ID:', cursadaId);

    // Obtener la cursada con join hacia materia_docente → materias y docentes
    const { data: cursadaData, error: cursadaError } = await supabase
      .from('cursadas')
      .select(`
        id,
        comision,
        cuatrimestre,
        anio,
        materia_docente: materia_docente (
          materia_id,
          docente_id,
          materias (
            codigo_materia,
            nombre
          ),
          docentes (
            nombre,
            apellido,
            email
          )
        )
      `)
      .eq('id', cursadaId)
      .single();

    if (cursadaError || !cursadaData) {
      console.error('❌ Error al obtener cursada:', cursadaError);
      throw new Error('No se encontró la cursada solicitada');
    }

    const materiaDocente = cursadaData.materia_docente as any;
    const materia = materiaDocente?.materias;
    const docente = materiaDocente?.docentes;

    // Contar alumnos inscriptos para esta cursada
    const { count } = await supabase
      .from('inscripciones_cursada')
      .select('*', { count: 'exact', head: true })
      .eq('cursada_id', cursadaId);

    const cursadaInfo: CursadaInfo = {
      id: cursadaData.id,
      materia_codigo: materia?.codigo_materia || 'SIN CÓDIGO',
      materia_nombre: materia?.nombre || 'Materia no encontrada',
      comision: cursadaData.comision || 'A',
      cuatrimestre: String(cursadaData.cuatrimestre),
      anio: cursadaData.anio,
      alumnos_inscriptos: count || 0,
      docente_nombre: docente?.nombre || 'No asignado',
      docente_apellido: docente?.apellido || '',
      docente_email: docente?.email || ''
    };

    console.log('✅ ADMIN: Información de cursada obtenida:', cursadaInfo);
    return cursadaInfo;

  } catch (error) {
    console.error('💥 Error en obtenerInfoCursada (admin):', error);
    throw error;
  }
}

export async function obtenerInfoAdmin(): Promise<AdminInfo> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 ADMIN: Obteniendo información del administrador...');

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('👤 Usuario autenticado:', user.email);

    // Obtener la información del administrador desde la tabla administrativos
    const { data: adminData, error: adminError } = await supabase
      .from('administrativos')
      .select('nombre, apellido, email')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      console.error('❌ Error al obtener datos del administrador:', adminError);
      throw new Error('No se pudo obtener la información del administrador');
    }

    const adminInfo: AdminInfo = {
      nombre: adminData.nombre,
      apellido: adminData.apellido,
      email: adminData.email
    };

    console.log('✅ ADMIN: Información obtenida desde tabla administrativos:', adminInfo);
    return adminInfo;

  } catch (error) {
    console.error('💥 Error en obtenerInfoAdmin:', error);
    throw error;
  }
}
