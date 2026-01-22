# Integración con Telegram Users

## Descripción
Este módulo permite consultar los datos de usuarios almacenados en la colección `telegram_users` de MongoDB, utilizando el `telegramId`.

## Endpoint Implementado

### GET `/telegram/user/:telegramId`

Busca un usuario en la colección `telegram_users` que coincida con el `telegramId` proporcionado.

**Autenticación**: Requerida (Header `Authorization` con token JWT, sin prefijo Bearer).

**Parámetros URL**:
- `telegramId`: El ID de Telegram del usuario (string).

**Respuesta Exitosa (200 OK):**
Devuelve el documento completo encontrado en la colección `telegram_users`.

```json
{
  "_id": "658...",
  "telegramId": "123456789",
  "username": "usuario_telegram",
  "firstName": "Nombre",
  ...otros campos
}
```

**Errores Posibles:**
- `400 Bad Request`: Si no se proporciona el ID.
- `401 Unauthorized`: Si no se envía token válido.
- `404 Not Found`: Si no existe usuario con ese telegramId.
- `500 Internal Server Error`: Problemas de conexión o servidor.

## Uso desde Frontend (Ejemplo)

```javascript
const telegramId = "123456789"; // Este valor debe venir del usuario logueado
const token = localStorage.getItem('token'); // O donde guardes el JWT

const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telegram/user/${telegramId}`, {
  headers: {
    'Authorization': token, // Recuerda: sin 'Bearer ' en este backend
    'Content-Type': 'application/json'
  }
});

if (response.ok) {
  const data = await response.json();
  console.log("Datos de Telegram:", data);
}
```

## Configuración Backend
- **Modelo**: `src/models/telegram_user.model.js` (Mapeado a colección `telegram_users`)
- **Controlador**: `src/controllers/telegram.controller.js`
- **Ruta**: `src/routes/telegram.routes.js`
