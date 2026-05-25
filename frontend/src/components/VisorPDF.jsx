import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ── Worker config ─────────────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const SCALE_STEP = 0.25;
const SCALE_MIN  = 0.25;
const SCALE_MAX  = 4.0;

// ── Placeholder para páginas fuera del viewport ──────────────────────────────
const PagePlaceholder = ({ width }) => (
  <div
    className="bg-white shadow-xl rounded-sm animate-pulse"
    style={{ width: width ?? 700, height: Math.round((width ?? 700) * 1.414) }}
  />
);

// ── Sub-componente con IntersectionObserver por página ───────────────────────
const LazyPDFPage = React.memo(({ pageNumber, scale, width, rootRef }) => {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !rootRef?.current) return;

    // Margen de 300px: empezamos a renderizar antes de que llegue al viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // una vez visible, nunca volvemos al placeholder
        }
      },
      { root: rootRef.current, rootMargin: '300px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <div
      ref={wrapperRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: pageNumber === 1 ? '20px' : '10px',
        paddingBottom: '10px',
        paddingLeft: '20px',
        paddingRight: '20px',
        minHeight: '100px',       // evita que el observer colapse la altura antes de medir
      }}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          scale={scale}
          width={width}
          renderTextLayer={false}       // OFF = menos RAM, más velocidad en preview
          renderAnnotationLayer={false}
          className="shadow-xl rounded-sm"
        />
      ) : (
        <PagePlaceholder width={width} />
      )}
    </div>
  );
});
LazyPDFPage.displayName = 'LazyPDFPage';

// ── Íconos ────────────────────────────────────────────────────────────────────
const Spinner = ({ cls = 'w-5 h-5' }) => (
  <svg className={`${cls} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ToolBtn = ({ id, onClick, disabled, title, children }) => (
  <button
    id={id}
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: 'transparent', border: 'none', color: '#e8eaed',
      cursor: disabled ? 'default' : 'pointer', borderRadius: '4px',
      padding: '4px 6px', display: 'flex', alignItems: 'center',
      transition: 'background 0.15s', opacity: disabled ? 0.35 : 1,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);

// ── Componente principal ──────────────────────────────────────────────────────
function VisorPDFInner({ previewUrl, isPreviewLoading, setIsPreviewLoading }) {
  const [numPages,   setNumPages]   = useState(null);
  const [scale,      setScale]      = useState(1.0);
  const [pageWidth,  setPageWidth]  = useState(null);

  // Refs de scroll y medición
  const scrollAreaRef  = useRef(null);
  const scrollPosRef   = useRef(0);          // ← posición de scroll guardada
  const prevUrlRef     = useRef(null);        // ← para detectar cambio de blob

  // ── Medir ancho del contenedor ──────────────────────────────────────────────
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setPageWidth(w);
    });
    ro.observe(scrollAreaRef.current);
    setPageWidth(scrollAreaRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ── Guardar posición de scroll en cada movimiento ──────────────────────────
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollPosRef.current = scrollAreaRef.current.scrollTop;
    }
  }, []);

  // ── Restaurar scroll después de que react-pdf cambie el DOM ────────────────
  // useLayoutEffect se ejecuta síncronamente ANTES del paint del navegador.
  // Detectamos cuando el previewUrl cambia (nuevo blob cargado).
  useLayoutEffect(() => {
    if (!previewUrl || !scrollAreaRef.current) return;

    // Solo restaurar si es una actualización (misma sesión de edición), no la primera carga
    if (prevUrlRef.current && prevUrlRef.current !== previewUrl) {
      const saved = scrollPosRef.current;
      if (saved > 0) {
        // Aplicar inmediatamente
        scrollAreaRef.current.scrollTop = saved;

        // Fallback: react-pdf puede mutar el DOM asíncronamente al renderizar páginas.
        // Usamos un MutationObserver corto para re-aplicar el scroll si se pierde.
        const el = scrollAreaRef.current;
        const observer = new MutationObserver(() => {
          if (Math.abs(el.scrollTop - saved) > 5) {
            el.scrollTop = saved;
          }
        });
        observer.observe(el, { childList: true, subtree: true });

        // Desconectar después de 500ms — suficiente para que react-pdf termine
        const timer = setTimeout(() => observer.disconnect(), 500);
        return () => {
          observer.disconnect();
          clearTimeout(timer);
        };
      }
    }
    prevUrlRef.current = previewUrl;
  }, [previewUrl]);

  // ── Al cargar el documento: actualizar numPages y restaurar scroll ─────────
  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setIsPreviewLoading(false);

    // Restaurar scroll con doble rAF como respaldo adicional
    const saved = scrollPosRef.current;
    if (saved > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = saved;
      }));
    }
  }, [setIsPreviewLoading]);

  const onDocumentLoadError = useCallback((err) => {
    console.error('[VisorPDF]', err);
    setIsPreviewLoading(false);
  }, [setIsPreviewLoading]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomOut = () => setScale(s => Math.max(SCALE_MIN, parseFloat((s - SCALE_STEP).toFixed(2))));
  const zoomIn  = () => setScale(s => Math.min(SCALE_MAX, parseFloat((s + SCALE_STEP).toFixed(2))));

  const effectiveWidth = pageWidth ? Math.min(pageWidth - 40, 900) : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#323639' }}>

      {/* ── TOOLBAR ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 select-none"
        style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#323639' }}
      >
        {/* Izquierda: loader */}
        <div style={{ width: '120px' }}>
          {isPreviewLoading && (
            <div className="flex items-center gap-2" style={{ color: '#9aa0a6', fontSize: '12px' }}>
              <Spinner cls="w-3.5 h-3.5" />
              Actualizando…
            </div>
          )}
        </div>

        {/* Centro: info de páginas */}
        <span style={{ color: '#9aa0a6', fontSize: '12px' }}>
          {numPages ? `${numPages} página${numPages > 1 ? 's' : ''}` : 'Vista Previa'}
        </span>

        {/* Derecha: controles de zoom */}
        <div className="flex items-center gap-1" style={{ width: '120px', justifyContent: 'flex-end' }}>
          <ToolBtn id="visor-zoom-out" onClick={zoomOut} disabled={!previewUrl || scale <= SCALE_MIN} title="Reducir zoom">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </ToolBtn>
          <span style={{ color: '#e8eaed', fontSize: '12px', minWidth: '38px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(scale * 100)}%
          </span>
          <ToolBtn id="visor-zoom-in" onClick={zoomIn} disabled={!previewUrl || scale >= SCALE_MAX} title="Aumentar zoom">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </ToolBtn>
        </div>
      </div>

      {/* ── ÁREA DE SCROLL ── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-auto"
        style={{ background: '#525659' }}
      >
        {previewUrl ? (
          <>
            {/* Overlay de actualización — contenido dentro del área gris */}
            {isPreviewLoading && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl">
                  <Spinner cls="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Actualizando documento…</span>
                </div>
              </div>
            )}

            <Document
              file={previewUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-16" style={{ color: '#9aa0a6' }}>
                  <Spinner cls="w-5 h-5 mr-3" /> Cargando PDF…
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-16" style={{ color: '#f28b82' }}>
                  <svg className="w-10 h-10 mb-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Error al cargar el documento
                </div>
              }
            >
              {/* Render LAZY de cada página */}
              {numPages && Array.from({ length: numPages }, (_, i) => (
                <LazyPDFPage
                  key={i}
                  pageNumber={i + 1}
                  scale={scale}
                  width={effectiveWidth}
                  rootRef={scrollAreaRef}
                />
              ))}
            </Document>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8" style={{ color: '#9aa0a6' }}>
            <svg className="w-14 h-14 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-base font-semibold" style={{ color: '#bdc1c6' }}>Vista Previa del Documento</p>
            <p className="text-sm mt-2 max-w-xs leading-relaxed">
              Seleccione una plantilla y complete el formulario para visualizar el PDF en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── React.memo para evitar re-renders innecesarios desde el padre ────────────
const VisorPDF = React.memo(VisorPDFInner);
VisorPDF.displayName = 'VisorPDF';
export default VisorPDF;
