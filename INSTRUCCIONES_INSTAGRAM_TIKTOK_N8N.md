# Instrucciones para Añadir Instagram y TikTok a n8n

## 🎯 Objetivo
Extender el flujo actual de YouTube para soportar **Instagram y TikTok** usando APIs gratuitas de RapidAPI.

---

## 💰 Costos

- **Instagram Transcripts API**: GRATIS (100 requests/mes)
- **TikTok Transcript API**: GRATIS (ilimitado en plan básico)
- **Total adicional**: $0/mes

Si necesitas más:

- Instagram: $9/mes (1,000 requests)
- TikTok: $9/mes (plan Pro con más features)

---

## 📋 Cambios Necesarios en n8n

### **PASO 1: Modificar el Nodo "Code"**

**Ubicación**: Después del nodo "Edit Fields"  
**Acción**: Reemplazar el código actual

**Nuevo código:**

```javascript
// URL de entrada (del nodo anterior)
const url = $input.first().json.link;
let platform = 'unknown';
let videoId = null;

// ==========================================
// DETECTOR DE PLATAFORMA
// ==========================================

// YouTube
if (url.match(/youtu\.be\/|youtube\.com\/watch/)) {
  platform = 'youtube';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/);
  videoId = match ? match[1] : null;
}

// Instagram
else if (url.match(/instagram\.com\/(p|reel|reels)\//)) {
  platform = 'instagram';
  // Instagram usa el shortcode de la URL
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  videoId = match ? match[1] : null;
}

// TikTok (varios formatos)
else if (url.match(/tiktok\.com\/@.*\/video\/|vm\.tiktok\.com/)) {
  platform = 'tiktok';
  // TikTok formato largo: tiktok.com/@username/video/1234567890
  const match = url.match(/\/video\/(\d+)/);
  videoId = match ? match[1] : null;
}

// ==========================================
// OUTPUT
// ==========================================
return [{
  json: {
    url,           // URL original
    platform,      // 'youtube', 'instagram', 'tiktok', 'unknown'
    videoId        // ID del video (si se detectó)
  }
}];
```

**Renombrar el nodo a**: `Platform Detector`

---

### **PASO 2: Modificar el Nodo "Switch"**

**Acción**: Cambiar las condiciones para usar la plataforma detectada

**Configuración del Switch:**

#### Output 1 - YouTube
- **Nombre**: `YouTube`
- **Condición**: `{{ $json.platform }}` equals `youtube`

#### Output 2 - Instagram (NUEVO)
- **Nombre**: `Instagram`
- **Condición**: `{{ $json.platform }}` equals `instagram`

#### Output 3 - TikTok (NUEVO)
- **Nombre**: `TikTok`
- **Condición**: `{{ $json.platform }}` equals `tiktok`

---

### **PASO 3: Rama de YouTube (Mantener igual)**

Esta rama ya existe y funciona. Conecta el output "YouTube" del Switch a tu flujo actual:
- `HTTP Request` (YouTube API)
- `TRANSCRIPTS`
- etc.

---

### **PASO 4: Rama de Instagram (NUEVA)**

#### A. Crear Nodo HTTP Request - Instagram

**Tipo**: HTTP Request  
**Nombre**: `Get Instagram Transcript`  
**Conexión**: Desde output "Instagram" del Switch

**Configuración:**
- **URL**: `https://instagram-transcripts.p.rapidapi.com/transcribe`
- **Method**: `GET`
- **Query Parameters**:
  ```
  url: {{ $('Platform Detector').item.json.url }}
  ```
- **Headers**:
  ```
  x-rapidapi-host: instagram-transcripts.p.rapidapi.com
  x-rapidapi-key: b9bfd2e714msh1d8562a125fcf38p158099jsnacd3920979be
  ```

#### B. Formatear Respuesta de Instagram

**Tipo**: Code  
**Nombre**: `Format Instagram Response`  
**Conexión**: Después de `Get Instagram Transcript`

**Código:**

```javascript
const response = $input.first().json;

// Normalizar al formato esperado por el resto del flujo
return [{
  json: {
    transcripts: {
      en_auto: {
        custom: response.transcript || response.text || ""
      }
    }
  }
}];
```

---

### **PASO 5: Rama de TikTok (NUEVA)**

#### A. Crear Nodo HTTP Request - TikTok

**Tipo**: HTTP Request  
**Nombre**: `Get TikTok Transcript`  
**Conexión**: Desde output "TikTok" del Switch

**Configuración:**
- **URL**: `https://tiktok-transcript.p.rapidapi.com/transcript`
- **Method**: `GET`
- **Query Parameters**:
  ```
  video_url: {{ $('Platform Detector').item.json.url }}
  ```
- **Headers**:
  ```
  x-rapidapi-host: tiktok-transcript.p.rapidapi.com
  x-rapidapi-key: b9bfd2e714msh1d8562a125fcf38p158099jsnacd3920979be
  ```

#### B. Formatear Respuesta de TikTok

**Tipo**: Code  
**Nombre**: `Format TikTok Response`  
**Conexión**: Después de `Get TikTok Transcript`

**Código:**
```javascript
const response = $input.first().json;

// TikTok puede devolver subtítulos como array o texto directo
let transcriptText = '';

if (response.transcript) {
  transcriptText = response.transcript;
} else if (response.subtitles && Array.isArray(response.subtitles)) {
  transcriptText = response.subtitles.join(' ');
} else if (response.text) {
  transcriptText = response.text;
}

// Normalizar al formato esperado
return [{
  json: {
    transcripts: {
      en_auto: {
        custom: transcriptText
      }
    }
  }
}];
```

---

### **PASO 6: Unir las 3 Ramas (MERGE)**

#### Modificar el nodo "TRANSCRIPTS"

**Acción**: Hacer que este nodo acepte datos de las 3 fuentes

**Conexiones de entrada**:
1. Desde `HTTP Request` (YouTube)
2. Desde `Format Instagram Response`
3. Desde `Format TikTok Response`

**Configuración actualizada**:
```javascript
// Assignments
{
  "transcripts": "={{ $json.transcripts || $('HTTP Request').item.json.data.transcripts }}"
}
```

Esto asegura que funcione tanto con el formato de YouTube como con los formateados de Instagram/TikTok.

---

### **PASO 7: Actualizar el nodo "CUSTOM TRANSCRIPTION y LANG"**

Este nodo necesita detectar el idioma correctamente para todas las plataformas.

**Código actualizado:**

```javascript
const transcripts = $json.transcripts;

// Detectar el idioma basándose en las keys disponibles
let language = 'ingles'; // default
let customTranscription = '';

if (transcripts.en_auto && transcripts.en_auto.custom) {
  customTranscription = transcripts.en_auto.custom;
  language = 'ingles';
} else if (transcripts.es_auto && transcripts.es_auto.custom) {
  customTranscription = transcripts.es_auto.custom;
  language = 'español';
} else {
  // Buscar la primera key disponible
  const firstKey = Object.keys(transcripts)[0];
  if (firstKey && transcripts[firstKey].custom) {
    customTranscription = transcripts[firstKey].custom;
    language = firstKey.includes('es') ? 'español' : 'ingles';
  }
}

return [{
  json: {
    custom_transcription: customTranscription,
    language: language
  }
}];
```

---

## 🔑 APIs de RapidAPI que Necesitas

### **1. Instagram Transcripts**
- **URL**: https://rapidapi.com/destreetbucks/api/instagram-transcripts
- **Pricing**: Gratis (100 requests/mes)
- **Subscription**: Basic Plan
- **API Key**: Ya la tienes (`b9bfd2e714msh1d8562a125fcf38p158099jsnacd3920979be`)

### **2. TikTok Transcript**
- **URL**: https://rapidapi.com/destreetbucks/api/tiktok-transcript
- **Pricing**: Gratis (ilimitado en Basic)
- **Subscription**: Basic Plan
- **API Key**: La misma key de arriba

**Nota**: Debes suscribirte a estas APIs en RapidAPI (plan gratis) para que funcionen.

---

## 📊 Diagrama del Flujo Actualizado

```
[Webhook]
  ↓
[Find User Protocol]
  ↓
[Switch: URL existe?] → [VIDEO URL]
  ↓
[Edit Fields] (normaliza como 'link')
  ↓
[Platform Detector] (Code: detecta YouTube/Instagram/TikTok)
  ↓
[Switch by Platform]
  ├── [YouTube] → [HTTP Request YouTube] → [merge]
  ├── [Instagram] → [Get Instagram Transcript] → [Format Instagram Response] → [merge]
  └── [TikTok] → [Get TikTok Transcript] → [Format TikTok Response] → [merge]
  ↓
[TRANSCRIPTS] (unifica las 3 fuentes)
  ↓
[CUSTOM TRANSCRIPTION y LANG]
  ↓
[AI Study Agent]
  ↓
[RESPONSE]
  ↓
[Insert Education Content] + [Respond to Webhook]
```

---

## ✅ Checklist de Implementación

- [ ] Modificar nodo "Code" → "Platform Detector"
- [ ] Actualizar nodo "Switch" con 3 outputs
- [ ] Mantener rama de YouTube intacta
- [ ] Crear rama de Instagram:
  - [ ] HTTP Request
  - [ ] Format Response
- [ ] Crear rama de TikTok:
  - [ ] HTTP Request
  - [ ] Format Response
- [ ] Conectar las 3 ramas al nodo "TRANSCRIPTS"
- [ ] Actualizar nodo "CUSTOM TRANSCRIPTION y LANG"
- [ ] Suscribirse a las APIs en RapidAPI (gratis)
- [ ] Probar con URLs de ejemplo:
  - [ ] YouTube
  - [ ] Instagram Reel
  - [ ] TikTok video

---

## 🧪 URLs de Prueba

Para testear el flujo:

**YouTube:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Instagram:**
```
https://www.instagram.com/reel/C1abc123XYZ/
```

**TikTok:**
```
https://www.tiktok.com/@username/video/7123456789012345678
```

---

## 🚨 Posibles Errores y Soluciones

### Error: "Quota exceeded"
**Causa**: Excediste el límite gratuito  
**Solución**: Esperar al próximo mes o upgradar el plan

### Error: "Invalid URL"
**Causa**: La URL no es válida o la plataforma no la soporta  
**Solución**: Verificar que la URL sea pública y no privada

### Error: "No transcript available"
**Causa**: El video no tiene transcripción automática  
**Solución**: Implementar fallback a Whisper (futuro)

---

## 📝 Notas Finales

1. **Las APIs gratuitas tienen límites de rate**: No hagas más de 5 requests por segundo.
2. **Algunas cuentas privadas no funcionarán**: Solo contenido público.
3. **Si necesitas mayor volumen**: Considera upgradar a planes pagos o implementar Whisper como fallback.

---

**Fecha de creación**: 2026-02-05  
**Autor**: NSG AI Assistant  
**Versión**: 1.0
