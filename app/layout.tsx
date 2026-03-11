import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";
import AppHeightSync from "@/components/AppHeightSync";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

const siteUrl =
  typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://servipartzpos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SERVIPARTZ | Punto de Venta",
  description: "Control de inventario y ventas multi-tienda",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
  manifest: "/manifest.webmanifest",
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    title: "SERVIPARTZ | Punto de Venta",
    description: "Control de inventario y ventas multi-tienda",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SERVIPARTZ | Punto de Venta",
    description: "Control de inventario y ventas multi-tienda",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full w-full overflow-hidden">
      <body className={`${plusJakarta.variable} font-sans h-full w-full overflow-hidden`}>
        {/* Filtro de consola (primer nodo en body) para deploy/consola limpia */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var oLog = console.log, oWarn = console.warn, oInfo = console.info, oError = console.error;
                var toStr = function(a) {
                  if (typeof a === 'string') return a;
                  if (a != null && typeof a === 'object') try { return JSON.stringify(a); } catch (e) { return String(a); }
                  return String(a);
                };
                var fullMsg = function(args) {
                  return Array.prototype.slice.call(args).map(toStr).join(' ');
                };
                var skip = function(msg) {
                  var s = (msg == null ? '' : toStr(msg)).toLowerCase();
                  var cspEval = /content.security.policy|content security policy|contentsecuritypolicy|csp.*eval|eval.*csp|script-src.*blocked|blocks the use of|blocks the use of.*eval|blocks the use of.*javascript|violates the following directive|violated-directive|unsafe-eval|allow string evaluation|inline script injection|learn more.*content security|to solve this issue|avoid using eval|new function\(\)|settimeout.*string|1 directive|source location|directive.*status|blocked.*eval|your site blocks/i.test(s) || (s.indexOf('eval') !== -1 && (s.indexOf('block') !== -1 || s.indexOf('policy') !== -1 || s.indexOf('directive') !== -1 || s.indexOf('security') !== -1 || s.indexOf('csp') !== -1));
                  var firebaseDeprec = /enableindexeddbpersistence|enableindexeddb.*deprecated|firestoresettings\\.cache|@firebase\\/firestore.*deprecated|persistentlocalcache/i.test(s);
                  return (
                    cspEval ||
                    firebaseDeprec ||
                    /React DevTools|Download the React DevTools|Fast Refresh|preload.*layout\\.css|pol[ií]tica de seguridad/i.test(s) ||
                    /ERR_EMPTY_RESPONSE|Failed to load resource|net::|Load failed|ResizeObserver loop|ChunkLoadError|Loading chunk \\d+ failed|Dynamic server usage/i.test(s) ||
                    /Hydration|Text content does not match|Did not expect server HTML|Minified React error|Warning: .* did not match/i.test(s) ||
                    /\\[HMR\\]|Hot Module Replacement|react-refresh|webpack.*warn|Source map/i.test(s) ||
                    /favicon\\.ico|manifest\\.webmanifest|sw\\.js|service worker|Failed to load resource/i.test(s)
                  );
                };
                var filter = function(orig) {
                  return function() {
                    if (skip(fullMsg(arguments))) return;
                    orig.apply(console, arguments);
                  };
                };
                console.log = filter(oLog);
                console.warn = filter(oWarn);
                console.info = filter(oInfo);
                console.error = filter(oError);
              })();
            `,
          }}
        />
        <AppHeightSync />
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}
