// RUTA: app/api/planes/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data');
const PLANES_FILE = path.join(DATA_PATH, 'planesDeEstudio.json');

/**
 * Función robusta para leer los planes de estudio.
 * Si el archivo no existe o está vacío/corrupto, devuelve un array vacío.
 */
function getPlanes() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(DATA_PATH);
    }
    if (!fs.existsSync(PLANES_FILE)) {
      fs.writeFileSync(PLANES_FILE, JSON.stringify([]));
    }
    const raw = fs.readFileSync(PLANES_FILE, 'utf8');
    // Si el archivo está vacío, JSON.parse fallará. Lo manejamos en el catch.
    return JSON.parse(raw);
  } catch (error) {
    // Si hay cualquier error de parseo (archivo vacío, JSON mal formado),
    // devolvemos un array vacío como estado seguro por defecto.
    console.error("Error reading or parsing planesDeEstudio.json:", error);
    // Y por si acaso, lo reseteamos a un estado válido.
    fs.writeFileSync(PLANES_FILE, JSON.stringify([]));
    return [];
  }
}

/**
 * @description Obtiene todos los planes de estudio.
 */
export async function GET() {
  const planes = getPlanes();
  return NextResponse.json(planes);
}

/**
 * @description Crea un nuevo plan de estudios.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { codigo, nombre, añoCreacion, carrera, materias } = body;

  // --- VALIDACIÓN MEJORADA Y DETALLADA ---
  if (!nombre) {
    return NextResponse.json({ error: 'El campo "nombre" es obligatorio.' }, { status: 400 });
  }
  if (!añoCreacion) {
    return NextResponse.json({ error: 'El campo "añoCreacion" es obligatorio.' }, { status: 400 });
  }
  // Se mantiene la validación de carrera por ahora, puedes quitarla si no es obligatoria
  if (!carrera) {
    return NextResponse.json({ error: 'El campo "carrera" es obligatorio.' }, { status: 400 });
  }
  if (!materias || materias.length === 0) {
    return NextResponse.json({ error: 'Debe asociar al menos una materia.' }, { status: 400 });
  }

  const planes = getPlanes();

  if (planes.find((p: any) => p.codigo === codigo)) {
    return NextResponse.json({ error: `El código de plan "${codigo}" ya existe.` }, { status: 400 });
  }
  if (planes.find((p: any) => p.nombre.toLowerCase() === nombre.toLowerCase())) {
    return NextResponse.json({ error: `El nombre de plan "${nombre}" ya existe.` }, { status: 400 });
  }
  // --- FIN DE LA VALIDACIÓN ---

  const nuevoPlan = { 
    ...body, 
    createdAt: new Date().toISOString() 
  };
  planes.push(nuevoPlan);
  
  // Escribimos el archivo de vuelta
  fs.writeFileSync(PLANES_FILE, JSON.stringify(planes, null, 2));

  return NextResponse.json(nuevoPlan, { status: 201 });
}