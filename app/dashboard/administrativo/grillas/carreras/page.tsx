'use client';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { obtenerCarreras, type CarreraCompleta } from '@/app/dashboard/administrativo/crear-carrera/actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { CarreraActions } from './carrera-actions'; 

export default function CarrerasPage() {
  const [todasLasCarreras, setTodasLasCarreras] = useState<CarreraCompleta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [facultadFilter, setFacultadFilter] = useState('todas');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function cargarCarreras() {
      try {
        const carrerasObtenidas = await obtenerCarreras() || [];
        setTodasLasCarreras(carrerasObtenidas);
      } catch (error) {
        console.error("Error al cargar las carreras:", error);
      } finally {
        setIsLoading(false);
      }
    }
    cargarCarreras();
  }, []);
  const handleCarreraEliminada = (idCarreraEliminada: number) => {
    setTodasLasCarreras(prevCarreras => 
      prevCarreras.filter(carrera => carrera.id !== idCarreraEliminada)
    );
  };

  const facultades = useMemo(() => {
    const set = new Set(todasLasCarreras.map(c => c.departamento).filter(Boolean));
    return Array.from(set) as string[];
  }, [todasLasCarreras]);

  const filteredCarreras = useMemo(() => {
    return todasLasCarreras.filter(carrera => {
      const searchMatch = searchTerm.length > 0
        ? carrera.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          carrera.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const estadoMatch = estadoFilter === 'todos'
        ? true
        : estadoFilter === 'activo'
          ? carrera.inscriptos > 0
          : carrera.inscriptos === 0;

      const facultadMatch = facultadFilter === 'todas'
        ? true
        : carrera.departamento === facultadFilter;

      return searchMatch && estadoMatch && facultadMatch;
    });
  }, [todasLasCarreras, searchTerm, estadoFilter, facultadFilter]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Lista de Carreras</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={facultadFilter} onValueChange={setFacultadFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por facultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las facultades</SelectItem>
                  {facultades.map(facultad => (
                    <SelectItem key={facultad} value={facultad}>
                      {facultad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Link href="/dashboard/administrativo/crear-carrera" passHref>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Nueva Carrera
                </Button>
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            Mostrando {filteredCarreras.length} de {todasLasCarreras.length} carreras
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader></TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Cargando carreras...
                    </TableCell>
                  </TableRow>
                ) : filteredCarreras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron carreras con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCarreras.map((carrera) => {
                    const tieneInscriptos = carrera.inscriptos > 0;
                    return (
                      <TableRow key={carrera.id}>                        
                        <TableCell>
                          <div className="font-medium">{carrera.nombre}</div>
                          <div className="text-sm text-gray-500">
                            Código: {carrera.codigo}
                          </div>
                        </TableCell>
                        <TableCell>{carrera.departamento || 'N/A'}</TableCell>
                        <TableCell>{carrera.duracion || 'No definida'}</TableCell>
                        <TableCell>{carrera.inscriptos}</TableCell>
                        <TableCell>
                          <Badge
                            variant={tieneInscriptos ? 'default' : 'destructive'}
                            className={
                              tieneInscriptos
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {tieneInscriptos ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">                         
                          <CarreraActions 
                            carrera={carrera} 
                            onCarreraEliminada={handleCarreraEliminada} 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}