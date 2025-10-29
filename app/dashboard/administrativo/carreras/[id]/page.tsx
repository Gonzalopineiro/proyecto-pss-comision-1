'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    obtenerDetallesCompletosCarrera, 
    actualizarCarrera, 
    obtenerDepartamentos,
    buscarMateriasDisponibles,
    actualizarPlanDeEstudios,
    obtenerMateriasDisponiblesParaPlan,
    obtenerCorrelatividades,
    agregarCorrelativa,
    quitarCorrelativa
} from '@/app/dashboard/administrativo/crear-carrera/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Plus, Search, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

type CarreraDetalles = Awaited<ReturnType<typeof obtenerDetallesCompletosCarrera>>;
type MateriaPlan = NonNullable<CarreraDetalles>['materias_plan'][0] & { plan_materia_id?: number };
type MateriaDisponible = Awaited<ReturnType<typeof buscarMateriasDisponibles>>[0];

type MateriaPendiente = {
    materia: MateriaDisponible;
    anio: string;
};

export default function ModificarCarreraPage() {
    const params = useParams();
    const router = useRouter();
    const carreraId = Number(params.id);

    const [carrera, setCarrera] = useState<CarreraDetalles>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [vistaActual, setVistaActual] = useState<'carrera' | 'plan'>('carrera');
    
    const [departamento, setDepartamento] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [departamentosDisponibles, setDepartamentosDisponibles] = useState<string[]>([]);
    const [isSavingCarrera, setIsSavingCarrera] = useState(false);

    const cargarDatosCarrera = async () => {
        setIsLoading(true);
        const data = await obtenerDetallesCompletosCarrera(carreraId);
        
        if (departamentosDisponibles.length === 0) {
            const deptos = await obtenerDepartamentos();
            setDepartamentosDisponibles(deptos);
        }
        
        setCarrera(data);
        if (data) {
            setDepartamento(data.departamento || '');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!carreraId) return;
        cargarDatosCarrera();
    }, [carreraId]);
    
    const handleGuardarCambiosCarrera = async () => {
        setIsSavingCarrera(true);
        const result = await actualizarCarrera(carreraId, { departamento, descripcion });
        if (result && 'error' in result) {
            toast.error(result.error);
        } else {
            toast.success('Cambio guardado con éxito.');
        }
        setIsSavingCarrera(false);
    };
    
    if (isLoading) {
        return <div className="container mx-auto py-8 text-center"> <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" /> Cargando...</div>;
    }

    if (!carrera) {
        return <div className="container mx-auto py-8">Carrera no encontrada.</div>;
    }

    return (
        <div className="container mx-auto py-8">
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
                            <Button onClick={handleGuardarCambiosCarrera} disabled={isSavingCarrera}>
                                {isSavingCarrera && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    onGuardadoExitoso={cargarDatosCarrera}
                />
            )}
        </div>
    );
}

function ModificarPlanDeEstudios({ plan, materiasIniciales, onVolver, onGuardadoExitoso }: { plan: any, materiasIniciales: MateriaPlan[], onVolver: () => void, onGuardadoExitoso: () => Promise<void> }) {
const [materiasPlan, setMateriasPlan] = useState<MateriaPlan[]>(materiasIniciales);
const [isSaving, setIsSaving] = useState(false);
const [busquedaMateria, setBusquedaMateria] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [materiasDisponibles, setMateriasDisponibles] = useState<MateriaDisponible[]>([]);
const [isLoadingDisponibles, setIsLoadingDisponibles] = useState(true);
const [materiasPendientes, setMateriasPendientes] = useState<MateriaPendiente[]>([]);

const [selectedMateriaId, setSelectedMateriaId] = useState<string>('');
const [correlativasCursado, setCorrelativasCursado] = useState<Array<{ correlativa_id: number; materia: any }>>([]);
const [correlativasFinal, setCorrelativasFinal] = useState<Array<{ correlativa_id: number; materia: any }>>([]);
const [isLoadingCorrelativas, setIsLoadingCorrelativas] = useState(false);
const [materiaParaAgregar, setMateriaParaAgregar] = useState<string>('');

const duracionString = plan.duracion || '6';
const match = duracionString.match(/\d+/);
const maxAnios = match ? parseInt(match[0], 10) : 6;
const aniosDisponibles = Array.from({ length: maxAnios }, (_, i) => i + 1);

useEffect(() => {
    setMateriasPlan(materiasIniciales);
}, [materiasIniciales]);

useEffect(() => {
    if (materiasIniciales && materiasIniciales.length > 0) {
        setSelectedMateriaId(String(materiasIniciales[0].materia_id));
    } else {
        setSelectedMateriaId('');
    }
}, [materiasIniciales]);

const cargarMateriasDisponibles = async () => {
    setIsLoadingDisponibles(true);
    const resultados = await obtenerMateriasDisponiblesParaPlan(plan.id);
    setMateriasDisponibles(resultados);
    setIsLoadingDisponibles(false);
};

useEffect(() => {
    cargarMateriasDisponibles();
}, [plan.id]);

const handleBuscarMateria = async () => {
    if (busquedaMateria.trim().length < 2) {
        toast.info('Ingrese al menos 2 caracteres para buscar.');
        return;
    }
    setIsSearching(true);
    const resultados = await buscarMateriasDisponibles(plan.id, busquedaMateria);
    setMateriasDisponibles(resultados);
    setIsSearching(false);
};

const handleMoverAPendientes = (materia: MateriaDisponible) => {
    setMateriasPendientes(prev => [...prev, { materia: materia, anio: '1' }]);
    setMateriasDisponibles(prev => prev.filter(m => m.id !== materia.id));
};

const handleAnioPendienteChange = (materiaId: number, nuevoAnio: string) => {
    setMateriasPendientes(prev => 
        prev.map(p => 
            p.materia.id === materiaId ? { ...p, anio: nuevoAnio } : p
        )
    );
};

const handleConfirmarAgregarMateria = (materiaPendiente: MateriaPendiente) => {
    const nuevaMateria: MateriaPlan = {
        plan_materia_id: undefined,
        plan_id: plan.id,
        materia_id: materiaPendiente.materia.id,
        anio: Number(materiaPendiente.anio),
        cuatrimestre: 1,
        codigo_materia: materiaPendiente.materia.codigo_materia,
        nombre_materia: materiaPendiente.materia.nombre,
        descripcion_materia: materiaPendiente.materia.descripcion || '',
        estudiantes_activos: 0,
    };
    
    setMateriasPlan(prev => [...prev, nuevaMateria].sort((a,b) => (a.anio || 0) - (b.anio || 0)));
    setMateriasPendientes(prev => prev.filter(p => p.materia.id !== materiaPendiente.materia.id));
    
    toast.success(`"${nuevaMateria.nombre_materia}" agregada al Año ${nuevaMateria.anio}.`);
};

const handleCancelarPendiente = (materiaPendiente: MateriaPendiente) => {
    setMateriasPendientes(prev => prev.filter(p => p.materia.id !== materiaPendiente.materia.id));
    setMateriasDisponibles(prev => [...prev, materiaPendiente.materia].sort((a,b) => a.nombre.localeCompare(b.nombre)));
};

const handleEliminarMateria = (idMateriaAEliminar: number | undefined, nombreMateria: string) => {
    setMateriasPlan(prev => prev.filter(m => {
        if (idMateriaAEliminar) return m.plan_materia_id !== idMateriaAEliminar;
        return m.nombre_materia !== nombreMateria;
    }));
    toast.info(`${nombreMateria} fue quitada del plan.`);
};

const handleGuardarCambios = async () => {
    setIsSaving(true);
    const materiasAAgregar = materiasPlan
        .filter(m => m.plan_materia_id === undefined)
        .map(m => ({ materia_id: m.materia_id, anio: m.anio, cuatrimestre: m.cuatrimestre }));

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

    if ('error' in result && result.error) {
        toast.error(result.error);
    } else {
        toast.success('¡Plan de estudios actualizado con éxito!');
        await onGuardadoExitoso();
        await cargarMateriasDisponibles();
    }
    setIsSaving(false);
};

const materiasAgrupadas = materiasPlan.reduce((acc, materia) => {
    const anio = materia.anio || 1;
    if (!acc[anio]) acc[anio] = [];
    acc[anio].push(materia);
    return acc;
}, {} as Record<number, MateriaPlan[]>);

const cargarCorrelatividades = async (materiaIdStr?: string) => {
    const materiaIdNum = materiaIdStr ? Number(materiaIdStr) : (selectedMateriaId ? Number(selectedMateriaId) : null);
    if (!materiaIdNum) {
        setCorrelativasCursado([]);
        setCorrelativasFinal([]);
        return;
    }
    setIsLoadingCorrelativas(true);
    const res = await obtenerCorrelatividades(plan.id, materiaIdNum);
    setCorrelativasCursado(res.cursado || []);
    setCorrelativasFinal(res.final || []);
    setIsLoadingCorrelativas(false);
};

useEffect(() => {
    if (selectedMateriaId) cargarCorrelatividades(selectedMateriaId);
}, [selectedMateriaId, plan.id]);

const handleAgregarCorrelativa = async (tipo: 'cursado' | 'final') => {
  try {
    if (!selectedMateriaId || !materiaParaAgregar) {
      toast.info('Seleccione una materia y una correlativa para agregar.');
      return;
    }
    const resp = await fetch('/api/correlativas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        materiaId: Number(selectedMateriaId),
        correlativaId: Number(materiaParaAgregar),
        tipo
      })
    });

    const text = await resp.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch (_){ /* no-json */ }

    if (!resp.ok) {
      console.error('API agregar correlativa -> status', resp.status, 'body:', text);
      toast.error(json?.error || `Error del servidor: ${resp.status}. Revisa consola (Network response).`);
      return;
    }

    toast.success('Correlativa agregada.');
    setMateriaParaAgregar('');
    await cargarCorrelatividades();
  } catch (e: any) {
    console.error('Excepción al agregar correlativa:', e);
    toast.error(`Error inesperado: ${e?.message || String(e)}`);
  }
};

const handleQuitarCorrelativa = async (tipo: 'cursado' | 'final', correlativaId: number) => {
  try {
    if (!selectedMateriaId) return;
    const resp = await fetch('/api/correlativas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        materiaId: Number(selectedMateriaId),
        correlativaId,
        tipo
      })
    });

    const text = await resp.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch (_){ /* no-json */ }

    if (!resp.ok) {
      console.error('API quitar correlativa -> status', resp.status, 'body:', text);
      toast.error(json?.error || `Error del servidor: ${resp.status}. Revisa consola (Network response).`);
      return;
    }

    toast.success('Correlativa eliminada.');
    await cargarCorrelatividades();
  } catch (e: any) {
    console.error('Excepción al quitar correlativa:', e);
    toast.error(`Error inesperado: ${e?.message || String(e)}`);
  }
};

return (
    <div>
        <div className="flex justify-between items-center mb-6">
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
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Materias del Plan Actual</CardTitle></CardHeader>
                    <CardContent>
                        {Object.keys(materiasAgrupadas).length > 0 ? Object.keys(materiasAgrupadas).sort((a,b) => Number(a) - Number(b)).map(anio => (
                            <div key={anio} className="mb-6">
                                <h3 className="font-bold text-lg mb-2 border-b pb-2">{`Año ${anio}`}</h3>
                                <div className="space-y-3">
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
                        )) : <p className="text-center text-gray-500 py-4">No hay materias en este plan.</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Agregar Materias</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Filtrar materias por nombre..." 
                                value={busquedaMateria}
                                onChange={(e) => setBusquedaMateria(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleBuscarMateria()}
                            />
                            <Button size="icon" onClick={handleBuscarMateria} disabled={isSearching}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            </Button>
                        </div>
                        
                        {materiasPendientes.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-semibold text-gray-800">Materias por Confirmar</h4>
                                {materiasPendientes.map(p => (
                                    <div key={p.materia.id} className="p-2 border rounded-md bg-yellow-50/50 space-y-2">
                                        <p className="font-semibold text-sm">{p.materia.nombre}</p>
                                        <div className="flex items-center gap-2">
                                            <Select value={p.anio} onValueChange={(nuevoAnio) => handleAnioPendienteChange(p.materia.id, nuevoAnio)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {aniosDisponibles.map(año => (
                                                        <SelectItem key={año} value={String(año)}>{`${año}º Año`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleCancelarPendiente(p)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleConfirmarAgregarMateria(p)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Separator className="my-4"/>
                            </div>
                        )}

                        <p className="text-sm font-semibold">Materias Disponibles</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                           {isLoadingDisponibles ? (
                               <div className="text-center py-4">
                                   <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400"/>
                                   <p className="text-sm text-gray-500 mt-2">Cargando materias...</p>
                               </div>
                           ) : materiasDisponibles.length > 0 ? (
                                materiasDisponibles.map(m => (
                                    <div key={m.id} className="p-2 border rounded flex justify-between items-center text-sm">
                                        <span className="flex-grow pr-2">{m.codigo_materia} - {m.nombre}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => handleMoverAPendientes(m)}>
                                            <Plus className="h-4 w-4 text-green-600"/>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-2">
                                    No hay más materias disponibles para agregar.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Gestión de Correlatividades</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <Select value={selectedMateriaId} onValueChange={(v) => setSelectedMateriaId(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar materia..." />
                            </SelectTrigger>
                            <SelectContent>
                                {materiasPlan.map(m => (
                                    <SelectItem key={m.materia_id} value={String(m.materia_id)}>{m.codigo_materia} - {m.nombre_materia}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold">Correlativas de Cursado</p>
                            {isLoadingCorrelativas ? <p className="text-xs text-gray-500">Cargando...</p> : (
                                correlativasCursado.length > 0 ? correlativasCursado.map(c => (
                                    <div key={c.correlativa_id} className="flex justify-between items-center border rounded p-2 text-sm">
                                        <div>{c.materia ? `${c.materia.codigo_materia} - ${c.materia.nombre}` : `ID ${c.correlativa_id}`}</div>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleQuitarCorrelativa('cursado', c.correlativa_id)}>
                                            <Trash2 className="h-4 w-4 text-red-500"/>
                                        </Button>
                                    </div>
                                )) : <p className="text-xs text-gray-500">No hay correlativas de cursado.</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold">Correlativas de Final</p>
                            {isLoadingCorrelativas ? <p className="text-xs text-gray-500">Cargando...</p> : (
                                correlativasFinal.length > 0 ? correlativasFinal.map(c => (
                                    <div key={c.correlativa_id} className="flex justify-between items-center border rounded p-2 text-sm">
                                        <div>{c.materia ? `${c.materia.codigo_materia} - ${c.materia.nombre}` : `ID ${c.correlativa_id}`}</div>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleQuitarCorrelativa('final', c.correlativa_id)}>
                                            <Trash2 className="h-4 w-4 text-red-500"/>
                                        </Button>
                                    </div>
                                )) : <p className="text-xs text-gray-500">No hay correlativas de final.</p>
                            )}
                        </div>

                        <Separator />

                        <p className="text-sm font-semibold">Agregar correlativa</p>
                        <Select value={materiaParaAgregar} onValueChange={(v) => setMateriaParaAgregar(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar materia correlativa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {materiasPlan.filter(m => String(m.materia_id) !== selectedMateriaId).map(m => (
                                    <SelectItem key={m.materia_id} value={String(m.materia_id)}>{m.codigo_materia} - {m.nombre_materia}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button className="w-1/2" onClick={() => handleAgregarCorrelativa('cursado')}>Agregar como Cursado</Button>
                            <Button className="w-1/2" onClick={() => handleAgregarCorrelativa('final')}>Agregar como Final</Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);
}
