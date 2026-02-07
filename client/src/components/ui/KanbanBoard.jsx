import { useState } from 'react';
import { motion } from 'framer-motion';

function KanbanBoard({ columns, items, onItemMove, onItemClick }) {
  const [localItems, setLocalItems] = useState(items);

  const handleStatusChange = (itemId, newStatus) => {
    const newItems = localItems.map(item => {
      if (item.id === itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setLocalItems(newItems);
    if (onItemMove) {
      onItemMove(itemId, newStatus);
    }
  };

  const getItemsForColumn = (columnId) => {
    return localItems.filter(item => item.status === columnId);
  };

  return (
    <div className="flex space-x-4 space-x-reverse overflow-x-auto pb-4" dir="rtl">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>{column.title}</span>
            <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-sm">
              {getItemsForColumn(column.id).length}
            </span>
          </h3>
          <div className="space-y-3">
            {getItemsForColumn(column.id).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onItemClick && onItemClick(item)}
                className="bg-white rounded-lg shadow-sm p-4 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                )}
                {item.meta && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(item.meta).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
                {column.allowStatusChange && (
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {columns.map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
