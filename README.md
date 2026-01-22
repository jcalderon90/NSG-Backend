# NSG Backend

Backend API REST desarrollado con Node.js y Express que proporciona un sistema completo de autenticación y gestión de usuarios con roles (admin/user).

## 📋 Descripción

Este proyecto es un servidor backend que implementa un sistema de autenticación basado en JWT (JSON Web Tokens) con las siguientes funcionalidades:

-   **Autenticación de usuarios**: Registro, inicio de sesión y cierre de sesión
-   **Gestión de usuarios**: CRUD completo de usuarios (solo administradores)
-   **Control de acceso basado en roles**: Sistema de permisos para usuarios y administradores
-   **Validación de datos**: Validación de esquemas con Zod
-   **Seguridad**: Encriptación de contraseñas con bcryptjs

## 🛠️ Tecnologías Utilizadas

-   **Node.js** - Entorno de ejecución
-   **Express** - Framework web para Node.js
-   **MongoDB** - Base de datos NoSQL
-   **Mongoose** - ODM (Object Data Modeling) para MongoDB
-   **JWT (jsonwebtoken)** - Autenticación basada en tokens
-   **bcryptjs** - Encriptación de contraseñas
-   **Zod** - Validación de esquemas
-   **CORS** - Configuración de acceso cruzado
-   **Morgan** - Logger de solicitudes HTTP
-   **cookie-parser** - Parser de cookies

## 📦 Instalación

1. Clona el repositorio o navega al directorio del proyecto:

```bash
cd "NSG - Backend"
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:
    - Crea un archivo `.env` en la raíz del proyecto (opcional)
    - O configura directamente en `src/config.js` y `src/db.js`

## ⚙️ Configuración

### Variables de Entorno

El proyecto utiliza las siguientes variables de entorno (opcional):

-   `PORT`: Puerto en el que se ejecutará el servidor (por defecto: 3000)
-   `MONGODB_URI`: URI de conexión a MongoDB
-   `TOKEN_SECRET`: Secreto para firmar los JWT (configurado en `src/config.js`)

**Nota**: Actualmente el proyecto tiene valores por defecto, pero se recomienda usar variables de entorno para mayor seguridad.

### Base de Datos

El proyecto está configurado para conectarse a MongoDB. La conexión se realiza en `src/db.js`:

-   Por defecto intenta usar `process.env.MONGODB_URI`
-   Si no existe, usa una URI de MongoDB Atlas como respaldo
-   Base de datos: `test_db`

### CORS

El servidor está configurado para aceptar solicitudes desde `http://localhost:5173` con credenciales habilitadas. Puedes modificar esto en `src/app.js`.

## 🚀 Ejecución

### Modo Desarrollo (con watch)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado).

## 📁 Estructura del Proyecto

```
NSG - Backend/
├── src/
│   ├── app.js                      # Configuración de Express y middleware
│   ├── index.js                    # Punto de entrada del servidor
│   ├── config.js                   # Configuración (TOKEN_SECRET)
│   ├── db.js                       # Conexión a MongoDB
│   ├── controllers/
│   │   ├── auth.controller.js      # Controladores de autenticación
│   │   └── user.controller.js      # Controladores de usuarios
│   ├── models/
│   │   └── user.model.js           # Modelo de Usuario (Mongoose)
│   ├── routes/
│   │   ├── auth.routes.js          # Rutas de autenticación
│   │   └── user.routes.js          # Rutas de usuarios
│   ├── middlewares/
│   │   ├── validate_token.js       # Middleware de autenticación/autorización
│   │   └── validator_schema.middleware.js  # Middleware de validación
│   ├── schemas/
│   │   ├── auth.schema.js          # Esquemas de validación para autenticación
│   │   └── user.schema.js          # Esquemas de validación para usuarios
│   └── libs/
│       └── jwt.js                  # Utilidades para JWT
├── api-test (REST Client ext only)/
│   ├── api-auth.http               # Ejemplos de endpoints de autenticación
│   └── api-admin.http              # Ejemplos de endpoints de administración
├── package.json
└── README.md
```

## 🔐 Modelo de Usuario

```javascript
{
  username: String (requerido, trim)
  email: String (requerido, único, trim)
  password: String (requerido, encriptado)
  role: String (enum: ['user', 'admin'], default: 'user')
  imgURL: String (default: '')
  createdAt: Date (automático)
  updatedAt: Date (automático)
}
```

## 🛣️ Endpoints de la API

### Health Check (`/health`)

#### GET `/health`

Verifica el estado general del servidor y la base de datos.

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

---

#### GET `/health/ready`

Readiness probe - Verifica que el servidor esté listo para recibir tráfico.

**Respuesta exitosa (200):**

```json
{
    "ready": true,
    "message": "Server is ready"
}
```

---

#### GET `/health/live`

Liveness probe - Verifica que el servidor esté vivo.

**Respuesta exitosa (200):**

```json
{
    "alive": true,
    "timestamp": "2026-01-11T21:45:00.000Z"
}
```

---

### Autenticación (`/auth`)

#### POST `/auth/register`

Registra un nuevo usuario.

**Body:**

```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
}
```

**Validación:**

-   `username`: requerido (string)
-   `email`: requerido, formato de email válido
-   `password`: requerido, mínimo 6 caracteres

**Respuesta exitosa (200):**

```json
{
    "message": "User successfully created.",
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "imgURL": "",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }
}
```

---

#### POST `/auth/login`

Inicia sesión con un usuario existente.

**Body:**

```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Validación:**

-   `email`: requerido, formato de email válido
-   `password`: requerido, mínimo 6 caracteres

**Respuesta exitosa (200):**

```json
{
    "message": "User successfully logged in.",
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "imgURL": "",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }
}
```

---

#### POST `/auth/logout`

Cierra sesión (limpia la cookie de token).

**Respuesta exitosa (200):**

```
Status: 200 OK
```

---

#### GET `/auth/profile`

Obtiene el perfil del usuario autenticado.

**Headers:**

```
Authorization: jwt_token_here
```

**Autenticación requerida:** Sí

**Respuesta exitosa (200):**

```json
{
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "imgURL": "",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### GET `/auth/verify-token`

Verifica si un token es válido y retorna la información del usuario.

**Headers:**

```
Authorization: jwt_token_here
```

**Respuesta exitosa (200):**

```json
{
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "imgURL": "",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Gestión de Usuarios (`/user`)

**Nota:** Todos los endpoints de esta sección requieren autenticación y rol de administrador, excepto `DELETE /user/delete/:id`.

---

#### POST `/user/create`

Crea un nuevo usuario (solo administradores).

**Headers:**

```
Authorization: jwt_token_here
```

**Autenticación requerida:** Sí (Admin)

**Body:**

```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
}
```

**Validación:**

-   `username`: requerido (string)
-   `email`: requerido, formato de email válido
-   `password`: requerido, mínimo 6 caracteres
-   `role`: requerido (string)

**Respuesta exitosa (200):**

```json
{
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "imgURL": "",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

#### PATCH `/user/update/:id`

Actualiza un usuario existente (solo administradores).

**Headers:**

```
Authorization: jwt_token_here
```

**Autenticación requerida:** Sí (Admin)

**Parámetros:**

-   `id`: ID del usuario a actualizar

**Body:**

```json
{
    "username": "johndoe_updated",
    "email": "john.updated@example.com",
    "role": "admin"
}
```

**Nota:** Todos los campos son opcionales en el body.

**Respuesta exitosa (200):**

```json
{
    "id": "user_id",
    "username": "johndoe_updated",
    "email": "john.updated@example.com",
    "role": "admin",
    "imgURL": "",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

#### GET `/user/get/:id`

Obtiene un usuario específico por su ID (solo administradores).

**Headers:**

```
Authorization: jwt_token_here
```

**Autenticación requerida:** Sí (Admin)

**Parámetros:**

-   `id`: ID del usuario

**Respuesta exitosa (200):**

```json
{
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "imgURL": "",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### GET `/user/get_all`

Obtiene todos los usuarios (solo administradores).

**Headers:**

```
Authorization: jwt_token_here
```

**Autenticación requerida:** Sí (Admin)

**Respuesta exitosa (200):**

```json
[
    {
        "_id": "user_id_1",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "imgURL": "",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
        "_id": "user_id_2",
        "username": "janedoe",
        "email": "jane@example.com",
        "role": "admin",
        "imgURL": "",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
]
```

---

#### DELETE `/user/delete/:id`

Elimina un usuario por su ID.

**Parámetros:**

-   `id`: ID del usuario a eliminar

**Respuesta exitosa (200):**

```json
{
    "message": "User username deleted successfully"
}
```

---

## 🔒 Autenticación y Autorización

### Tokens JWT

-   Los tokens se generan al registrar o iniciar sesión
-   El token expira en **1 día**
-   El token debe enviarse en el header `Authorization` para las rutas protegidas

### Middleware de Autenticación

-   `auth_required`: Verifica que el token sea válido
-   `admin_required`: Verifica que el usuario tenga rol de administrador

### Códigos de Estado HTTP

-   `200` - Operación exitosa
-   `400` - Solicitud incorrecta / Datos inválidos
-   `401` - No autorizado / Token inválido
-   `404` - Recurso no encontrado
-   `500` - Error interno del servidor

## 📝 Validación de Datos

El proyecto utiliza **Zod** para validar los datos de entrada. Los esquemas se encuentran en:

-   `src/schemas/auth.schema.js`: Validaciones para registro y login
-   `src/schemas/user.schema.js`: Validaciones para operaciones de usuarios

### Ejemplo de Error de Validación

```json
["Email is required", "Password must be at least 6 characters"]
```

## 🔧 Middlewares

### `validate_token.js`

-   `auth_required`: Valida el token JWT y extrae el ID del usuario
-   `admin_required`: Verifica que el usuario tenga rol de administrador

### `validator_schema.middleware.js`

-   `validate_schema`: Valida el body de la solicitud contra un esquema Zod

## 📚 Ejemplos de Uso

### Ejemplo: Registro de Usuario

```javascript
const response = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
    }),
});

const data = await response.json();
console.log(data.token); // Guardar este token
```

### Ejemplo: Solicitud Autenticada

```javascript
const token = "tu_token_jwt_aqui";

const response = await fetch("http://localhost:3000/auth/profile", {
    method: "GET",
    headers: {
        Authorization: token,
    },
});

const user = await response.json();
console.log(user);
```

## 🧪 Testing

El proyecto incluye archivos `.http` en la carpeta `api-test (REST Client ext only)` para probar los endpoints con la extensión REST Client de VS Code.

## ⚠️ Notas de Seguridad

1. **TOKEN_SECRET**: Actualmente está hardcodeado en `src/config.js`. Se recomienda usar una variable de entorno.
2. **MongoDB URI**: La URI contiene credenciales. Se recomienda usar variables de entorno.
3. **Contraseñas**: Las contraseñas se encriptan con bcryptjs antes de almacenarse.
4. **CORS**: Configurado para permitir solo `http://localhost:5173`. Ajustar según necesidades.

## 👤 Autor

**Jorge Calderón**

## 📄 Licencia

ISC

## 🔄 Versión

1.0.0

---

**Nota**: Este README documenta el estado actual del proyecto. Para más detalles sobre implementaciones específicas, consulta el código fuente en cada módulo.
