# DentalArte — Clínica Odontológica

Sitio web moderno para clínica odontológica construido con **Next.js 14** y totalmente optimizado para **Vercel**.

## 🚀 Despliegue en Vercel (Recomendado)

### Opción 1 — Despliegue automático desde GitHub (MÁS FÁCIL)

1. **Ve a [vercel.com](https://vercel.com)** y haz login con tu cuenta GitHub
2. Haz clic en **Import Project**
3. Selecciona el repositorio `capston`
4. Vercel detectará automáticamente que es un proyecto Next.js
5. Haz clic en **Deploy** — ¡Listo en 1-2 minutos!

### Opción 2 — Desde CLI de Vercel

```bash
npm install -g vercel
vercel
```

Sigue los prompts interactivos para vincular tu proyecto.

## 💻 Desarrollo local

### Requisitos
- Node.js v18.17.0 o superior
- npm o yarn

### Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Comandos disponibles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build para producción
npm start        # Ejecutar build en producción
```

## 📁 Estructura del proyecto

```
capston/
├── pages/
│   ├── _app.js              # App wrapper con estilos globales
│   ├── index.js             # Página de inicio (landing)
│   └── login.js             # Página de login y registro
├── styles/
│   ├── globals.css          # Estilos globales y variables CSS
│   ├── Home.module.css      # Estilos de la página de inicio
│   └── Login.module.css     # Estilos de login/registro
├── public/                  # Archivos estáticos
├── .env.example             # Template de variables de entorno
├── package.json
├── next.config.js
├── vercel.json              # Configuración para Vercel
└── README.md
```

## 🔧 Configuración

### Variables de entorno

1. Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` con tus valores

3. Para Vercel, configura variables en **Project Settings → Environment Variables**

## 🎨 Características

- ✅ **Diseño moderno** con animaciones suaves
- ✅ **Responsive** en todos los dispositivos
- ✅ **Next.js 14** con optimizaciones de producción
- ✅ **CSS Modules** para estilos encapsulados
- ✅ **Formularios validados** (login, registro)
- ✅ **Google Fonts** integradas
- ✅ **SEO optimizado** con meta tags
- ✅ **Performance optimizado** para Vercel

## 🌐 Despliegue en Producción

### ¿Has desplegado en Vercel?

Una vez desplegado, tu sitio estará disponible en:
```
https://capston.vercel.app
```

O si configuras un dominio personalizado:
```
https://tu-dominio.com
```

### Monitorar despliegues

En el dashboard de Vercel puedes:
- Ver logs de build y runtime
- Visualizar Analytics
- Configurar Webhooks
- Revertir a versiones anteriores

## 📞 Contacto y Soporte

- **Email**: hola@dentalarte.cl
- **Teléfono**: +56 2 2345 6789
- **Ubicación**: Santiago, Chile

## 📄 Licencia

Todos los derechos reservados © 2026 DentalArte

## ✨ Características

- **Página de inicio** con hero, servicios, nosotros, testimonios y footer
- **Login / Registro** con validación de formularios en tiempo real
- **Diseño moderno** con paleta verde esmeralda y tipografía elegante
- **Responsive** — funciona en móvil, tablet y escritorio
- **Listo para Vercel** — sin configuración adicional necesaria
