# Viajes DaiCo

Tu segundo cerebro para viajeros. Plataforma para planificar, gestionar y recordar todos tus viajes.

## Stack

- **Next.js 15** — Framework React con App Router
- **Supabase** — Base de datos PostgreSQL + Autenticación
- **Tailwind CSS** — Estilos con paleta nude/beige
- **Recharts** — Gráficos de gastos

---

## Instalación paso a paso

### 1. Clonar o descomprimir el proyecto

```bash
cd viajes-daico
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear una cuenta gratuita
2. Crear un nuevo proyecto
3. Esperar a que se inicialice (1-2 minutos)
4. Ir a **Settings → API** y copiar:
   - `Project URL`
   - `anon public` key

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y completar con tus credenciales:

```bash
cp .env.local.example .env.local
```

Abrir `.env.local` y pegar tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 4. Crear las tablas en Supabase

1. En el dashboard de Supabase, ir a **SQL Editor**
2. Copiar todo el contenido del archivo `supabase/migrations/001_init.sql`
3. Pegar en el editor y ejecutar con **Run**

Esto crea todas las tablas, políticas de seguridad y el trigger de perfil automático.

### 5. Configurar autenticación (opcional: Google Login)

1. En Supabase ir a **Authentication → Providers → Google**
2. Activar Google y seguir las instrucciones para obtener Client ID y Secret desde Google Console
3. Agregar como Redirect URL: `https://XXXXXXXXXX.supabase.co/auth/v1/callback`

### 6. Correr el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/          → Página principal
│   ├── login/              → Inicio de sesión
│   ├── register/           → Registro
│   ├── viajes/
│   │   ├── page.tsx        → Lista de viajes
│   │   ├── new/page.tsx    → Crear viaje
│   │   └── [id]/
│   │       ├── page.tsx         → Resumen del viaje
│   │       ├── itinerario/      → Días y actividades
│   │       ├── reservas/        → Vuelos, hoteles, etc.
│   │       ├── gastos/          → Registro de gastos + gráfico
│   │       ├── checklist/       → Listas personalizadas
│   │       └── diario/          → Diario de viaje
│   └── auth/callback/      → OAuth redirect
├── components/
│   └── layout/Sidebar.tsx  → Navegación lateral
├── lib/
│   ├── supabase/           → Clientes (browser, server, middleware)
│   └── utils.ts            → Helpers, formateo, constantes
└── types/index.ts          → Tipos TypeScript

supabase/
└── migrations/001_init.sql → Schema completo de la base de datos
```

## Módulos incluidos (MVP)

- ✅ Registro e inicio de sesión (email + Google)
- ✅ Dashboard con próximo viaje y estadísticas
- ✅ Crear y listar viajes
- ✅ Itinerario por días con actividades
- ✅ Reservas (vuelos, hoteles, trenes, etc.)
- ✅ Gastos con gráfico por categoría
- ✅ Checklist personalizable
- ✅ Diario de viaje

## Próximas versiones

- Clima (OpenWeather API)
- Road Trip Planner (Google Maps)
- Asistente IA (OpenAI)
- Exportación PDF
