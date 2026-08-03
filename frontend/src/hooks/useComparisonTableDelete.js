import { useCallback } from 'react'

const COMPARISON_TABLE_STORAGE_KEY = 'crane_comparison_table'

/**
 * Hook for deleting entries from comparison table
 *
 * @param {Array} comparisonTable - Current comparison table array
 * @param {Function} setComparisonTable - Function to update comparison table state
 * @returns {Object} { deleteSingleEntry } - Function to delete a single entry
 */
const useComparisonTableDelete = (comparisonTable, setComparisonTable) => {
  /**
   * Delete a single entry from comparison table
   * @param {number} entryId - ID of the entry to delete
   */
  const deleteSingleEntry = useCallback(
    (entryId) => {
      try {
        setComparisonTable((prevTable) => {
          const updatedTable = prevTable.filter((entry) => entry.id !== entryId)

          // Save to localStorage
          localStorage.setItem(
            COMPARISON_TABLE_STORAGE_KEY,
            JSON.stringify(updatedTable),
          )

          return updatedTable
        })
      } catch (error) {
        console.error('Error deleting comparison table entry:', error)
      }
    },
    [setComparisonTable],
  )

  return { deleteSingleEntry }
}

export default useComparisonTableDelete
