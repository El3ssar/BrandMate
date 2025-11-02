# Brand Guardian IA (Auditor Multimodal)

Asistente web para auditar assets de campañas contra guías de marca.
Arquitectura modular + proxy backend para usar varios proveedores (Gemini, OpenAI, Grok).

## Requisitos
- Node 18+
- Claves API en `.env` (ver `.env.example`)

## Arranque
```bash
cp .env.example .env
# Rellena las claves en .env
npm install
npm run dev
# Abre http://localhost:3000

