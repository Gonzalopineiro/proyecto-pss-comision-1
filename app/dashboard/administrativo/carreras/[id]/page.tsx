'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    obtenerDetallesCompletosCarrera, 
    actualizarCarrera, 
    obtenerDepartamentos,
    buscarMateriasDisponibles,
    actualizarPlanDeEstudios 
} from '@/app/dashboard/administrativo/crear-carrera/actions';

// Importa los componentes UI que necesites
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Tipos de datos para el estado
type CarreraDetalles = Awaited<ReturnType<typeof obtenerDetallesCompletosCarrera>>;
type MateriaPlan = NonNullable<CarreraDetalles>['materias_plan'][0] & { plan_materia_id?: number };
type MateriaDisponible = Awaited<ReturnType<typeof buscarMateriasDisponibles>>[0];

// --- Componente principal de la página ---
export default function ModificarCarreraPage() {
    // ... (El código de este componente principal no cambia, se mantiene igual) ...
    const params = useParams();
    const router = useRouter();
    const carreraId = Number(params.id);

    const [carrera, setCarrera] = useState<CarreraDetalles>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [vistaActual, setVistaActual] = useState<'carrera' | 'plan'>('carrera');
    
    // Estados para el formulario de Carrera
    const [departamento, setDepartamento] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [departamentosDisponibles, setDepartamentosDisponibles] = useState<string[]>([]);

    useEffect(() => {
        if (!carreraId) return;

        async function cargarDatos() {
            setIsLoading(true);
            const data = await obtenerDetallesCompletosCarrera(carreraId);
            const deptos = await obtenerDepartamentos();
            setDepartamentosDisponibles(deptos);
            setCarrera(data);
            if (data) {
                setDepartamento(data.departamento || '');
            }
            setIsLoading(false);
        }
        cargarDatos();
    }, [carreraId]);
    
    const handleGuardarCambiosCarrera = async () => {
        const result = await actualizarCarrera(carreraId, { departamento, descripcion });
        // --- CORRECCIÓN 1 (APLICADA TAMBIÉN EN EL OTRO COMPONENTE) ---
        if (result && 'error' in result) {
            toast.error(result.error);
        } else {
            toast.success('Carrera actualizada con éxito');
        }
    };
    
    if (isLoading) {
        return <div className="container mx-auto py-8 text-center"> <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" /> Cargando...</div>;
    }

    if (!carrera) {
        return <div className="container mx-auto py-8">Carrera no encontrada.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            {/* ... (código de la vista 'carrera' se mantiene igual) ... */}
            {vistaActual === 'carrera' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Modificar Carrera</h1>
                            <p className="text-gray-500 mt-1">Edite la información general de la carrera</p>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                            <Button onClick={handleGuardarCambiosCarrera}>Guardar Cambios</Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Datos de la Carrera */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre de la Carrera</label>
                                <Input value={carrera.nombre} disabled />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Código de Identificación</label>
                                <Input value={carrera.codigo} disabled />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Departamento Responsable *</label>
                                <Select value={departamento} onValueChange={setDepartamento}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departamentosDisponibles.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Columna Derecha: Descripción y Plan de Estudios */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descripción de la Carrera *</label>
                                <Textarea 
                                    value={descripcion} 
                                    onChange={(e) => setDescripcion(e.target.value)} 
                                    rows={8}
                                    placeholder="La carrera de..."
                                />
                            </div>
                             <Card>
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold">Plan de Estudios</h3>
                                        <p className="text-sm text-gray-500">Gestionar materias y estructura curricular</p>
                                    </div>
                                    <Button variant="outline" onClick={() => setVistaActual('plan')}>
                                        <Edit className="mr-2 h-4 w-4" /> Modificar Plan de Estudio
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            
            {vistaActual === 'plan' && carrera.plan_de_estudio && (
                <ModificarPlanDeEstudios
                    plan={carrera.plan_de_estudio}
                    materiasIniciales={carrera.materias_plan}
                    onVolver={() => setVistaActual('carrera')}
                />
            )}
        </div>
    );
}


// --- Sub-componente para la lógica del Plan de Estudios ---
function ModificarPlanDeEstudios({ plan, materiasIniciales, onVolver }: { plan: any, materiasIniciales: MateriaPlan[], onVolver: () => void }) {
    const [materiasPlan, setMateriasPlan] = useState<MateriaPlan[]>(materiasIniciales);
    const [isSaving, setIsSaving] = useState(false);

    // Estado para "Agregar Materias"
    const [busquedaMateria, setBusquedaMateria] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [materiasDisponibles, setMateriasDisponibles] = useState<MateriaDisponible[]>([]);

    // ... (Las funciones handleBuscarMateria, handleAgregarMateria, handleEliminarMateria no cambian) ...
    const handleBuscarMateria = async () => {
        if (busquedaMateria.trim().length < 3) {
            toast.info('Ingrese al menos 3 caracteres para buscar.');
            return;
        }
        setIsSearching(true);
        const resultados = await buscarMateriasDisponibles(plan.id, busquedaMateria);
        setMateriasDisponibles(resultados);
        setIsSearching(false);
    };

    const handleAgregarMateria = (materia: MateriaDisponible) => {
        if (materiasPlan.some(m => m.materia_id === materia.id)) {
            toast.warning('Esta materia ya se encuentra en el plan.');
            return;
        }
        
        const nuevaMateria: MateriaPlan = {
            plan_materia_id: undefined, 
            plan_id: plan.id,
            materia_id: materia.id,
            anio: 1,
            cuatrimestre: 1,
            codigo_materia: materia.codigo_materia,
            nombre_materia: materia.nombre,
            descripcion_materia: materia.descripcion,
            estudiantes_activos: 0,
        };

        setMateriasPlan(prev => [...prev, nuevaMateria]);
        setMateriasDisponibles([]);
        setBusquedaMateria('');
        toast.success(`${materia.nombre} fue agregada al plan. Guarde los cambios para confirmar.`);
    };

    const handleEliminarMateria = (idMateriaAEliminar: number | undefined, nombreMateria: string) => {
        setMateriasPlan(prev => prev.filter(m => {
            if (idMateriaAEliminar) {
                return m.plan_materia_id !== idMateriaAEliminar;
            }
            return m.nombre_materia !== nombreMateria;
        }));
        toast.info(`${nombreMateria} fue quitada del plan. Guarde los cambios para confirmar.`);
    };

    const handleGuardarCambios = async () => {
        setIsSaving(true);
        
        const materiasAAgregar = materiasPlan
            .filter(m => m.plan_materia_id === undefined)
            .map(m => ({
                materia_id: m.materia_id,
                anio: m.anio,
                cuatrimestre: m.cuatrimestre,
            }));

        const idsMateriasActuales = new Set(materiasPlan.map(m => m.plan_materia_id).filter(Boolean));
        const planMateriaIdsAEliminar = materiasIniciales
            .filter(m => m.plan_materia_id && !idsMateriasActuales.has(m.plan_materia_id))
            .map(m => m.plan_materia_id as number);
            
        if (materiasAAgregar.length === 0 && planMateriaIdsAEliminar.length === 0) {
            toast.info("No hay cambios para guardar.");
            setIsSaving(false);
            return;
        }
        
        const result = await actualizarPlanDeEstudios(plan.id, materiasAAgregar, planMateriaIdsAEliminar);

        // --- CORRECCIÓN 1 ---
        if ('error' in result && result.error) {
            toast.error(result.error);
        } else {
            toast.success('¡Plan de estudios actualizado con éxito!');
            onVolver();
        }
        setIsSaving(false);
    };

    const materiasAgrupadas = materiasPlan.reduce((acc, materia) => {
        const anio = materia.anio || 1; // Usar 1 como default si el año es 0 o null
        if (!acc[anio]) acc[anio] = [];
        acc[anio].push(materia);
        return acc;
    }, {} as Record<number, MateriaPlan[]>);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 {/* ... (código del header sin cambios) ... */}
                 <div>
                    <h1 className="text-3xl font-bold">Modificar Plan de Estudios</h1>
                    <p className="text-gray-500 mt-1">{plan.nombre}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onVolver} disabled={isSaving}>
                       <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Carrera
                    </Button>
                    <Button variant="destructive" disabled>Borrar Plan de Estudio</Button>
                    <Button onClick={handleGuardarCambios} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Principal: Materias del Plan */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Materias del Plan Actual</CardTitle></CardHeader>
                        <CardContent>
                            {Object.keys(materiasAgrupadas).sort((a,b) => Number(a) - Number(b)).map(anio => (
                                <div key={anio} className="mb-6">
                                    <h3 className="font-bold text-lg mb-2 border-b pb-2">{`Año ${anio}`}</h3>
                                    <div className="space-y-3">
                                        {/* --- CORRECCIÓN 2 --- */}
                                        {materiasAgrupadas[Number(anio)].map((m: MateriaPlan) => (
                                            <div key={m.plan_materia_id || m.materia_id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-semibold">{`${m.codigo_materia} - ${m.nombre_materia}`}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {m.estudiantes_activos > 0 ? `${m.estudiantes_activos} estudiantes activos` : 'Sin estudiantes activos'}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="icon" disabled={m.estudiantes_activos > 0} onClick={() => handleEliminarMateria(m.plan_materia_id, m.nombre_materia)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {materiasPlan.length === 0 && <p className="text-center text-gray-500 py-4">No hay materias en este plan.</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Herramientas */}
                <div className="space-y-6">
                     {/* ... (código de la columna derecha sin cambios) ... */}
                     <Card>
                        <CardHeader><CardTitle>Agregar Materias</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Buscar por ID o Nombre" 
                                    value={busquedaMateria}
                                    onChange={(e) => setBusquedaMateria(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarMateria()}
                                />
                                <Button size="icon" onClick={handleBuscarMateria} disabled={isSearching}>
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                                </Button>
                            </div>
                            <p className="text-sm font-semibold">Materias Disponibles</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                               {materiasDisponibles.length > 0 ? (
                                    materiasDisponibles.map(m => (
                                        <div key={m.id} className="p-2 border rounded flex justify-between items-center text-sm">
                                            <span>{m.codigo_materia} - {m.nombre}</span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAgregarMateria(m)}>
                                                <Plus className="h-4 w-4 text-green-600"/>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-2">No se encontraron materias o no hay búsqueda activa.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Gestión de Correlatividades</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500">Funcionalidad en desarrollo.</p>
                             <Select disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar materia..." />
                                </SelectTrigger>
                            </Select>
                            <div className="flex gap-2">
                                <Button className="w-full" disabled>Agregar Correlativa</Button>
                                <Button className="w-full" variant="outline" disabled>Quitar Correlativa</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}