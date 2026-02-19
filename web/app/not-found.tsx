export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d2d82] to-[#1a56db]">
            <div className="text-center px-6">
                <div className="text-[120px] font-bold text-white/10 leading-none select-none">404</div>
                <div className="relative -mt-8">
                    <h1 className="text-4xl font-bold text-white mb-3">Página no encontrada</h1>
                    <p className="text-white/60 text-base mb-8 max-w-sm mx-auto">
                        La página que buscas no existe o fue movida.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1a56db] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-black/20"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Ir al inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
