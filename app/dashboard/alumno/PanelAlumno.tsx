"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Sidebar from '@/components/ui/sidebar_alumno'
import { Button } from '@/components/ui/button'
import { TrendingUp, Star, BookOpen } from 'lucide-react'

// Tipos locales mínimos para resolver discrepancias de inferencia de Supabase
type MesaExamen = { id: number; materia_id: number }
type InscripcionMesaRow = { mesa_examen_id: number; mesas_examen: MesaExamen | MesaExamen[] }
type PlanMateriaRow = { materia_id: number }
type MateriaInfo = { nombre: string; codigo_materia: string }
type MateriaDocente = { materias: MateriaInfo }
type CursadaInfo = { anio: number; cuatrimestre: number; materia_docente: MateriaDocente }
type InscripcionCursadaRow = { cursadas: CursadaInfo }
type MesasExamenInfo = { fecha_examen: string; hora_examen: string; ubicacion: string; materias: MateriaInfo }
type InscripcionExamenRow = { mesas_examen: MesasExamenInfo }
type ExamenAprobadoRow = { nota: string | number | null }

export default function PanelAlumno() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [materiasAprobadasDelPlan, setMateriasAprobadasDelPlan] = useState(0);
    const [totalMateriasEnPlan, setTotalMateriasEnPlan] = useState(1);
    const [materiasActualesTyped, setMateriasActualesTyped] = useState<InscripcionCursadaRow[] | null>([]);
    const [examenesInscriptosTyped, setExamenesInscriptosTyped] = useState<InscripcionExamenRow[] | null>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Simular el loading como en PanelDocente
                setTimeout(async () => {
                    const supabase = createClient();
                    const { data, error } = await supabase.auth.getUser();
                    
                    if (error || !data?.user) {
                        window.location.href = '/login';
                        return;
                    }

                    // Obtener información del alumno
                    const { data: userDataResult, error: userError } = await supabase
                        .from('usuarios')
                        .select(`
                            id,
                            nombre, 
                            apellido,
                            carrera_id
                        `)
                        .eq('email', data.user.email)
                        .single();

                    if (userError || !userDataResult) {
                        console.error('Error obteniendo datos del usuario:', userError);
                        window.location.href = '/login';
                        return;
                    }

                    setUserData(userDataResult);

                    // Obtener información de la carrera
                    let carreraData = null;
                    if (userDataResult && userDataResult.carrera_id) {
                        const { data: carrera, error: carreraError } = await supabase
                            .from('carreras')
                            .select('id, plan_de_estudio_id')
                            .eq('id', userDataResult.carrera_id)
                            .single();
                        
                        carreraData = carrera;
                        
                        if (carreraError) {
                            console.error('Error obteniendo carrera:', carreraError);
                        }
                    }

                    // Solo calcular estadísticas si tenemos información de carrera
                    if (carreraData && carreraData.plan_de_estudio_id) {
                        // Obtener progreso académico: materias aprobadas vs total del plan
                        const { data: materiasAprobadas, error: errorAprobadas } = await supabase
                            .from('inscripciones_mesa_examen')
                            .select(`
                                mesa_examen_id,
                                mesas_examen(
                                    id,
                                    materia_id
                                )
                            `)
                            .eq('estudiante_id', data.user.id)
                            .eq('estado', 'aprobado');

                        // Obtener materias del plan
                        const { data: materiasDelPlan } = await supabase
                            .from('plan_materias')
                            .select('materia_id')
                            .eq('plan_de_estudio_id', carreraData.plan_de_estudio_id);

                        if (materiasDelPlan && materiasAprobadas) {
                            const materiasDelPlanTyped = materiasDelPlan as PlanMateriaRow[];
                            const materiasAprobadasTyped = materiasAprobadas as InscripcionMesaRow[];
                            
                            const materiasDelPlanSet = new Set(materiasDelPlanTyped.map(m => m.materia_id));
                            const materiasUnicasAprobadas = new Set();
                            
                            materiasAprobadasTyped.forEach(inscripcion => {
                                if (inscripcion.mesas_examen) {
                                    // Si es un array, tomar el primer elemento, si no, usar el objeto directamente
                                    const mesa = Array.isArray(inscripcion.mesas_examen) 
                                        ? inscripcion.mesas_examen[0] 
                                        : inscripcion.mesas_examen;
                                    
                                    if (mesa && mesa.materia_id) {
                                        const materiaId = mesa.materia_id;
                                        if (materiasDelPlanSet.has(materiaId)) {
                                            materiasUnicasAprobadas.add(materiaId);
                                        }
                                    }
                                }
                            });
                            
                            setMateriasAprobadasDelPlan(materiasUnicasAprobadas.size);
                            setTotalMateriasEnPlan(materiasDelPlanTyped.length || 1);
                        }

                        // Obtener materias actuales
                        const { data: materiasActuales } = await supabase
                            .from('inscripciones_cursada')
                            .select(`
                                cursadas(
                                    anio,
                                    cuatrimestre,
                                    materia_docente(
                                        materias(nombre, codigo_materia)
                                    )
                                )
                            `)
                            .eq('estudiante_id', data.user.id);

                        setMateriasActualesTyped(materiasActuales as InscripcionCursadaRow[] | null);

                        // Obtener exámenes inscriptos
                        const { data: examenesInscriptos } = await supabase
                            .from('inscripciones_mesa_examen')
                            .select(`
                                mesas_examen(
                                    fecha_examen,
                                    hora_examen,
                                    ubicacion,
                                    materias(nombre, codigo_materia)
                                )
                            `)
                            .eq('estudiante_id', data.user.id)
                            .eq('estado', 'inscripto');

                        setExamenesInscriptosTyped(examenesInscriptos as InscripcionExamenRow[] | null);
                    }

                    setLoading(false);
                }, 800); // Mismo tiempo que PanelDocente
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Pantalla de loading igual al PanelDocente
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando panel de alumno...</p>
                </div>
            </div>
        );
    }

    const nombreCompleto = userData
        ? `${userData.nombre} ${userData.apellido}`
        : 'al Sistema';

    const porcentajeProgreso = Math.round((materiasAprobadasDelPlan / totalMateriasEnPlan) * 100);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                ¡Hola, {nombreCompleto}!
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Bienvenido a tu panel de estudiante. Aquí puedes gestionar tus materias, examenes y seguir tu progreso académico.
                            </p>
                        </div>

                        {/* Progreso académico */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Progreso Académico
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{materiasAprobadasDelPlan}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Materias Aprobadas</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalMateriasEnPlan}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Materias</div>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{porcentajeProgreso}%</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Progreso</div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Acciones Rápidas</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link href="/dashboard/alumno/materias/inscripcion">
                                    <Button className="w-full justify-start h-16 hover:scale-105 hover:shadow-md transition-all duration-300" variant="outline">
                                        <BookOpen className="h-5 w-5 mr-3" />
                                        Inscribirse a Materias
                                    </Button>
                                </Link>
                                <Link href="/dashboard/alumno/examenes/inscripcion">
                                    <Button className="w-full justify-start h-16 hover:scale-105 hover:shadow-md transition-all duration-300" variant="outline">
                                        <Star className="h-5 w-5 mr-3" />
                                        Inscribirse a Exámenes
                                    </Button>
                                </Link>
                                <Link href="/dashboard/alumno/historial-academico">
                                    <Button className="w-full justify-start h-16 hover:scale-105 hover:shadow-md transition-all duration-300" variant="outline">
                                        <TrendingUp className="h-5 w-5 mr-3" />
                                        Ver Historial Académico
                                    </Button>
                                </Link>
                                <Link href="/dashboard/alumno/certificados">
                                    <Button className="w-full justify-start h-16 hover:scale-105 hover:shadow-md transition-all duration-300" variant="outline">
                                        <Star className="h-5 w-5 mr-3" />
                                        Descargar Certificados
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Materias actuales */}
                        {materiasActualesTyped && materiasActualesTyped.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Materias Actuales</h2>
                                <div className="space-y-3">
                                    {materiasActualesTyped.slice(0, 3).map((inscripcion: InscripcionCursadaRow, index: number) => {
                                        const cursada = inscripcion.cursadas;
                                        const materia = cursada?.materia_docente?.materias;
                                        
                                        return (
                                            <div 
                                                key={index} 
                                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium text-slate-900 dark:text-white">
                                                            {materia?.codigo_materia} - {materia?.nombre}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {cursada?.anio} - {cursada?.cuatrimestre}° Cuatrimestre
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Próximos exámenes */}
                        {examenesInscriptosTyped && examenesInscriptosTyped.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Próximos Exámenes</h2>
                                <div className="space-y-3">
                                    {examenesInscriptosTyped.slice(0, 3).map((inscripcion: InscripcionExamenRow, index: number) => {
                                        const mesa = inscripcion.mesas_examen;
                                        const materia = mesa?.materias;
                                        
                                        return (
                                            <div 
                                                key={index} 
                                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium text-slate-900 dark:text-white">
                                                            {materia?.codigo_materia} - {materia?.nombre}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {mesa?.fecha_examen} - {mesa?.hora_examen}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {mesa?.ubicacion}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}