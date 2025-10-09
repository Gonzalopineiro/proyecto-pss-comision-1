import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data');
const DEPARTAMENTOS_FILE = path.join(DATA_PATH, 'departamentos.json');

// Función segura para leer el archivo de departamentos
function getDepartamentos() {
  try {
    if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);
    if (!fs.existsSync(DEPARTAMENTOS_FILE)) {    
      fs.writeFileSync(DEPARTAMENTOS_FILE, JSON.stringify([]));
      return [];
    }
    
    const raw = fs.readFileSync(DEPARTAMENTOS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading or parsing departamentos.json:", error);    
    return [];
  }
}

// GET - Obtener todos los departamentos
export async function GET() {
  const departamentos = getDepartamentos();
  return NextResponse.json(departamentos);
}