import { useState, useEffect } from 'react'

const COMPARISON_TABLE_STORAGE_KEY = 'crane_comparison_table'

/**
 * Core hook for managing comparison table state
 * Handles loading from localStorage and providing the comparison table array
 *
 * @returns {Object} { comparisonTable, setComparisonTable }
 */
const useComparisonTableState = () => {
  const [comparisonTable, setComparisonTable] = useState([])

  // Load comparison table from localStorage on mount
  useEffect(() => {
    try {
      const storedTable = localStorage.getItem(COMPARISON_TABLE_STORAGE_KEY)
      if (storedTable) {
        const parsedTable = JSON.parse(storedTable)
        setComparisonTable(parsedTable)
      }
    } catch (error) {
      console.error('Error loading comparison table:', error)
      // Clear corrupted data
      localStorage.removeItem(COMPARISON_TABLE_STORAGE_KEY)
    }
  }, [])

  return { comparisonTable, setComparisonTable }
}

export default useComparisonTableState
