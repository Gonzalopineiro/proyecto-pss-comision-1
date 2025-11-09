# 📋 Lista de Inscriptos - Implementación Basada en Estructura Real

## 🎯 **Objetivo**
Generar la lista de alumnos inscriptos a una cursada específica mediante la selección de:
- **Carrera** (obligatorio)
- **Materia** (obligatorio) 
- **Año** (obligatorio)
- **Cuatrimestre** (obligatorio)

---

## 📊 **Estructura de Datos Identificada**

### **Flujo de Relaciones:**
```
carreras → plan_de_estudio → plan_materia → materias
                                            ↓
docentes → materia_docente ←---------------┘
              ↓
         cursadas (año, cuatrimestre, estado)
              ↓
    inscripciones_cursada → usuarios (via auth/Roles)
```

### **Tablas Clave:**

1. **`cursadas`**
   - `id`: ID único de la cursada
   - `materia_docente_id`: FK a materia_docente
   - `anio`: Año de la cursada (smallint)
   - `cuatrimestre`: 1 o 2 (smallint)
   - `estado`: 'activa', 'finalizada', 'cancelada'

2. **`materia_docente`**
   - `id`: ID único
   - `docente_id`: UUID del docente
   - `materia_id`: ID de la materia

3. **`inscripciones_cursada`**
   - `cursada_id`: FK a cursadas
   - `alumno_id`: Identificador del alumno (puede ser UUID o legajo)
   - `estado`: Estado de la inscripción

---

## 🔍 **Algoritmo de Búsqueda Implementado**

### **Paso 1: Validación de Filtros**
- Todos los campos (carrera, materia, año, cuatrimestre) son **obligatorios**
- El cuatrimestre se convierte de string ("1"/"2") a número

### **Paso 2: Encontrar Relación Materia-Docente**
```typescript
// Si es docente: solo sus materias
// Si es administrativo: cualquier materia
const materiaDocente = await supabase
  .from('materia_docente')
  .select('id')
  .eq('materia_id', materiaId)
  .eq('docente_id', docenteId) // Solo si es docente
```

### **Paso 3: Buscar Cursada Activa**
```typescript
const cursada = await supabase
  .from('cursadas')
  .select('id')
  .eq('materia_docente_id', materiaDocenteId)
  .eq('anio', anio)
  .eq('cuatrimestre', cuatrimestre)
  .eq('estado', 'activa')
  .single()
```

### **Paso 4: Obtener Inscripciones**
```typescript
const inscripciones = await supabase
  .from('inscripciones_cursada')
  .select('alumno_id, estado')
  .eq('cursada_id', cursadaId)
```

### **Paso 5: Resolver Datos de Alumnos**
- **Problema**: `alumno_id` puede ser UUID (auth.users) o legajo
- **Solución**: Intentar múltiples estrategias:
  1. Buscar en `usuarios` por `auth_user_id` (si existe esa columna)
  2. Usar tabla `Roles` como puente: UUID → email → legajo → usuarios
  3. Fallback a búsqueda directa por legajo

---

## 🚧 **Puntos Críticos a Resolver**

### **1. Relación alumno_id → usuarios**
**Problema**: No está claro cómo se relaciona `inscripciones_cursada.alumno_id` con `usuarios`

**Posibles escenarios:**
- `alumno_id` es UUID de `auth.users.id`
- `alumno_id` es el legajo directamente
- Se usa tabla `Roles` como puente

**Solución implementada**: Sistema de fallback que intenta todas las opciones

### **2. Estructura de la tabla usuarios**
**Necesitamos confirmar**:
- ¿Existe columna `auth_user_id` en usuarios?
- ¿Cómo se relaciona con `auth.users`?
- ¿Qué campos tiene exactamente?

---

## 🎛️ **Configuración del Frontend**

### **Campos Obligatorios:**
- ✅ Carrera: Lista desde `carreras`
- ✅ Materia: Filtrada por carrera y rol del usuario
- ✅ Año: Últimos 5 años 
- ✅ Cuatrimestre: 1 o 2

### **Validación:**
- Todos los campos deben estar seleccionados antes de buscar
- Error claro si falta algún campo
- Materias se cargan dinámicamente según carrera

### **UX Mejorado:**
- Materias deshabilitadas hasta seleccionar carrera
- Indicadores de campos obligatorios (*)
- Loading states apropiados

---

## 🔧 **Próximos Pasos para Completar**

### **1. Verificar Estructura Real**
Ejecutar estas consultas en Supabase para entender la estructura:

```sql
-- Ver estructura de inscripciones_cursada
SELECT * FROM inscripciones_cursada LIMIT 3;

-- Ver estructura de usuarios  
SELECT * FROM usuarios LIMIT 3;

-- Ver estructura de Roles
SELECT * FROM "Roles" LIMIT 3;

-- Verificar si existe relación auth_user_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios';
```

### **2. Ajustar Función de Búsqueda**
Basado en los resultados anteriores, ajustar el método de resolución de `alumno_id → usuarios`

### **3. Probar Casos Reales**
- Crear una cursada de prueba
- Inscribir algunos usuarios
- Verificar que la búsqueda funcione

---

## 🚀 **Estado Actual**

### **✅ Completado:**
- Frontend con validación de campos obligatorios
- Estructura base de búsqueda implementada
- Sistema de fallback para resolver relaciones
- Funciones de exportación actualizadas

### **⏳ Pendiente:**
- Verificación de estructura real de la BD
- Ajuste fino de la relación `alumno_id → usuarios`
- Testing con datos reales

### **🎯 Ready for Testing:**
La implementación está lista para probar una vez que se verifique la estructura exacta de las tablas en la base de datos.

---

## 📞 **Siguiente Acción**
**Probar la funcionalidad actual:**
1. Ir a `dashboard/docente/lista-inscriptos`
2. Seleccionar todos los campos obligatorios
3. Hacer clic en "Buscar Inscriptos"
4. Revisar logs en consola para ver exactamente qué está pasando
5. Reportar los resultados para ajustar la lógica según la estructura real