// Header que replica la identidad visual de capacitatecarso.com:
// una barra superior teal delgada y, debajo, la barra de navegación oscura
// con el logotipo "CAPACÍTATE carso".

export function CarsoHeader({
  rightSlot,
}: {
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="w-full">
      {/* Barra superior teal */}
      <div className="h-9 w-full bg-carso-teal" />

      {/* Barra de navegación oscura */}
      <div className="w-full bg-carso-dark border-b-2 border-carso-teal">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-[11px] font-light uppercase tracking-[0.25em] text-gray-300">
              Capacítate
            </span>
            <span className="text-2xl font-extrabold lowercase italic text-white">
              carso
            </span>
            <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-carso-teal" />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-200">
            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  );
}
