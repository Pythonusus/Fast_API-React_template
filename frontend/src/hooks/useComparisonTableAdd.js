import { useCallback } from 'react'

import { fetchCraneByName } from '@/src/api/cranes'
import { MAX_COMPARISON_TABLE_ENTRIES } from '@/src/config'

const COMPARISON_TABLE_STORAGE_KEY = 'crane_comparison_table'

/**
 * Hook for adding entries to comparison table
 *
 * @param {Array} comparisonTable - Current comparison table array
 * @param {Function} setComparisonTable - Function to update comparison table state
 * @returns {Object} { addCraneToComparison } - Function to add crane
 */
const useComparisonTableAdd = (setComparisonTable) => {
  /**
   * Add a crane to the comparison table by fetching full crane data
   * @param {string} craneName - Name of the crane (manufacturer_model format)
   * @returns {Promise<{success: boolean, reason?: string}>} Result object with success status and optional reason
   */
  const addCraneToComparison = useCallback(
    async (craneName) => {
      try {
        // Fetch full crane data from API first
        const fullCrane = await fetchCraneByName(craneName)

        if (!fullCrane) {
          console.error('Failed to fetch crane data')
          return { success: false, reason: 'fetch_failed' }
        }

        // Prepare crane data structure with full crane data
        const craneData = {
          name: fullCrane.name || craneName,
          manufacturer: fullCrane.manufacturer,
          model: fullCrane.model,
          country: fullCrane.country || '',
          chassis_type: fullCrane.chassis_type || '',
          base_price: fullCrane.base_price || 0,
          lc_tables: fullCrane.lc_tables || {},
          lc_tables_names: fullCrane.lc_tables_names || [],
        }

        // Set default boom length to first available for 'Основная стрела' table
        const defaultBoomLength =
          craneData.lc_tables['Основная стрела'].boom_lengths[0]

        // Generate truly unique ID using crypto.randomUUID() if available, otherwise use high-precision timestamp + random
        const generateUniqueId = () => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID()
          }
          // Fallback: microsecond precision timestamp + random string (Math.random is safe for non-crypto ID generation)
          // eslint-disable-next-line
          const random1 = Math.random().toString(36).slice(2, 11)
          // eslint-disable-next-line
          const random2 = Math.random().toString(36).slice(2, 11)
          return `${performance.now()}-${random1}-${random2}`
        }

        // Create new entry
        const newEntry = {
          id: generateUniqueId(),
          crane: craneData,
          selectedBoomLength: defaultBoomLength,
          results: {
            lifting_capacity: null,
            safety_factor: null,
            remaining_lc: null,
          },
        }

        // Read from localStorage first to get the latest state across all instances
        let currentTable = []
        try {
          const storedTable = localStorage.getItem(COMPARISON_TABLE_STORAGE_KEY)
          if (storedTable) {
            currentTable = JSON.parse(storedTable)
          }
        } catch (error) {
          console.error('Error reading from localStorage:', error)
          return { success: false, reason: 'storage_error' }
        }

        // Check if limit is reached
        if (currentTable.length >= MAX_COMPARISON_TABLE_ENTRIES) {
          return { success: false, reason: 'limit_reached' }
        }

        // Add to comparison table
        const updatedTable = [...currentTable, newEntry]

        // Save to localStorage
        localStorage.setItem(
          COMPARISON_TABLE_STORAGE_KEY,
          JSON.stringify(updatedTable),
        )

        // Update state
        setComparisonTable(updatedTable)

        return { success: true }
      } catch (error) {
        console.error('Error adding crane to comparison table:', error)
        return { success: false, reason: 'error' }
      }
    },
    [setComparisonTable],
  )

  return {
    addCraneToComparison,
  }
}

export default useComparisonTableAdd
