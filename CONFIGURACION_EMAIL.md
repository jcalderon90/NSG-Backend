# Configuración del Sistema de Recuperación de Contraseña

El sistema de recuperación de contraseña ahora funciona **sin n8n**, enviando emails directamente desde el backend usando **nodemailer**.

## 📋 Requisitos Previos

1. **Instalar dependencias**:
```bash
npm install
```

## 🔧 Configuración

**IMPORTANTE:** Este es un servidor de pruebas con credenciales hardcodeadas directamente en el código.

### ✅ **No se requiere archivo `.env`**

Las credenciales de email ya están configuradas en:
- **Archivo**: `/src/services/emailService.js`
- **Email**: iagents.nsg@gmail.com
- **Password**: App Password de Gmail (configurado)

**Todo está listo para usar sin configuración adicional.**

1. **Crear App Password de Google**:
   - Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Inicia sesión con tu cuenta de Gmail
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "NSG Backend" y genera
   - Copia el password de 16 caracteres generado

2. **Configurar en `.env`**:
```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App Password de 16 caracteres
```

### Opción 2: SMTP Genérico (Para producción)

Puedes usar cualquier proveedor SMTP como SendGrid, Mailgun, AWS SES, etc.

```env
# Comentar las variables de Gmail y descomentar estas:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu_api_key_aqui
```

## 🚀 Uso

### Endpoints Disponibles:

1. **Solicitar código por Email**:
```http
POST /auth/forgot-password-email
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

2. **Solicitar código por Telegram** (requiere telegram_id vinculado):
```http
POST /auth/forgot-password-telegram
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

3. **Resetear contraseña con código**:
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "code": "123456",
  "newPassword": "nueva_contraseña_segura"
}
```

## ✨ Características

- ✅ Email HTML profesional con diseño responsive
- ✅ Código de 6 dígitos con expiración de 15 minutos
- ✅ Logging detallado para debugging
- ✅ Validación de email normalizada (.toLowerCase().trim())
- ✅ Manejo robusto de errores
- ✅ Fallback si falla el envío de email

## 🔍 Debugging

Los logs incluyen información detallada:

```
[FORGOT-PASSWORD-EMAIL] Buscando usuario con email: test@example.com
[FORGOT-PASSWORD-EMAIL] Usuario encontrado: 65abc123..., email: test@example.com
[FORGOT-PASSWORD-EMAIL] Código generado para usuario 65abc123...: 123456, expira: 2024-XX-XX...
[EMAIL-SERVICE] Email enviado exitosamente a test@example.com. MessageId: <abc123@gmail.com>
```

## ⚠️ Notas Importantes

1. **Gmail requiere "App Password"**: No uses tu contraseña normal de Gmail
2. **2FA debe estar habilitado**: Gmail requiere autenticación de dos factores para generar App Passwords
3. **Límites de envío de Gmail**: 
   - 500 emails/día para cuentas gratuitas
   - 2000 emails/día para Google Workspace
4. **Para producción**: Usa un servicio SMTP profesional (SendGrid, AWS SES, etc.)

## 🐛 Solución de Problemas

### Error: "Invalid login credentials"
- Verifica que estás usando un App Password, no tu contraseña normal
- Asegúrate de que 2FA está habilitado en tu cuenta de Google

### Error: "connect ETIMEDOUT"
- Verifica tu conexión a internet
- Asegúrate de que tu firewall permite conexiones SMTP salientes al puerto 587

### Email no llega
- Revisa la carpeta de spam
- Verifica los logs del servidor para ver si hay errores
- Prueba con otro email para descartar problemas del destinatario

## 📧 Ejemplo de Email Enviado

El usuario recibirá un email con:
- Diseño profesional con colores de NSG Platform
- Código de 6 dígitos destacado
- Advertencia de expiración de 15 minutos
- Avisos de seguridad

## 🔄 Migración desde n8n

Si estabas usando n8n anteriormente:
1. Ya no necesitas el workflow de n8n
2. Los webhooks antiguos ya no se utilizan
3. Todo el envío de emails ahora es directo desde el backend
4. Configura las variables EMAIL_USER y EMAIL_PASSWORD en tu .env

---

**¿Necesitas ayuda?** Revisa los logs del servidor o contacta al equipo de desarrollo.
