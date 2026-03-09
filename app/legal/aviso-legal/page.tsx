import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Aviso Legal - Servipartz",
  description: "Aviso legal y condiciones de uso de Servipartz POS",
};

export default function AvisoLegalPage() {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Aviso Legal</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

      <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Identificación del titular</h2>
          <p>
            La aplicación Servipartz POS es operada por SERVIPARTZ, dedicada a la venta de repuestos
            de electrodomésticos.
          </p>
          <p className="mt-2">
            <strong>Domicilio:</strong> Av. José San Healy 385, Olivares, 83180 Hermosillo, Sonora, México.
          </p>
          <p>
            <strong>Teléfono:</strong> 662 404 9965
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Objeto</h2>
          <p>
            El presente aviso legal regula el acceso y uso de la aplicación Servipartz POS, un sistema
            de punto de venta para gestión de inventario y ventas de repuestos de electrodomésticos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Condiciones de uso</h2>
          <p>
            El usuario se compromete a utilizar la aplicación de forma lícita, respetando la
            legislación vigente y los derechos de terceros. Queda prohibido el uso indebido,
            fraudulento o que pueda dañar el sistema o a otros usuarios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Propiedad intelectual</h2>
          <p>
            Todos los contenidos, diseños, logotipos y software de la aplicación son propiedad de
            SERVIPARTZ o de sus licenciantes y están protegidos por las leyes de propiedad intelectual.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Limitación de responsabilidad</h2>
          <p>
            SERVIPARTZ no se hace responsable de daños indirectos, pérdida de datos o interrupciones
            del servicio que puedan derivarse del uso de la aplicación. El usuario es responsable de
            mantener la confidencialidad de sus credenciales de acceso.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar la aplicación y el presente aviso legal en
            cualquier momento. Los cambios serán efectivos desde su publicación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Legislación aplicable</h2>
          <p>
            El presente aviso legal se rige por la legislación mexicana. Cualquier controversia
            será sometida a los tribunales competentes de Hermosillo, Sonora.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
        <Link href="/legal/privacidad" className="text-primary-600 hover:underline text-sm">
          Política de Privacidad
        </Link>
        <Link href="/legal/cookies" className="text-primary-600 hover:underline text-sm">
          Política de Cookies
        </Link>
        <Link href="/" className="text-primary-600 hover:underline text-sm">
          Inicio
        </Link>
      </div>
    </article>
  );
}
