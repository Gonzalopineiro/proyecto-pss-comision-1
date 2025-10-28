'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerDetallesCompletosCarrera, actualizarCarrera, obtenerDepartamentos } from '@/app/dashboard/administrativo/crear-carrera/actions';

// Importa los componentes UI que necesites
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Asumiendo que tienes este componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Plus, Search } from 'lucide-react';

// Tipos de datos para el estado
type CarreraDetalles = Awaited<ReturnType<typeof obtenerDetallesCompletosCarrera>>;
type MateriaPlan = NonNullable<CarreraDetalles>['materias_plan'][0];

// --- Componente principal de la página ---
export default function ModificarCarreraPage() {
    const params = useParams();
    const router = useRouter();
    const carreraId = Number(params.id);

    const [carrera, setCarrera] = useState<CarreraDetalles>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [vistaActual, setVistaActual] = useState<'carrera' | 'plan'>('carrera');
    
    // Estados para el formulario de Carrera
    const [departamento, setDepartamento] = useState('');
    const [descripcion, setDescripcion] = useState(''); // Asumiendo que hay descripción
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
                // setDescripcion(data.descripcion || ''); // Descomentar si tienes descripción
            }
            setIsLoading(false);
        }
        cargarDatos();
    }, [carreraId]);
    
    const handleGuardarCambiosCarrera = async () => {
        const result = await actualizarCarrera(carreraId, { departamento });
        if ('error' in result && result.error) {
            alert(result.error);
        } else {
            alert('Carrera actualizada con éxito');
        }
    };
    
    if (isLoading) {
        return <div className="container mx-auto py-8">Cargando...</div>;
    }

    if (!carrera) {
        return <div className="container mx-auto py-8">Carrera no encontrada.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            {/* --- Vista para Modificar Carrera --- */}
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
            
            {/* --- Vista para Modificar Plan de Estudios --- */}
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
    const [materiasPlan, setMateriasPlan] = useState(materiasIniciales);

    const materiasAgrupadas = materiasPlan.reduce((acc, materia) => {
        const anio = materia.anio || 0;
        if (!acc[anio]) {
            acc[anio] = [];
        }
        acc[anio].push(materia);
        return acc;
    }, {} as Record<number, MateriaPlan[]>);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Modificar Plan de Estudios</h1>
                    <p className="text-gray-500 mt-1">{plan.nombre}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onVolver}>
                       <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Carrera
                    </Button>
                    <Button variant="destructive">Borrar Plan de Estudio</Button>
                    <Button>Guardar Cambios</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Principal: Materias del Plan */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Materias del Plan Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(materiasAgrupadas).sort().map(anio => (
                                <div key={anio} className="mb-6">
                                    <h3 className="font-bold text-lg mb-2 border-b pb-2">
                                        {`Año ${anio}`}
                                    </h3>
                                    <div className="space-y-3">
                                        {/* --- INICIO DE LA CORRECCIÓN --- */}
                                        {/* Añadimos explícitamente el tipo (m: MateriaPlan) */}
                                        {materiasAgrupadas[Number(anio)].map((m: MateriaPlan) => (
                                        // --- FIN DE LA CORRECCIÓN ---
                                            <div key={m.plan_materia_id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-semibold">{`${m.codigo_materia} - ${m.nombre_materia}`}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {`${m.estudiantes_activos} estudiantes activos`}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" disabled={m.estudiantes_activos > 0}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Herramientas */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Agregar Materias</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="Buscar por ID. Ej: MAT102" />
                                <Button size="icon"><Search className="h-4 w-4"/></Button>
                            </div>
                            <p className="text-sm font-semibold">Materias Disponibles</p>
                            <div className="space-y-2">
                                {/* Lista de materias encontradas... */}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Gestión de Correlatividades</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar materia..." />
                                </SelectTrigger>
                                <SelectContent>{/* ... */}</SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button className="w-full">Agregar Correlativa</Button>
                                <Button className="w-full" variant="outline">Quitar Correlativa</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}