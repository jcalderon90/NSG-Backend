# NSG Intelligence Central - Backend API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedis&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

El núcleo de procesamiento y orquestador de datos para el ecosistema **NSG Intelligence**. Diseñado para manejar flujos de inteligencia estratégica, gestión de recursos educativos y automatización de procesos mediante IA.

## 🚀 Módulos Principales

### 💳 Billing & Monetization (Stripe)

Integración completa con Stripe para la gestión de suscripciones y pagos recurrentes.

- **Checkout Sessions**: Flujo seguro para la contratación de planes (Estratega, Enterprise).
- **Webhooks**: Sincronización automática de estados de suscripción (pagos fallidos, cancelaciones, renovaciones).
- **Subscription Guard**: Middleware para proteger funcionalidades según el plan del usuario.

### 📚 Education & Knowledge Vault

Gestión avanzada de documentos para la creación de bases de conocimiento personales.

- **Procesamiento de Documentos**: Extracción de texto inteligente desde PDF y Word (`pdf-parse`, `mammoth`).
- **Optimización de Payload**: Paginación y filtrado inteligente para manejar archivos de gran tamaño (8MB+) sin latencia.
- **Estrategia Refinada**: Flujo de preguntas dinámicas para calibrar el análisis de la IA según el contexto del usuario.

### 🤖 Integraciones & IA

- **Telegram Bot**: Link directo con los usuarios para protocolos diarios (`nsg_copilot`).
- **Orquestación n8n**: Delegación de tareas pesadas de procesamiento de lenguaje natural y web scraping.
- **Google Calendar**: Sincronización de agendas estratégicas.
- **Fathom Video**: Procesamiento de transcripciones de reuniones corporativas.

## 🛠 Arquitectura Técnica

El backend sigue el patrón **Controller-Route-Model** (MVC ligero) con una capa de validación robusta:

- **Runtime**: Node.js 20+
- **Database**: MongoDB Atlas (Mongoose)
- **Auth**: JWT (Stateless) + HttpOnly Cookies (Security)
- **Validation**: Middleware centralizado para esquemas y gestión de errores.
- **Infraestructura**: Dockerizado para despliegue en VPS (Hostinger KVM 4).

## 📂 Estructura del Proyecto

Para un desglose detallado de las carpetas, consulta [STRUCTURE.md](./STRUCTURE.md).

## 🚀 Configuración e Instalación

1. **Clonar y descargar dependencias**

    ```bash
    npm install
    ```

2. **Variables de Entorno (.env)**
   Configura un archivo `.env` basado en `.env.example`:

    ```env
    PORT=4000
    MONGODB_URI=mongodb+srv://...
    JWT_SECRET=tu_secreto_super_seguro
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    FRONTEND_URL=http://localhost:3200
    ```

3. **Ejecución**

    ```bash
    # Desarrollo con recarga automática
    npm run dev

    # Producción
    npm start
    ```

## 🐳 Despliegue con Docker

El proyecto incluye un `Dockerfile` optimizado:

```bash
docker build -t nsg-backend .
docker run -p 4000:4000 nsg-backend
```

Para un despliegue completo incluyendo base de datos y n8n, usa el **Docker Compose** en la raíz del proyecto global.

---

**NSG Intelligence** | Engineering v2.0 | Central Processing Hub
