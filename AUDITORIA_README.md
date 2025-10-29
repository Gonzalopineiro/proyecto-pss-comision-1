# 🔍 Sistema de Auditoría - Dashboard Administrativo

## 📋 Descripción

El sistema de auditoría permite a los administradores revisar todos los cambios y modificaciones realizadas en el sistema académico, proporcionando transparencia, trazabilidad y control sobre las operaciones.

## 🎯 Características Principales

### ✅ **Registro Automático de Auditorías**
- Todas las modificaciones de datos se registran automáticamente
- Información detallada sobre qué cambió, quién lo hizo y cuándo
- Sin impacto en el rendimiento del sistema principal

### 🔍 **Búsqueda y Filtrado Avanzado**
- Búsqueda por texto libre
- Filtrado por tipo de acción
- Filtrado por fechas (desde/hasta)
- Filtrado por usuario específico
- Combinación de múltiples filtros

### 📊 **Visualización Completa**
- Tabla paginada con información clave
- Modal de detalles con información completa
- Códigos de colores por tipo de acción
- Timestamps precisos con formato local

### 🔒 **Control de Acceso**
- Solo usuarios con rol `admin` o `super` pueden acceder
- Verificación de permisos en el backend
- Información sensible protegida

## 🛠️ Estructura Técnica

### **API Endpoint**
```
GET /api/audit
```

**Parámetros disponibles:**
- `page`: Número de página (default: 1)
- `limit`: Registros por página (default: 50)
- `action`: Filtrar por tipo de acción
- `userId`: Filtrar por usuario específico
- `dateFrom`: Fecha inicio (YYYY-MM-DD)
- `dateTo`: Fecha fin (YYYY-MM-DD)
- `search`: Búsqueda libre en user_id y action

### **Tipos de Acciones Auditadas**

| Acción | Descripción | Color |
|--------|-------------|--------|
| `UPDATE_OWN_PROFILE` | Usuario modifica sus propios datos | Azul |
| `UPDATE_DOCENTE_DATA` | Admin modifica datos de docente | Verde |
| `UPDATE_USER_DATA` | Admin modifica datos de alumno | Púrpura |
| `UPDATE_ADMINISTRATIVO_DATA` | Admin modifica datos de administrativo | Naranja |

### **Estructura de Datos**

Cada registro de auditoría contiene:

```json
{
  "id": "uuid",
  "user_id": "id_del_usuario_afectado",
  "action": "tipo_de_accion",
  "details": {
    "updated_fields": {
      "email": "nuevo_email@ejemplo.com",
      "telefono": "123456789"
    },
    "updated_by": "id_del_usuario_que_hizo_el_cambio",
    "timestamp": "2025-10-29T15:30:00Z"
  },
  "created_at": "2025-10-29T15:30:00Z"
}
```

## 🚪 Acceso al Sistema

### **Navegación**
1. Ir al Dashboard Administrativo
2. En la sección "Gestión de Entidades"
3. Hacer clic en "Auditoría del Sistema"
4. Usar el botón "Ver Auditorías"

### **URL Directa**
```
/dashboard/administrativo/auditoria
```

## 📱 Funcionalidades de la Interfaz

### **Tabla Principal**
- **Fecha y Hora**: Timestamp exacto del cambio
- **Acción**: Tipo de modificación con código de color
- **Usuario Afectado**: ID del usuario cuyos datos fueron modificados
- **Modificado Por**: ID del usuario que realizó el cambio
- **Acciones**: Botón para ver detalles completos

### **Sistema de Filtros**
- **Activar/Desactivar**: Botón "Filtros" en el header
- **Aplicar**: Botón "Aplicar Filtros" después de configurar
- **Limpiar**: Botón "Limpiar" para resetear todos los filtros

### **Modal de Detalles**
- **Información Completa**: Todos los campos del registro
- **JSON Formateado**: Detalles técnicos legibles
- **Campos Modificados**: Qué datos específicos cambiaron

### **Paginación**
- **Navegación**: Botones Anterior/Siguiente
- **Info**: Registro actual de total
- **Páginas**: Indicador de página actual

## 🎨 Diseño y UX

### **Consistencia Visual**
- Mismo diseño que otras secciones administrativas
- Iconografía coherente (FileCheck para auditorías)
- Colores del sistema de la universidad

### **Responsividad**
- Diseño adaptable a diferentes pantallas
- Tabla con scroll horizontal en móviles
- Modal responsive para detalles

### **Estados de Carga**
- Indicadores de carga mientras se obtienen datos
- Mensajes de error informativos
- Estados vacíos cuando no hay datos

## 🔧 Mantenimiento

### **Configuración de Base de Datos**
- La tabla `audit_log` debe existir en Subabase
- Si no existe, las auditorías se intentan registrar pero no fallan
- Los logs aparecen en consola para debugging

### **Rendimiento**
- Paginación automática (50 registros por página)
- Índices recomendados en `created_at`, `action`, `user_id`
- Filtros optimizados para consultas eficientes

### **Limpieza de Datos**
- Considerar rutina de limpieza para registros muy antiguos
- Archivado de auditorías por períodos académicos
- Exportación para respaldos periódicos

## 🚀 Posibles Mejoras Futuras

- **Exportación PDF/Excel** de reportes
- **Dashboard de métricas** con gráficos
- **Alertas automáticas** para patrones sospechosos
- **Integración con sistema de notificaciones**
- **Filtros más granulares** (por departamento, carrera, etc.)
- **API para auditorías externas**

## 💡 Casos de Uso Comunes

### **Investigación de Problemas**
1. Usuario reporta datos incorrectos
2. Buscar por ID del usuario en auditorías
3. Revisar qué cambios se hicieron y cuándo
4. Identificar quién hizo los cambios
5. Revertir o corregir según sea necesario

### **Supervisión de Calidad**
1. Revisar cambios de la última semana
2. Filtrar por tipo de acción
3. Verificar que los cambios sean apropiados
4. Identificar patrones de errores

### **Cumplimiento Regulatorio**
1. Exportar auditorías de un período específico
2. Demostrar controles internos a auditores
3. Evidenciar transparencia en procesos
4. Responder a consultas de autoridades

¡El sistema de auditoría está completamente funcional y listo para su uso! 🎉