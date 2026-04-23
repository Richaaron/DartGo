interface Column {
  key: string
  label: string
}

interface TableProps {
  columns: Column[]
  data: any[]
}

export default function Table({ columns, data }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-purple-700/50 bg-gray-50 dark:bg-gradient-to-r dark:from-slate-700/80 dark:to-slate-800/80">
            {columns.map((column) => (
              <th
                key={column.key}
                className="table-header text-left"
              >
                {column.label}
              </th>
            ))}
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-purple-900/20 transition-colors">
              {columns.map((column) => (
                <td key={column.key} className="table-cell">
                  {row[column.key]}
                </td>
              ))}
              <td className="table-cell">{row.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
