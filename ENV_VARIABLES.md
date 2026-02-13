# Variables de Entorno - NSG Backend

## 📋 Resumen de Configuración

Se han organizado y actualizado las variables de entorno del backend en el archivo `.env` para incluir todas las configuraciones necesarias del servidor.

## 🔧 Variables Configuradas

### 1. **Configuración del Servidor**

```bash
PORT=4000                    # Puerto del servidor backend
NODE_ENV=development         # Ambiente de ejecución
```

### 2. **Base de Datos**

```bash
# MongoDB Atlas (Actualmente en uso)
MONGODB_URI=mongodb+srv://iagentsnsg_db_user:Nc0lLH0zK6LEFJQP@cluster0.pgbmwuy.mongodb.net/Database?appName=Cluster0

# MongoDB Local (Comentado - para desarrollo sin internet)
# MONGODB_URI=mongodb://localhost:27017/nsg-database
```

### 3. **Autenticación JWT**

```bash
TOKEN_SECRET=some secret key  # Secreto para firmar tokens JWT
```

### 4. **Google Calendar API**

```bash
GOOGLE_CLIENT_ID=tu_cliente_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_secreto_de_cliente
GOOGLE_REDIRECT_URI=http://localhost:4000/google/callback
```

### 5. **Configuración de Email**

```bash
# Para reset de contraseñas
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
```

### 6. **URL del Frontend**

```bash
FRONTEND_URL=http://localhost:3000  # Para redirecciones de Google Calendar
```

### 7. **Webhooks de N8N**

```bash
# Análisis de Fathom
N8N_FATHOM_ANALYSIS_WEBHOOK=https://personal-n8n.suwsiw.easypanel.host/webhook/generate-fathom-analysis

# Análisis de Audio
N8N_AUDIO_ANALYSIS_WEBHOOK=https://personal-n8n.suwsiw.easypanel.host/webhook/generate-audio-analysis

# Análisis de Noticias
N8N_NEWS_ANALYSIS_WEBHOOK=https://personal-n8n.suwsiw.easypanel.host/webhook/analyze-news

# Reset de contraseña vía Telegram
N8N_TELEGRAM_RESET_WEBHOOK=https://personal-n8n.suwsiw.easypanel.host/webhook/telegram-reset-code
```

### 8. **Stripe (Pasarela de Pagos)**

```bash
STRIPE_SECRET_KEY=sk_test_...        # Secret Key desde el dashboard de Stripe
STRIPE_WEBHOOK_SECRET=whsec_...     # Secreto para validar notificaciones de Stripe
```

## 📁 Archivo de Configuración

### ✅ `.env` (Único archivo)

**Ubicación**: `NSG-Backend/.env`

Archivo único de variables de entorno que contiene:

- Configuración completa del servidor
- Credenciales de MongoDB Atlas (producción)
- URLs de webhooks de N8N
- Configuración de email
- URLs locales para desarrollo

### 🔐 Seguridad Importante

- El archivo `.env` está en `.gitignore` y **NO debe subirse a git**
- Contiene información sensible (credenciales, tokens, etc.)
- Nunca compartas este archivo directamente
- Todos los valores son leídos automáticamente por el código

## 🚀 Uso

### Para Desarrollo Local

El archivo `.env` ya está configurado con:

- ✅ Puerto 4000
- ✅ MongoDB Atlas (base de datos en la nube)
- ✅ Frontend URL apuntando a localhost:3000
- ✅ Google redirect URI para localhost

### Para Cambiar a MongoDB Local

Si deseas usar MongoDB local en lugar de Atlas:

1. Comenta la línea de MongoDB Atlas
2. Descomenta la línea de MongoDB Local

```bash
# MONGODB_URI=mongodb+srv://...
MONGODB_URI=mongodb://localhost:27017/nsg-database
```

## 📝 Notas Importantes

### Variables Pendientes de Configurar

Las siguientes variables contienen valores placeholder y necesitan ser configuradas si deseas usar sus funcionalidades:

1. **Google Calendar API** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
    - Requeridas solo si usas la integración con Google Calendar
    - Obtener de la consola de Google Cloud

2. **Email** (`EMAIL_USER`, `EMAIL_PASSWORD`)
    - Requeridas solo para reset de contraseña por email
    - Usar App Password de Gmail, no la contraseña normal

### Variables que NO Necesitan Cambio

Las siguientes variables ya están configuradas correctamente:

- ✅ `PORT=4000`
- ✅ `NODE_ENV=development`
- ✅ `MONGODB_URI` (usando MongoDB Atlas)
- ✅ `TOKEN_SECRET`
- ✅ `FRONTEND_URL=http://localhost:3000`
- ✅ Todos los webhooks de N8N

## 🔒 Seguridad

⚠️ **IMPORTANTE**:

- El archivo `.env` está en `.gitignore` y NO debe subirse a git
- Las credenciales de MongoDB Atlas están expuestas en el código actual
- Se recomienda rotar las credenciales si el repositorio es público
- Nunca compartas el archivo `.env` directamente

## 🔄 Para Producción (Render)

En Render, configura las mismas variables de entorno pero con valores de producción:

```bash
PORT=4000
NODE_ENV=production
MONGODB_URI=<tu_mongodb_atlas_uri>
FRONTEND_URL=https://tu-frontend.vercel.app
GOOGLE_REDIRECT_URI=https://nsg-backend.onrender.com/google/callback
```

## ✅ Estado Actual del Servidor

El backend está corriendo con:

- ✅ Puerto: 4000
- ✅ Base de datos: MongoDB Atlas (conectado)
- ✅ Ambiente: development
- ✅ Todas las variables de entorno cargadas
- ✅ Listo para recibir peticiones del frontend en localhost:3000
