import { useState } from 'react';

function DataTable({
  columns,
  data,
  onRowClick,
  sortable = true,
  searchable = true,
  pagination = true,
  pageSize = 10,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filtering
  const filteredData = searchable && searchTerm
    ? data.filter(row =>
      columns.some(col => {
        const value = col.accessor ? col.accessor(row) : row[col.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    )
    : data;

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = columns.find(col => col.key === sortConfig.key)?.accessor
      ? columns.find(col => col.key === sortConfig.key).accessor(a)
      : a[sortConfig.key];
    const bValue = columns.find(col => col.key === sortConfig.key)?.accessor
      ? columns.find(col => col.key === sortConfig.key).accessor(b)
      : b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="w-full" dir="rtl">
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                    className={`
                      px-6 py-3 text-right text-sm font-medium text-gray-700
                      ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''}
                    `}
                  >
                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                      <span>{column.label}</span>
                      {sortable && column.sortable !== false && sortConfig.key === column.key && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    אין נתונים להצגה
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                        {column.render
                          ? column.render(row[column.key], row)
                          : column.accessor
                            ? column.accessor(row)
                            : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              מציג {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} מתוך {sortedData.length}
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                הקודם
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
