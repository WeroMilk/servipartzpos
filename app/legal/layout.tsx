export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen h-dvh max-h-dvh overflow-y-auto overflow-x-hidden bg-slate-50 py-8 px-4 sm:px-6" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="max-w-3xl mx-auto prose prose-slate pb-8">
        {children}
      </div>
    </div>
  );
}
