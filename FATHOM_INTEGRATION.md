# Integración con Fathom Analytics - Backend

## 📋 Descripción General

Esta integración permite a los usuarios guardar su **Access Token de Fathom Analytics** en su perfil. El token se almacena de forma segura en MongoDB asociado al usuario autenticado.

**Tipo de Integración**: Access Token Manual (sin OAuth)

---

## 🏗️ Arquitectura Implementada

### Componentes del Sistema

```
Frontend → JWT Auth → Backend API → MongoDB
                         ↓
                    User Model
                    (fathom_access_token)
```

### Archivos Modificados/Creados

1. **Modelo de Usuario** (`src/models/user.model.js`)

    - ✅ Campo `fathom_access_token` agregado

2. **Controlador** (`src/controllers/fathom.controller.js`)

    - ✅ `saveFathomToken()` - Guardar token
    - ✅ `getFathomStatus()` - Verificar estado
    - ✅ `deleteFathomToken()` - Eliminar token

3. **Rutas** (`src/routes/fathom.routes.js`)

    - ✅ POST `/fathom/token`
    - ✅ GET `/fathom/status`
    - ✅ DELETE `/fathom/token`

4. **App Principal** (`src/app.js`)
    - ✅ Rutas registradas con prefijo `/fathom`

---

## 📦 Modelo de Datos

### Campo en User Model

```javascript
{
  // ... otros campos del usuario

  fathom_access_token: {
    type: String,
    default: ''
  }
}
```

**Características**:

-   Tipo: String
-   Valor por defecto: cadena vacía
-   Almacena el Access Token de Fathom del usuario
-   Un token por usuario (asociado al `userId`)

---

## 🛣️ Endpoints Disponibles

### 1. Guardar Access Token

**Endpoint**: `POST /fathom/token`

**Autenticación**: Requerida (JWT)

**Headers**:

```http
Authorization: <jwt_token>
Content-Type: application/json
```

**Body**:

```json
{
    "fathom_access_token": "tu_access_token_de_fathom"
}
```

**Respuesta Exitosa (200)**:

```json
{
    "success": true,
    "message": "Access token de Fathom guardado exitosamente",
    "data": {
        "fathom_access_token": "tu_access_token_de_fathom"
    }
}
```

**Errores Posibles**:

-   `400 Bad Request`: Token no proporcionado o vacío
-   `401 Unauthorized`: JWT inválido o no proporcionado
-   `404 Not Found`: Usuario no encontrado
-   `500 Internal Server Error`: Error del servidor

**Validaciones**:

-   ✅ Token es requerido
-   ✅ Token no puede estar vacío
-   ✅ Token se limpia de espacios en blanco
-   ✅ Usuario debe estar autenticado

---

### 2. Verificar Estado de Conexión

**Endpoint**: `GET /fathom/status`

**Autenticación**: Requerida (JWT)

**Headers**:

```http
Authorization: <jwt_token>
```

**Respuesta Exitosa (200)**:

```json
{
    "success": true,
    "connected": true,
    "data": {
        "has_token": true
    }
}
```

**Cuando NO está conectado**:

```json
{
    "success": true,
    "connected": false,
    "data": {
        "has_token": false
    }
}
```

**Errores Posibles**:

-   `401 Unauthorized`: JWT inválido
-   `404 Not Found`: Usuario no encontrado
-   `500 Internal Server Error`: Error del servidor

---

### 3. Eliminar Access Token

**Endpoint**: `DELETE /fathom/token`

**Autenticación**: Requerida (JWT)

**Headers**:

```http
Authorization: <jwt_token>
```

**Respuesta Exitosa (200)**:

```json
{
    "success": true,
    "message": "Access token de Fathom eliminado exitosamente"
}
```

**Errores Posibles**:

-   `401 Unauthorized`: JWT inválido
-   `404 Not Found`: Usuario no encontrado
-   `500 Internal Server Error`: Error del servidor

---

## 🔐 Seguridad Implementada

### Autenticación y Autorización

✅ **JWT Requerido en Todas las Rutas**

```javascript
// Middleware aplicado a todas las rutas
import { auth_required } from "../middlewares/validate_token.js";

fathom_router.post("/token", auth_required, saveFathomToken);
fathom_router.get("/status", auth_required, getFathomStatus);
fathom_router.delete("/token", auth_required, deleteFathomToken);
```

✅ **Aislamiento de Datos por Usuario**

-   Cada usuario solo puede acceder a su propio token
-   El `userId` se extrae del JWT (`req.user.id`)
-   No es posible acceder a tokens de otros usuarios

✅ **Validación de Entrada**

-   Token no puede estar vacío
-   Token se sanitiza (trim)
-   Validación antes de guardar en BD

✅ **No Exposición de Contraseñas**

```javascript
// Las respuestas nunca incluyen la contraseña
{ new: true, select: '-password' }
```

---

## 🔄 Flujo de Operaciones

### Guardar Token

```
1. Usuario autenticado envía token
   ↓
2. Backend extrae userId del JWT
   ↓
3. Valida que token no esté vacío
   ↓
4. Busca usuario en MongoDB
   ↓
5. Actualiza campo fathom_access_token
   ↓
6. Retorna confirmación (sin password)
```

### Verificar Estado

```
1. Usuario autenticado solicita estado
   ↓
2. Backend extrae userId del JWT
   ↓
3. Busca usuario en MongoDB
   ↓
4. Verifica si tiene token guardado
   ↓
5. Retorna { connected: true/false }
```

### Eliminar Token

```
1. Usuario autenticado solicita eliminar
   ↓
2. Backend extrae userId del JWT
   ↓
3. Busca usuario en MongoDB
   ↓
4. Actualiza campo a cadena vacía ''
   ↓
5. Retorna confirmación
```

---

## 💻 Implementación del Controlador

### saveFathomToken

```javascript
export const saveFathomToken = async (req, res) => {
    try {
        const userId = req.user.id; // Del JWT
        const { fathom_access_token } = req.body;

        // Validaciones
        if (!fathom_access_token || fathom_access_token.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "El access token de Fathom es requerido",
            });
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fathom_access_token: fathom_access_token.trim() },
            { new: true, select: "-password" }
        );

        res.status(200).json({
            success: true,
            message: "Access token de Fathom guardado exitosamente",
            data: { fathom_access_token: updatedUser.fathom_access_token },
        });
    } catch (error) {
        // Manejo de errores
    }
};
```

### getFathomStatus

```javascript
export const getFathomStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("fathom_access_token");

        const hasToken =
            user.fathom_access_token && user.fathom_access_token.trim() !== "";

        res.status(200).json({
            success: true,
            connected: hasToken,
            data: { has_token: hasToken },
        });
    } catch (error) {
        // Manejo de errores
    }
};
```

### deleteFathomToken

```javascript
export const deleteFathomToken = async (req, res) => {
    try {
        const userId = req.user.id;

        await User.findByIdAndUpdate(
            userId,
            { fathom_access_token: "" },
            { new: true, select: "-password" }
        );

        res.status(200).json({
            success: true,
            message: "Access token de Fathom eliminado exitosamente",
        });
    } catch (error) {
        // Manejo de errores
    }
};
```

---

## 🧪 Testing con REST Client

Archivo: `api-test (REST Client ext only)/api-fathom.http`

```http
### Guardar Token
POST http://localhost:3000/fathom/token
Content-Type: application/json
Authorization: {{jwt_token}}

{
  "fathom_access_token": "tu_token_aqui"
}

###

### Verificar Estado
GET http://localhost:3000/fathom/status
Authorization: {{jwt_token}}

###

### Eliminar Token
DELETE http://localhost:3000/fathom/token
Authorization: {{jwt_token}}
```

---

## 📝 Formato del JWT

**Importante**: El middleware `auth_required` espera el token JWT **SIN** el prefijo "Bearer":

❌ **INCORRECTO**:

```javascript
headers: {
  'Authorization': 'Bearer eyJhbGc...'
}
```

✅ **CORRECTO**:

```javascript
headers: {
  'Authorization': 'eyJhbGc...'
}
```

---

## 🚀 Próximos Pasos Sugeridos

Esta es una implementación básica. Podrías expandirla con:

### 1. Validación del Token con Fathom API

```javascript
export const verifyFathomToken = async (req, res) => {
    const { fathom_access_token } = req.body;

    // Hacer petición a Fathom API para verificar
    const response = await fetch(
        "https://api.fathom.video/v1/recordings?limit=1",
        {
            headers: { Authorization: `Bearer ${fathom_access_token}` },
        }
    );

    if (!response.ok) {
        return res.status(400).json({
            success: false,
            message: "Token inválido",
        });
    }

    // Si es válido, guardarlo
    // ...
};
```

### 2. Obtener Grabaciones de Fathom

```javascript
export const getUserRecordings = async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.fathom_access_token) {
        return res.status(400).json({
            success: false,
            message: "No hay token de Fathom configurado",
        });
    }

    const response = await fetch("https://api.fathom.video/v1/recordings", {
        headers: { Authorization: `Bearer ${user.fathom_access_token}` },
    });

    const data = await response.json();
    res.json({ success: true, data });
};
```

### 3. Webhook para Sincronización Automática

```javascript
export const fathomWebhook = async (req, res) => {
    // Recibir notificaciones de Fathom cuando hay nuevas grabaciones
    const { event, data } = req.body;

    if (event === "recording.completed") {
        // Procesar nueva grabación
    }

    res.status(200).json({ received: true });
};
```

---

## ⚠️ Notas Importantes

1. **El token se almacena en texto plano**

    - Considera encriptar el token antes de guardarlo
    - Usa una librería como `crypto` o `bcrypt`

2. **No hay validación con Fathom**

    - Actualmente solo se guarda el token
    - No se verifica si es válido
    - Considera agregar validación antes de guardar

3. **Sin manejo de expiración**

    - Los tokens de Fathom pueden expirar
    - Considera agregar lógica de refresh

4. **CORS configurado**
    - Actualmente permite `origin: "*"`
    - En producción, especifica el dominio del frontend

---

## 🎯 Resumen de la Implementación

✅ **Completado**:

-   Campo en modelo de usuario
-   Endpoint para guardar token
-   Endpoint para verificar estado
-   Endpoint para eliminar token
-   Autenticación JWT en todas las rutas
-   Validación de entrada
-   Manejo de errores
-   Documentación completa
-   Archivo de pruebas HTTP

🔄 **Pendiente** (opcional):

-   Validación del token con Fathom API
-   Encriptación del token
-   Endpoints para obtener datos de Fathom
-   Manejo de expiración de tokens
-   Webhooks de Fathom

---

## 📞 Integración con Frontend

El frontend debe:

1. **Obtener JWT del usuario** (del login)
2. **Enviar token de Fathom** al endpoint POST `/fathom/token`
3. **Verificar estado** con GET `/fathom/status`
4. **NO almacenar el token en el frontend** (solo en backend)

Ver documentación del frontend: `NSG-Frontend/FATHOM_FRONTEND_INTEGRATION.md`
