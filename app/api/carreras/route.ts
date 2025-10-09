import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data');
const CARRERAS_FILE = path.join(DATA_PATH, 'carreras.json');

// Función segura para leer el archivo de carreras
function getCarreras() {
  try {
    if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);
    if (!fs.existsSync(CARRERAS_FILE)) fs.writeFileSync(CARRERAS_FILE, JSON.stringify([]));
    
    const raw = fs.readFileSync(CARRERAS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading or parsing carreras.json:", error);
    fs.writeFileSync(CARRERAS_FILE, JSON.stringify([]));
    return [];
  }
}

// GET - Obtener todas las carreras
export async function GET() {
  const carreras = getCarreras();
  return NextResponse.json(carreras);
}

// POST - Crear una nueva carrera
export async function POST(req: Request) {
  const body = await req.json();
  const { nombre, codigo, departamento, planDeEstudiosId } = body;

  if (!nombre) {
    return NextResponse.json({ error: 'El nombre de la carrera es obligatorio.' }, { status: 400 });
  }
  if (!codigo) {
    return NextResponse.json({ error: 'El código de identificación no se pudo generar.' }, { status: 400 });
  }
  if (!departamento) {
    return NextResponse.json({ error: 'El departamento es obligatorio.' }, { status: 400 });
  }
  if (!planDeEstudiosId) {
    return NextResponse.json({ error: 'El plan de estudios es obligatorio.' }, { status: 400 });
  }

  const carreras = getCarreras();

  if (carreras.find((c: any) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    return NextResponse.json({ error: `La carrera con el nombre "${nombre}" ya existe.` }, { status: 400 });
  }
  if (carreras.find((c: any) => c.codigo === codigo)) {
    return NextResponse.json({ error: `El código de identificación "${codigo}" ya está en uso.` }, { status: 400 });
  }
  
  const nuevaCarrera = { 
    ...body, 
    createdAt: new Date().toISOString() 
  };
  carreras.push(nuevaCarrera);
  
  fs.writeFileSync(CARRERAS_FILE, JSON.stringify(carreras, null, 2));

  return NextResponse.json(nuevaCarrera, { status: 201 });
}