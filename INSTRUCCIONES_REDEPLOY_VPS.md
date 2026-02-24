# Configuración del VPS para usar el Repositorio Correcto

## 🎯 Situación Actual

- ✅ **Repositorio correcto:** `https://github.com/jcalderon90/NSG-Backend.git`
- ✅ **Código local:** Apunta al repositorio correcto
- ✅ **Archivos de copilot:** Están en el repositorio de GitHub
- ❌ **VPS:** No está sincronizado con el repositorio

## 🚀 Solución: Configurar el VPS

### Opción 1: Redeploy desde Panel de Control (RECOMENDADO)

Si usas **EasyPanel**, **Coolify**, **Dokploy** o similar:

#### 1. Acceder al Panel de Control

1. Ir a tu panel de control del VPS
2. Buscar el servicio/aplicación del backend (ej: "nsg-backend")

#### 2. Verificar la Configuración del Repositorio

En la configuración del servicio, verifica que:

- **Repository URL:** `https://github.com/jcalderon90/NSG-Backend.git`
- **Branch:** `main`
- **Build Command:** `npm install` (o el que uses)
- **Start Command:** `npm start` o `node src/index.js`

#### 3. Hacer Redeploy

1. Click en **"Redeploy"** o **"Rebuild & Restart"**
2. Esperar a que el deploy termine (1-3 minutos)
3. Verificar que el servicio esté corriendo

### Opción 2: Configuración Manual via SSH

#### 1. Conectarse al VPS

```bash
ssh usuario@your-api-domain.com
```

#### 2. Navegar al directorio del backend

```bash
cd /code
# O el directorio donde esté el backend
```

#### 3. Verificar el repositorio actual

```bash
git remote -v
```

**Si NO apunta a `https://github.com/jcalderon90/NSG-Backend.git`:**

```bash
# Cambiar el remote origin
git remote set-url origin https://github.com/jcalderon90/NSG-Backend.git

# Verificar que cambió
git remote -v
```

#### 4. Actualizar el código

```bash
# Descartar cambios locales (si los hay)
git reset --hard

# Actualizar desde el repositorio correcto
git fetch origin
git checkout main
git pull origin main

# Verificar que los archivos de copilot existan
ls -la src/controllers/copilotController.js
ls -la src/routes/copilot.routes.js
```

#### 5. Instalar dependencias

```bash
npm install
```

#### 6. Reiniciar el servicio

**Si usas PM2:**
```bash
pm2 restart nsg-backend
pm2 logs nsg-backend --lines 50
```

**Si usas systemd:**
```bash
sudo systemctl restart nsg-backend
sudo systemctl status nsg-backend
```

**Si usas Docker:**
```bash
docker-compose down
docker-compose pull
docker-compose up -d --build
```

### Opción 3: CI/CD con GitHub Actions

Si quieres automatizar los deploys:

#### 1. Crear archivo de workflow

Crear `.github/workflows/deploy.yml` en el repositorio:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /code
          git pull origin main
          npm install
          pm2 restart nsg-backend
```

#### 2. Configurar Secrets en GitHub

En GitHub → Settings → Secrets → Actions, agregar:

- `VPS_HOST`: `your-api-domain.com`
- `VPS_USER`: tu usuario SSH
- `VPS_SSH_KEY`: tu clave SSH privada

#### 3. Hacer push para activar el deploy

```bash
git push origin main
```

## 🔍 Verificación Post-Configuración

### 1. Verificar que el VPS tiene el código correcto

```bash
# Conectarse al VPS
ssh usuario@your-api-domain.com

# Verificar el repositorio
cd /code
git remote -v
# Debería mostrar: https://github.com/jcalderon90/NSG-Backend.git

# Verificar la rama
git branch
# Debería mostrar: * main

# Verificar el último commit
git log --oneline -1
# Debería mostrar: 3242c8e updates
```

### 2. Verificar que los archivos de copilot existan

```bash
ls -la /code/src/controllers/copilotController.js
ls -la /code/src/routes/copilot.routes.js
```

### 3. Verificar que el endpoint funcione

```bash
curl -I https://your-api-domain.com/copilot/history/test123
```

**Resultado esperado:**
- ✅ **401 Unauthorized** → El endpoint existe (¡éxito!)
- ❌ **404 Not Found** → El endpoint NO existe (revisar configuración)

### 4. Verificar los logs del servidor

```bash
pm2 logs nsg-backend --lines 100
# o
journalctl -u nsg-backend -f
```

**Buscar:**
- ✅ No debe haber errores de "Cannot find module"
- ✅ Debe mostrar "Server running on port..."
- ✅ Debe mostrar "MongoDB connected"

## 🐛 Troubleshooting

### Problema: "fatal: not a git repository"

**Solución:**
```bash
cd /code
git init
git remote add origin https://github.com/jcalderon90/NSG-Backend.git
git fetch origin
git checkout -b main origin/main
```

### Problema: "Your local changes would be overwritten"

**Solución:**
```bash
git stash
git pull origin main
# O forzar la actualización:
git reset --hard origin/main
```

### Problema: El servicio no reinicia

**Solución:**
```bash
# Ver procesos de Node.js
ps aux | grep node

# Matar todos los procesos de Node.js
pkill -f node

# Reiniciar PM2
pm2 restart all
pm2 status
```

## 📋 Checklist Final

- [ ] El VPS apunta al repositorio correcto (`jcalderon90/NSG-Backend`)
- [ ] El código está en la rama `main`
- [ ] Los archivos de copilot existen en `/code/src/`
- [ ] El servicio está corriendo sin errores
- [ ] El endpoint `/copilot/history/:userId` responde con 401
- [ ] Los logs no muestran errores de "Not Found"

## 🎉 Confirmación de Éxito

Cuando ejecutes:

```bash
curl -I https://your-api-domain.com/copilot/history/test123
```

Y veas:

```
HTTP/2 401
```

¡El VPS está correctamente configurado! 🎉

---

**Repositorio correcto:** `https://github.com/jcalderon90/NSG-Backend.git`  
**Última actualización:** 2026-02-05  
**Estado:** ⏳ Pendiente de configuración en VPS
