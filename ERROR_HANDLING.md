# Error Handling & Logging - NSG Backend

## Implementación Completa de Manejo de Errores

Este documento describe el sistema de manejo de errores y logging implementado en el backend de NSG.

---

## 🎯 Características Implementadas

### 1. **Middleware de Manejo de Errores Global**

-   ✅ Captura todos los errores de la aplicación
-   ✅ Logging estructurado con contexto completo
-   ✅ Respuestas consistentes de error
-   ✅ Stack trace solo en desarrollo

### 2. **Sistema de Logging**

-   ✅ Logger adaptativo según entorno (desarrollo/producción)
-   ✅ Formato colorizado en desarrollo
-   ✅ JSON estructurado en producción
-   ✅ Niveles: info, error, warn, debug, success

### 3. **Health Check Endpoints**

-   ✅ `/health` - Estado general del servidor
-   ✅ `/health/ready` - Readiness probe (DB conectada)
-   ✅ `/health/live` - Liveness probe (servidor vivo)

---

## 📁 Archivos Creados

### `src/middlewares/error_handler.js`

Middleware centralizado para manejo de errores con tres utilidades:

-   **errorHandler**: Middleware principal de errores
-   **notFoundHandler**: Maneja rutas 404
-   **asyncHandler**: Wrapper para funciones async

### `src/utils/logger.js`

Sistema de logging que exporta un objeto `logger` con métodos:

```javascript
logger.info(message, metadata); // Información general
logger.error(message, metadata); // Errores
logger.warn(message, metadata); // Advertencias
logger.debug(message, metadata); // Debug (solo dev)
logger.success(message, metadata); // Operaciones exitosas
```

### `src/routes/health.routes.js`

Rutas de health check con tres endpoints:

-   `GET /health` - Información completa
-   `GET /health/ready` - ¿DB lista?
-   `GET /health/live` - ¿Servidor vivo?

---

## 🔧 Uso del Sistema

### Logger en Controladores

**Antes:**

```javascript
console.log("User created:", userId);
console.error("Error:", error);
```

**Ahora:**

```javascript
import { logger } from "../utils/logger.js";

logger.info("User created", { userId });
logger.error("Error creating user", {
    error: error.message,
    stack: error.stack,
});
```

### AsyncHandler (Opcional pero Recomendado)

Para evitar try/catch repetitivos, puedes usar `asyncHandler`:

**Antes:**

```javascript
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

**Ahora:**

```javascript
import { asyncHandler } from "../middlewares/error_handler.js";

export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json(users);
    // Los errores se capturan automáticamente
});
```

### Lanzar Errores Personalizados

```javascript
const error = new Error("Usuario no encontrado");
error.statusCode = 404;
throw error; // Se captura automáticamente
```

---

## 🌐 Health Check Endpoints

### GET /health

**Respuesta exitosa (200):**

```json
{
    "status": "healthy",
    "timestamp": "2026-01-11T21:45:00.000Z",
    "uptime": 12345.67,
    "environment": "production",
    "database": {
        "status": "connected",
        "name": "Database"
    },
    "memory": {
        "used": 150,
        "total": 512,
        "unit": "MB"
    }
}
```

**Respuesta no saludable (503):**

```json
{
    "status": "unhealthy",
    "timestamp": "2026-01-11T21:45:00.000Z",
    "database": {
        "status": "disconnected"
    }
}
```

### GET /health/ready

Verifica que la base de datos esté conectada (ideal para Kubernetes/Render).

### GET /health/live

Responde 200 si el proceso está vivo (ideal para balanceadores).

---

## 🌍 Configuración para Producción

### Variables de Entorno

```bash
NODE_ENV=production  # Activa el logger JSON estructurado
```

### Heroku/Render

Estos servicios pueden usar `/health` para verificar que tu app esté funcionando:

**Render:**

-   Health Check Path: `/health`

**Heroku:**

```json
{
    "formation": {
        "web": {
            "healthcheck": {
                "path": "/health",
                "interval": 30
            }
        }
    }
}
```

---

## 📊 Ejemplos de Logs

### Desarrollo (Consola con colores)

```
[INFO] 2026-01-11T21:45:00.000Z Server running on port 3000
[SUCCESS] 2026-01-11T21:45:01.000Z Connected to MongoDB Atlas successfully
[DEBUG] 2026-01-11T21:45:10.000Z Fetching news { date: '2026-01-11', type: 'all' }
[ERROR] 2026-01-11T21:45:15.000Z Error in getNews { error: 'Connection timeout' }
```

### Producción (JSON estructurado)

```json
{"level":"info","timestamp":"2026-01-11T21:45:00.000Z","message":"Server running on port 3000","environment":"production","port":3000}
{"level":"success","timestamp":"2026-01-11T21:45:01.000Z","message":"Connected to MongoDB Atlas successfully"}
{"level":"error","timestamp":"2026-01-11T21:45:15.000Z","message":"Error in getNews","error":"Connection timeout","stack":"..."}
```

---

## ✅ Checklist de Implementación

-   [x] Middleware de error handler creado
-   [x] Sistema de logging implementado
-   [x] Health check endpoints agregados
-   [x] Integrado en app.js
-   [x] console.log reemplazados en archivos críticos
-   [x] db.js actualizado con logger
-   [x] index.js actualizado con logger
-   [x] news.controller.js limpiado

---

## 🚀 Próximos Pasos Recomendados

1. **Usar asyncHandler en todos los controladores** - Elimina try/catch repetitivos
2. **Integrar Sentry** - Para tracking de errores en producción
3. **Agregar Winston/Pino** - Para logs más avanzados (rotación de archivos, etc.)
4. **Rate Limiting** - Proteger endpoints críticos
5. **Helmet.js** - Seguridad de headers HTTP

---

**Implementado:** 2026-01-11  
**Estado:** ✅ Completado
