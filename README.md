# CODECAR — Sitio Web con Asesor IA

## Estructura

```
codecar/
├── index.html        ← Sitio completo (frontend)
├── api/
│   └── chat.js       ← Serverless function (proxy seguro a Groq)
├── vercel.json       ← Configuración de Vercel
└── README.md
```

## Deploy en Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "feat: codecar site with groq chat"
git remote add origin https://github.com/TU_USUARIO/codecar.git
git push -u origin main
```

### 2. Importar en Vercel
- Ir a [vercel.com](https://vercel.com) → **Add New Project**
- Conectar el repo de GitHub
- Hacer click en **Deploy** (sin tocar nada más)

### 3. Configurar la API Key (IMPORTANTE)
En Vercel → tu proyecto → **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `GROQ_API_KEY` | `gsk_xxxxxxxxxxxxxxxxxxxx` |

Después de agregar la variable: **Redeploy** el proyecto.

## Cómo funciona
El frontend llama a `/api/chat` (nunca a Groq directamente).  
La función serverless recibe la request, agrega la key desde la variable de entorno, y reenvía a Groq.  
La key **nunca queda expuesta** en el código del navegador.
