import { useCallback } from 'react'

import { COMPARISON_RESULTS_STORAGE_KEY } from '@/src/config'

const COMPARISON_TABLE_STORAGE_KEY = 'crane_comparison_table'

/**
 * Hook for clearing comparison table
 *
 * @param {Array} comparisonTable - Current comparison table array
 * @param {Function} setComparisonTable - Function to update comparison table state
 * @returns {Object} { clearComparisonTable } - Function to clear all entries
 */
const useComparisonTableClear = (comparisonTable, setComparisonTable) => {
  /**
   * Clear all comparison table entries
   */
  const clearComparisonTable = useCallback(() => {
    try {
      localStorage.removeItem(COMPARISON_TABLE_STORAGE_KEY)
      localStorage.removeItem(COMPARISON_RESULTS_STORAGE_KEY)
      setComparisonTable([])
    } catch (error) {
      console.error('Error clearing comparison table:', error)
    }
  }, [setComparisonTable])

  return { clearComparisonTable }
}

export default useComparisonTableClear
