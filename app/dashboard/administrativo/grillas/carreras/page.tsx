import { obtenerCarreras } from '@/app/dashboard/administrativo/crear-carrera/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { CarreraActions } from './carrera-actions'; // Componente cliente para las acciones

export const revalidate = 0;

export default async function CarrerasPage() {
  const carreras = await obtenerCarreras() || [];
  const totalCarreras = carreras.length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Lista de Carreras</h1>
        <Link href="/dashboard/administrativo/crear-carrera">
          <Button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
            <Plus size={16} /> Crear Carrera
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar carreras..." className="pl-8" />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
               <span className="text-sm text-gray-500">
                Mostrando {totalCarreras} de {totalCarreras} carreras
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Facultad</TableHead>
                  <TableHead>Estudiantes Activos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carreras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay carreras registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  carreras.map((carrera) => {
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
                          {/* Componente Cliente para manejar el estado del diálogo */}
                          <CarreraActions carrera={carrera} />
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
       {/* Aquí iría la paginación si fuera necesaria */}
    </div>
  );
}