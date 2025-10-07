import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data')
const FILE = path.join(DATA_PATH, 'materias.json')

function ensureDataFile(){
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH)
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]))
}

export async function GET(){
  ensureDataFile()
  const raw = fs.readFileSync(FILE, 'utf8')
  const materias = JSON.parse(raw)
  return NextResponse.json(materias)
}

export async function POST(req: Request){
  ensureDataFile()
  const body = await req.json()
  const { codigo, nombre, descripcion, duracion } = body

  if (!nombre || !descripcion || !duracion) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const raw = fs.readFileSync(FILE, 'utf8')
  const materias = JSON.parse(raw)

  // validar unicidad codigo y nombre
  if (materias.find((m: any) => m.codigo === codigo)) {
    return NextResponse.json({ error: 'Código ya existe' }, { status: 400 })
  }
  if (materias.find((m: any) => m.nombre.toLowerCase() === nombre.toLowerCase())) {
    return NextResponse.json({ error: 'Nombre de materia ya existe' }, { status: 400 })
  }

  const nueva = { codigo, nombre, descripcion, duracion, createdAt: new Date().toISOString() }
  materias.push(nueva)
  fs.writeFileSync(FILE, JSON.stringify(materias, null, 2))

  return NextResponse.json(nueva, { status: 201 })
}
