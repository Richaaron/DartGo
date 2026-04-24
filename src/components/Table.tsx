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
}

export default function Table({ columns, data, actions }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-purple-200/40 dark:border-purple-600/60">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-900/50 dark:to-purple-800/50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="table-header text-left"
              >
                {column.label}
              </th>
            ))}
            {actions && <th className="table-header text-left">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-100 dark:divide-purple-800/30">
          {data.map((row, index) => (
            <tr 
              key={index} 
              className="hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-colors duration-200 group"
            >
              {columns.map((column) => (
                <td key={column.key} className="table-cell">
                  {row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="table-cell">
                  <div className="flex gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-semibold transition-all hover:scale-110"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
