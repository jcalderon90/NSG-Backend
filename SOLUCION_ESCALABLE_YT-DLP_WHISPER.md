# Solución Escalable: yt-dlp + Whisper para Instagram/TikTok/YouTube

## 🎯 Objetivo
Implementar un sistema **escalable, económico y multi-plataforma** para obtener transcripciones de videos de YouTube, Instagram, TikTok y más.

---

## 💰 Comparación de Costos

| Solución | Costo por 9,000 videos/mes | Escalabilidad | Plataformas |
|----------|---------------------------|---------------|-------------|
| **RapidAPI (Freemium)** | $810-900/mes | ❌ Limitada | Solo YouTube/IG/TikTok |
| **yt-dlp + Whisper** | $270/mes | ✅ Ilimitada | **TODAS** |
| **Ahorro mensual** | **$540-630** | - | - |

*Estimado para videos promedio de 5 minutos*

---

## 🏗️ Arquitectura Completa

### Flujo en n8n:

```
[Webhook: recibe URL]
  ↓
[Find User Protocol]
  ↓
[Execute Command: yt-dlp] → Descarga video/audio
  ↓
[Check File Exists] → Valida descarga
  ↓
[HTTP Request: OpenAI Whisper API] → Transcripción
  ↓
[Delete Temp File] → Limpieza
  ↓
[AI Study Agent] → Análisis con contexto
  ↓
[Insert Education Content] + [Respond to Webhook]
```

---

## 📦 Instalación de yt-dlp en el Servidor n8n

### Opción 1: Docker (Si usas n8n en Docker)

Añade esto a tu `Dockerfile` o `docker-compose.yml`:

```dockerfile
# Si tienes un Dockerfile personalizado
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip && \
    pip3 install yt-dlp
```

O si usas **n8n oficial**, ejecuta esto dentro del contenedor:
```bash
docker exec -it n8n /bin/sh
apk add --no-cache python3 py3-pip ffmpeg
pip3 install yt-dlp
```

### Opción 2: VPS/Servidor Linux (Recomendado)

```bash
# Instalar Python y pip
sudo apt update
sudo apt install python3 python3-pip ffmpeg -y

# Instalar yt-dlp
sudo pip3 install -U yt-dlp

# Verificar instalación
yt-dlp --version
```

### Opción 3: n8n Cloud (Limitado)
Si usas n8n Cloud, necesitarás una **función externa** (ej: AWS Lambda, Vercel Serverless) para ejecutar yt-dlp.

---

## 🔧 Configuración de Nodos en n8n

### **PASO 1: Detectar Plataforma** (Mantener del plan anterior)

**Nodo**: `Platform Detector` (Code)

```javascript
const url = $input.first().json.link;
let platform = 'video'; // Genérico para yt-dlp

// yt-dlp soporta TODO, así que ya no necesitas detectar específicamente
// Solo validar que sea una URL válida
return [{
  json: {
    url,
    platform,
    source: url.includes('youtube') ? 'youtube' : 
            url.includes('instagram') ? 'instagram' : 
            url.includes('tiktok') ? 'tiktok' : 'other'
  }
}];
```

---

### **PASO 2: Descargar Audio con yt-dlp**

**Nodo**: `Execute Command`  
**Nombre**: `Download Audio with yt-dlp`

**Configuración:**
- **Command**: `yt-dlp`
- **Arguments**:
  ```
  -f bestaudio
  --extract-audio
  --audio-format mp3
  --output /tmp/audio_{{ $now.toUnixInteger() }}.%(ext)s
  --no-playlist
  {{ $('Platform Detector').item.json.url }}
  ```

**Explicación de los flags:**
- `-f bestaudio`: Solo descarga el mejor audio disponible (ahorra ancho de banda)
- `--extract-audio`: Convierte a audio puro
- `--audio-format mp3`: Formato compatible con Whisper
- `--output /tmp/audio_XXX.mp3`: Guarda en carpeta temporal con timestamp único
- `--no-playlist`: Solo el video individual, no playlists

---

### **PASO 3: Obtener Ruta del Archivo**

**Nodo**: `Code`  
**Nombre**: `Get Audio File Path`

```javascript
// El comando anterior devuelve stdout con info de descarga
const output = $input.first().json.stdout || $input.first().json.stderr;

// Extraer la ruta del archivo descargado
// yt-dlp muestra: "[download] Destination: /tmp/audio_12345.mp3"
const match = output.match(/Destination:\s+(.+\.mp3)/);
const filePath = match ? match[1].trim() : null;

if (!filePath) {
  throw new Error('No se pudo obtener la ruta del archivo de audio');
}

return [{
  json: {
    audioPath: filePath,
    timestamp: Math.floor(Date.now() / 1000)
  }
}];
```

---

### **PASO 4: Transcribir con Whisper API**

**Nodo**: `HTTP Request`  
**Nombre**: `Whisper Transcription`

**Configuración:**
- **Method**: `POST`
- **URL**: `https://api.openai.com/v1/audio/transcriptions`
- **Authentication**: `Header Auth`
  - **Name**: `Authorization`
  - **Value**: `Bearer YOUR_OPENAI_API_KEY`

**Body (Form-Data)**:
- **file**: `{{ $('Get Audio File Path').item.json.audioPath }}` (Binary File)
- **model**: `whisper-1`
- **response_format**: `json`
- **language**: (opcional, déjalo vacío para auto-detección)

**Headers adicionales**:
```
Content-Type: multipart/form-data
```

---

### **PASO 5: Formatear Respuesta de Whisper**

**Nodo**: `Code`  
**Nombre**: `Format Whisper Response`

```javascript
const response = $input.first().json;

// Whisper devuelve: { text: "transcripción completa..." }
const transcription = response.text || '';

// Normalizar al formato que espera el AI Study Agent
return [{
  json: {
    transcripts: {
      auto: {
        custom: transcription
      }
    }
  }
}];
```

---

### **PASO 6: Limpiar Archivos Temporales**

**Nodo**: `Execute Command`  
**Nombre**: `Delete Temp Audio File`

**Configuración:**
- **Command**: `rm`
- **Arguments**: `{{ $('Get Audio File Path').item.json.audioPath }}`

Esto evita llenar el disco con archivos temporales.

---

### **PASO 7: Detección de Idioma y Procesamiento**

**Nodo**: `Code`  
**Nombre**: `Detect Language and Prepare`

```javascript
const transcription = $input.first().json.transcripts.auto.custom;

// Detección simple de idioma (español vs inglés)
const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'es', 'para', 'con', 'por'];
const englishWords = ['the', 'is', 'and', 'to', 'of', 'in', 'for', 'on', 'with'];

const lowerText = transcription.toLowerCase();
const spanishCount = spanishWords.filter(word => lowerText.includes(` ${word} `)).length;
const englishCount = englishWords.filter(word => lowerText.includes(` ${word} `)).length;

const language = spanishCount > englishCount ? 'español' : 'ingles';

return [{
  json: {
    custom_transcription: transcription,
    language: language
  }
}];
```

---

## 🔑 Configuración de OpenAI API Key

1. Ve a: https://platform.openai.com/api-keys
2. Crea una nueva API key
3. En n8n, guarda la key como **Credential** tipo `Header Auth`

**Costo de Whisper**:
- **$0.006 por minuto** de audio
- Video de 5 min = **$0.03**
- Video de 15 min = **$0.09**

---

## 📊 Ventajas de esta Solución

### 1. **Multi-Plataforma Universal**
yt-dlp soporta **1,000+ sitios**:
- YouTube, Instagram, TikTok
- Twitter/X, Facebook, Vimeo
- Twitch, Reddit videos
- Y muchos más

### 2. **Sin Rate Limits de Terceros**
- No dependes de APIs de RapidAPI que pueden cambiar o cerrarse
- Control total del proceso

### 3. **Mejor Calidad de Transcripción**
- Whisper de OpenAI es el **estado del arte** en transcripción
- Precisión superior al 95% en español e inglés
- Detección automática de idioma

### 4. **Escalabilidad Real**
| Usuarios | Videos/mes | Costo Whisper | Costo RapidAPI | Ahorro |
|----------|------------|---------------|----------------|--------|
| 100 | 9,000 | $270 | $900 | $630 |
| 1,000 | 90,000 | $2,700 | $9,000 | $6,300 |
| 10,000 | 900,000 | $27,000 | $90,000 | $63,000 |

*Estimado: 5 min/video promedio*

---

## 🔧 Mantenimiento y Monitoreo

### Limpieza Automática de /tmp
Añade un **cron job** en tu servidor (fuera de n8n):

```bash
# Limpiar archivos de audio > 2 horas
0 * * * * find /tmp -name "audio_*.mp3" -type f -mmin +120 -delete
```

### Logging de Errores
Añade un nodo **Error Trigger** en n8n que registre:
- URLs que fallaron
- Errores de yt-dlp
- Problemas de Whisper

---

## 🚨 Casos Especiales

### Videos Privados o Protegidos
yt-dlp puede necesitar cookies para videos privados:

```bash
yt-dlp --cookies-from-browser chrome [URL]
```

### Videos muy largos (>1 hora)
Considera dividir el audio en chunks de 25 minutos (límite de Whisper API).

### Subtítulos Nativos Disponibles
Si el video ya tiene subtítulos, puedes descargarlos directamente (gratis):

```bash
yt-dlp --write-subs --sub-lang en,es --skip-download [URL]
```

Luego parsear el archivo `.srt` en lugar de usar Whisper.

---

## 📝 Checklist de Implementación

- [ ] Instalar yt-dlp en el servidor de n8n
- [ ] Instalar ffmpeg (dependencia de yt-dlp)
- [ ] Obtener API key de OpenAI
- [ ] Crear credential en n8n para OpenAI
- [ ] Modificar el flujo actual:
  - [ ] Reemplazar ramas de Instagram/TikTok con yt-dlp
  - [ ] Añadir nodo de Whisper
  - [ ] Añadir limpieza de archivos temporales
- [ ] Configurar cron job de limpieza en servidor
- [ ] Probar con URLs de diferentes plataformas
- [ ] Monitorear costos en OpenAI Dashboard

---

## 🧪 URLs de Prueba

**YouTube:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Instagram:**
```
https://www.instagram.com/reel/C1XYZ123abc/
```

**TikTok:**
```
https://www.tiktok.com/@username/video/7123456789012345678
```

**Twitter/X:**
```
https://twitter.com/username/status/1234567890123456789
```

---

## 💡 Optimizaciones Futuras

### 1. **Cache de Transcripciones**
Guarda transcripciones en MongoDB con hash de la URL. Si el mismo video se procesa de nuevo, reutiliza la transcripción.

### 2. **Queue System**
Para alto volumen, implementa una cola de procesamiento (Bull, Redis) para evitar sobrecarga.

### 3. **Self-Hosted Whisper** (Para >50,000 videos/mes)
Si el volumen crece mucho, considera:
- **Whisper.cpp** en GPU dedicada
- **Costo inicial**: ~$500 GPU (one-time)
- **Costo operativo**: $0 (solo electricidad)
- **ROI**: ~2-3 meses

---

## 📌 Resumen Ejecutivo

**Recomendación**: Implementar **yt-dlp + Whisper API** desde el inicio.

**Razones:**
1. ✅ **70% más barato** que RapidAPI a escala
2. ✅ **Soporta TODAS las plataformas** (no solo YouTube/IG/TikTok)
3. ✅ **Mejor calidad** de transcripción
4. ✅ **Sin rate limits** de terceros
5. ✅ **Escalable hasta millones de videos**

**Próximo paso**: Instalar yt-dlp en tu servidor y configurar los nodos según este documento.

---

**Fecha de creación**: 2026-02-05  
**Versión**: 1.0  
**Autor**: NSG AI Assistant
