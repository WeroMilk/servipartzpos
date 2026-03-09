import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Cookies - SERVIPARTZ",
  description: "Política de cookies de SERVIPARTZ POS",
};

export default function CookiesPage() {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Política de Cookies</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

      <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando
            visita nuestra aplicación. Nos permiten recordar sus preferencias y mejorar su experiencia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Cookies que utilizamos</h2>
          <p>Utilizamos los siguientes tipos de cookies:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Cookies técnicas (necesarias):</strong> Esenciales para el funcionamiento de la
              aplicación (sesión, autenticación, preferencias de tienda).
            </li>
            <li>
              <strong>Cookies de almacenamiento local:</strong> Para guardar datos de inventario,
              ventas y configuración cuando la aplicación funciona en modo offline o demo.
            </li>
            <li>
              <strong>Service Worker:</strong> Para permitir la instalación como PWA y el caché
              de recursos para uso offline.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Finalidad</h2>
          <p>
            Las cookies se utilizan exclusivamente para garantizar el correcto funcionamiento de
            SERVIPARTZ POS, mantener su sesión activa, recordar la tienda seleccionada y permitir
            el uso offline de la aplicación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Duración</h2>
          <p>
            Las cookies de sesión se eliminan al cerrar el navegador. Las cookies de almacenamiento
            local (localStorage) persisten hasta que el usuario las borre o caduquen según su
            configuración.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Cómo gestionar las cookies</h2>
          <p>
            Puede configurar su navegador para rechazar o eliminar cookies. Tenga en cuenta que
            desactivar las cookies técnicas puede impedir el correcto funcionamiento de la aplicación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Más información</h2>
          <p>
            Para cualquier duda sobre el uso de cookies, contacte a SERVIPARTZ al 662 404 9965 o
            acuda a nuestro domicilio en Av. José San Healy 385, Olivares, Hermosillo, Sonora.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
        <Link href="/legal/privacidad" className="text-primary-600 hover:underline text-sm">
          Política de Privacidad
        </Link>
        <Link href="/legal/aviso-legal" className="text-primary-600 hover:underline text-sm">
          Aviso Legal
        </Link>
        <Link href="/" className="text-primary-600 hover:underline text-sm">
          Inicio
        </Link>
      </div>
    </article>
  );
}
