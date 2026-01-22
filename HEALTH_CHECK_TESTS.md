# Test Health Endpoints

Este archivo contiene comandos para probar los endpoints de health check.

## Usando curl (PowerShell/CMD)

```powershell
# Health check general
curl http://localhost:3000/health

# Readiness probe
curl http://localhost:3000/health/ready

# Liveness probe
curl http://localhost:3000/health/live
```

## Usando PowerShell Invoke-WebRequest

```powershell
# Health check general
Invoke-WebRequest -Uri "http://localhost:3000/health" | Select-Object -Expand Content | ConvertFrom-Json

# Readiness probe
Invoke-WebRequest -Uri "http://localhost:3000/health/ready" | Select-Object -Expand Content | ConvertFrom-Json

# Liveness probe
Invoke-WebRequest -Uri "http://localhost:3000/health/live" | Select-Object -Expand Content | ConvertFrom-Json
```

## Para producción

Cuando despliegues en Render o similar, usa:

```bash
curl https://tu-backend.onrender.com/health
```

## Configuración en Render

1. Ve a tu servicio en Render
2. En "Health Check Path", ingresa: `/health`
3. Render verificará automáticamente este endpoint cada 30 segundos
