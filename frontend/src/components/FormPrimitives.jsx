/* ── Reusable form primitives for the Autollenado module ── */

/** Section card wrapper with title and optional icon */
export function SectionCard({ title, subtitle, icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-[15px] font-semibold text-bbva-dark">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/** Sub-group divider inside a section */
export function SubGroup({ title, children }) {
  return (
    <div className="mt-6 first:mt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-bbva-blue/70 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-bbva-aqua" />
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Labelled text input */
export function FormInput({ label, name, value, onChange, type = 'text', placeholder = '', required = false, readOnly = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-all duration-200
          ${readOnly
            ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue'
          }`}
      />
    </div>
  );
}

/** Labelled select dropdown */
export function FormSelect({ label, name, value, onChange, options = [], placeholder = 'Seleccionar...', required = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 appearance-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all duration-200"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Dynamic table with add/remove rows */
export function DynamicTable({ title, columns, rows, onRowChange, onAddRow, onRemoveRow }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bbva-blue bg-bbva-sky hover:bg-bbva-light rounded-lg transition-colors duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar fila
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-8">#</th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-bbva-sky/30 transition-colors">
                <td className="px-3 py-2 text-xs text-slate-400 font-medium">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5">
                    {col.type === 'select' ? (
                      <select
                        value={row[col.key] || ''}
                        onChange={(e) => onRowChange(idx, col.key, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-bbva-blue/30 focus:border-bbva-blue transition-all"
                      >
                        <option value="">—</option>
                        {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={col.type || 'text'}
                        value={row[col.key] || ''}
                        onChange={(e) => onRowChange(idx, col.key, e.target.value)}
                        placeholder={col.placeholder || ''}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-bbva-blue/30 focus:border-bbva-blue transition-all"
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveRow(idx)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Eliminar fila"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
