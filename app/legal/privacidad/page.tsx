import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad - Servipartz",
  description: "Política de privacidad y protección de datos personales de Servipartz POS",
};

export default function PrivacidadPage() {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

      <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Responsable del tratamiento</h2>
          <p>
            SERVIPARTZ, con domicilio en Av. José San Healy 385, Olivares, 83180 Hermosillo, Sonora, México,
            es responsable del tratamiento de los datos personales que recaba a través de la aplicación
            Servipartz POS (en adelante, &quot;la Aplicación&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Datos que recabamos</h2>
          <p>Recabamos los siguientes datos personales:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Correo electrónico y contraseña (para acceso a la aplicación)</li>
            <li>Nombre del usuario o empleado</li>
            <li>Datos de ventas e inventario generados durante el uso de la aplicación</li>
            <li>Datos de navegación y uso (cookies, direcciones IP) según se indica en nuestra Política de Cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Finalidad del tratamiento</h2>
          <p>Utilizamos sus datos para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Proporcionar acceso a la aplicación y gestionar su cuenta</li>
            <li>Registrar ventas, inventario y movimientos de la tienda</li>
            <li>Generar reportes y facturación electrónica (CFDI)</li>
            <li>Cumplir con obligaciones legales y fiscales</li>
            <li>Mejorar nuestros servicios</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Base legal</h2>
          <p>
            El tratamiento se basa en su consentimiento, la ejecución del contrato de servicios,
            el cumplimiento de obligaciones legales y el interés legítimo de SERVIPARTZ.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Compartir datos</h2>
          <p>
            No vendemos ni compartimos sus datos personales con terceros, salvo cuando sea necesario
            para el funcionamiento del servicio (por ejemplo, proveedores de hosting o servicios de
            autenticación) o cuando la ley lo exija.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Sus derechos</h2>
          <p>
            De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP), usted tiene derecho a acceder, rectificar, cancelar u oponerse
            al tratamiento de sus datos personales. Para ejercer estos derechos, contacte a:
            <strong className="block mt-2"> 662 404 9965</strong> o acuda a nuestro domicilio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger sus datos contra accesos no
            autorizados, alteración, divulgación o destrucción.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Cambios</h2>
          <p>
            Nos reservamos el derecho de modificar esta política. Los cambios se publicarán en esta
            página con la fecha de actualización.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
        <Link href="/legal/cookies" className="text-primary-600 hover:underline text-sm">
          Política de Cookies
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
