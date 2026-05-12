interface Column {
  key: string
  label: string
}

interface Action {
  label: string
  onClick: (row: any) => void
}

interface TableProps {
  columns: Column[]
  data: any[]
  actions?: Action[]
  renderCell?: (row: any, key: string) => React.ReactNode
}

export default function Table({ columns, data, actions, renderCell }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-[2rem] border border-white/5 shadow-2xl bg-folusho-slate-900/40 backdrop-blur-xl">
      <table className="w-full">
        <thead>
          <tr className="bg-white/5 border-b border-white/5">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-8 py-6 text-left text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.3em]"
              >
                {column.label}
              </th>
            ))}
            {actions && <th className="px-8 py-6 text-left text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.3em]">Operational Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr 
              key={index} 
              className="group hover:bg-white/5 transition-all duration-300"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-8 py-6 text-sm font-bold text-folusho-cream-100">
                  {renderCell 
                    ? renderCell(row, column.key) 
                    : (row[column.key] !== null && row[column.key] !== undefined ? row[column.key] : '-')
                  }
                </td>
              ))}
              {actions && (
                <td className="px-8 py-6">
                  <div className="flex gap-4 opacity-40 group-hover:opacity-100 transition-all duration-300">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row)}
                        className="text-[10px] font-black text-folusho-sage-400 hover:text-folusho-sage-300 uppercase tracking-widest px-4 py-2 bg-white/5 rounded-xl border border-white/5 transition-all hover:scale-105 active:scale-95"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-8 py-24 text-center">
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.4em]">No Personnel Records Detected in Matrix</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
