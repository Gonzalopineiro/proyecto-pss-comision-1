'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Importamos TODAS las actions que vamos a necesitar
import { 
    obtenerDetallesCompletosCarrera, 
    actualizarCarrera, 
    obtenerDepartamentos 
} from '@/app/dashboard/administrativo/crear-carrera/actions';
import { buscarMateriaPorCodigo } from '@/app/dashboard/administrativo/crear-materia/actions';
import { asociarMateriaAPlan, desasociarMateriaDePlan } from '@/app/dashboard/administrativo/crear-plan/actions';
import { obtenerCorrelativasCursado } from '@/app/dashboard/administrativo/crear-plan/correlatividades';

// Importa tus componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Plus, Search, FileWarning } from 'lucide-react';

// Define los tipos de datos que usaremos
type CarreraDetalles = Awaited<ReturnType<typeof obtenerDetallesCompletosCarrera>>;
type MateriaPlan = NonNullable<CarreraDetalles>['materias_plan'][0];
type Materia = Awaited<ReturnType<typeof buscarMateriaPorCodigo>>;

// --- Componente de la página completa ---
export default function ModificarCarreraPage() {
    const params = useParams();
    const carreraId = Number(params.id);

    // --- ESTADOS PRINCIPALES ---
    const [carrera, setCarrera] = useState<CarreraDetalles>(null);
    const [departamentosDisponibles, setDepartamentosDisponibles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Estado para mostrar "Cargando..."
    const [error, setError] = useState<string | null>(null); // Estado para manejar errores

    const [vistaActual, setVistaActual] = useState<'carrera' | 'plan'>('carrera');
    
    // Estados para el formulario de la carrera
    const [departamento, setDepartamento] = useState('');
    const [descripcion, setDescripcion] = useState('');

    // --- CARGA DE DATOS INICIAL ---
    useEffect(() => {
        // Esta función se ejecutará una sola vez cuando el componente se monte en el navegador
        const cargarDatosIniciales = async () => {
            if (isNaN(carreraId)) {
                setError('El ID de la carrera no es válido.');
                setIsLoading(false);
                return;
            }

            try {
                // Hacemos las llamadas al servidor en paralelo para más eficiencia
                const [carreraData, deptosData] = await Promise.all([
                    obtenerDetallesCompletosCarrera(carreraId),
                    obtenerDepartamentos()
                ]);

                if (!carreraData) {
                    setError('La carrera no fue encontrada.');
                } else {
                    setCarrera(carreraData);
                    setDepartamentosDisponibles(deptosData);
                    // Inicializamos los estados del formulario con los datos recibidos
                    setDepartamento(carreraData.departamento || '');
                }
            } catch (err) {
                console.error(err);
                setError('Ocurrió un error al cargar los datos de la carrera.');
            } finally {
                // Cuando todo termina (con éxito o error), dejamos de mostrar "Cargando..."
                setIsLoading(false);
            }
        };

        cargarDatosIniciales();
    }, [carreraId]); // Se ejecuta si el ID de la carrera cambia

    // --- RENDERIZADO CONDICIONAL ---
    if (isLoading) {
        return <div className="container mx-auto py-8 text-center">Cargando datos de la carrera...</div>;
    }

    if (error) {
        return <div className="container mx-auto py-8 text-center text-red-600">{error}</div>;
    }

    if (!carrera) {
        // Este caso es por si la carga termina sin error pero sin datos
        return <div className="container mx-auto py-8 text-center">No se encontraron datos para la carrera.</div>;
    }

    // Si todo salió bien, mostramos el contenido principal
    return (
        <div className="container mx-auto py-8">
            {vistaActual === 'carrera' && (
                <div>
                  {/* ... Pega aquí todo el JSX de la vista 'Modificar Carrera' ... */}
                  {/* Tu JSX actual de la vista carrera es correcto y no necesita cambios. */}
                </div>
            )}
            
            {vistaActual === 'plan' && (
                carrera.plan_de_estudio ? (
                    <ModificarPlanDeEstudios
                        plan={carrera.plan_de_estudio}
                        materiasIniciales={carrera.materias_plan}
                        onVolver={() => setVistaActual('carrera')}
                    />
                ) : (
                    <div> {/* ... El JSX para plan no encontrado no cambia ... */} </div>
                )
            )}
        </div>
    );
}


// --- El sub-componente para el Plan de Estudios se queda aquí ---
// No necesita cambios, ya que la lógica interactiva que tiene es correcta.
function ModificarPlanDeEstudios({ plan, materiasIniciales, onVolver }: { plan: any, materiasIniciales: MateriaPlan[], onVolver: () => void }) {
    // ... Todo el código de tu sub-componente ModificarPlanDeEstudios va aquí ...
    // ... con sus propios estados para búsqueda de materias, correlatividades, etc. ...
    const [materiasPlan, setMateriasPlan] = useState(materiasIniciales);
    // ... El resto de tus estados y funciones
    
    return (
      <div>{/* ... Tu JSX del plan de estudios ... */}</div>
    )
}