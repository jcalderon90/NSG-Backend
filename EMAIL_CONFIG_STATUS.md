# ✅ Sistema de Email Configurado (Hardcoded)

## 🔧 Configuración

**IMPORTANTE:** Este servidor de pruebas tiene las credenciales hardcodeadas directamente en el código.

### Credenciales Configuradas en el Código:

**Archivo:** `/src/services/emailService.js`

```javascript
user: 'iagents.nsg@gmail.com'
pass: 'btdo rvfs yxfn izef'
```

**NO se requiere archivo `.env`** - Todo está integrado en el proyecto.

## 📦 Sistema de Recuperación de Contraseña

### Archivos del Sistema:

1. **`src/services/emailService.js`**
   - ✅ Credenciales hardcodeadas
   - ✅ Transporter de Gmail configurado
   - ✅ Template HTML profesional

2. **`src/controllers/auth.controller.js`**
   - ✅ `forgotPasswordEmail()` - Genera y envía código
   - ✅ `forgotPasswordTelegram()` - Alternativa Telegram
   - ✅ `resetPasswordWithCode()` - Valida y actualiza contraseña

3. **`src/routes/auth.routes.js`**
   - ✅ `POST /auth/forgot-password-email`
   - ✅ `POST /auth/forgot-password-telegram`
   - ✅ `POST /auth/reset-password`

## 🚀 Uso

### 1. Instalar Dependencias
```bash
cd NSG-Backend
npm install
```

### 2. Iniciar Servidor
```bash
npm run dev
```

### 3. Endpoints Disponibles

#### Solicitar Código por Email
```http
POST /auth/forgot-password-email
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:**
```json
{
  "message": "Código de recuperación enviado a tu correo electrónico."
}
```

#### Resetear Contraseña con Código
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "code": "123456",
  "newPassword": "nueva_contraseña"
}
```

**Respuesta:**
```json
{
  "message": "Contraseña actualizada exitosamente."
}
```

## 📧 Email Template

El email enviado incluye:
- ✅ Diseño HTML responsive
- ✅ Código de 6 dígitos destacado
- ✅ Advertencia de expiración (15 minutos)
- ✅ Avisos de seguridad
- ✅ Branding de NSG Platform

**Remitente:** NSG Platform <iagents.nsg@gmail.com>

## 🔒 Seguridad

- ✅ Código expira en 15 minutos
- ✅ Código de 6 dígitos aleatorio
- ✅ App Password de Google (no contraseña real)
- ✅ Validación de email en BD
- ✅ Hash de contraseña con bcrypt

## 📊 Logs de Debugging

```bash
[FORGOT-PASSWORD-EMAIL] Buscando usuario con email: test@example.com
[FORGOT-PASSWORD-EMAIL] Usuario encontrado: 507f1f77bcf86cd799439011
[FORGOT-PASSWORD-EMAIL] Código generado: 742195, expira: 2024-01-19T14:50:00.000Z
[EMAIL-SERVICE] Email enviado exitosamente a test@example.com. MessageId: <abc123@gmail.com>
```

## ⚠️ Notas

- **Servidor de Pruebas:** Las credenciales están hardcodeadas
- **Producción:** Migrar a variables de entorno cuando se depliegue
- **Sin .env:** No se requiere configuración adicional

---

**Sistema completamente funcional** ✅  
Actualizado: 2024-01-19
