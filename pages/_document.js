import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        {/*
          Script síncrono anti-flash: se ejecuta antes de que React hidrate.
          Lee sessionStorage y aplica data-theme al <html> inmediatamente,
          evitando el parpadeo de tema incorrecto en la primera carga.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=sessionStorage.getItem('odontool-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
