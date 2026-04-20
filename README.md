# DentalArte — Clínica Odontológica

Sitio web moderno para clínica odontológica construido con **Next.js** y listo para publicar en **Vercel**.

## 🚀 Cómo publicar en Vercel

### Opción 1 — Desde GitHub (recomendado)

1. Sube este proyecto a tu repositorio GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión
3. Haz clic en **"New Project"**
4. Importa tu repositorio `capston`
5. Vercel detectará automáticamente que es un proyecto Next.js
6. Haz clic en **"Deploy"** — ¡listo!

### Opción 2 — CLI de Vercel

```bash
npm install -g vercel
cd capston
npm install
vercel
```

## 💻 Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del proyecto

```
capston/
├── pages/
│   ├── _app.js          # App wrapper con estilos globales
│   ├── index.js         # Página de inicio (landing)
│   └── login.js         # Página de login / registro
├── styles/
│   ├── globals.css      # Estilos globales y variables CSS
│   ├── Home.module.css  # Estilos de la página de inicio
│   └── Login.module.css # Estilos del login
├── package.json
├── next.config.js
└── vercel.json
```

## ✨ Características

- **Página de inicio** con hero, servicios, nosotros, testimonios y footer
- **Login / Registro** con validación de formularios en tiempo real
- **Diseño moderno** con paleta verde esmeralda y tipografía elegante
- **Responsive** — funciona en móvil, tablet y escritorio
- **Listo para Vercel** — sin configuración adicional necesaria
