import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un código único de verificación para certificados
 * Formato: AAAA + 6 caracteres alfanuméricos aleatorios (10 caracteres total)
 * @returns Código de verificación de 10 caracteres
 */
export function generateVerificationCode(): string {
  // Obtener el año actual (4 dígitos)
  const year = new Date().getFullYear().toString()
  
  // Definir caracteres alfanuméricos disponibles (sin 0, O, I, l para evitar confusiones)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"
  
  // Generar 6 caracteres aleatorios
  let randomPart = ""
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Retornar el código completo
  return year + randomPart
}