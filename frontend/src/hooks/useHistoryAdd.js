import { useCallback } from 'react'

const HISTORY_STORAGE_KEY = 'crane_calculation_history'
const MAX_HISTORY_ENTRIES = 50

/**
 * Hook for adding calculations to history
 *
 * @param {Array} history - Current history array
 * @param {Function} setHistory - Function to update history state
 * @returns {Function} addToHistory - Function to add a calculation to history
 */
const useHistoryAdd = (history, setHistory) => {
  /**
   * Add a new calculation to history
   * @param {Object} calculation - Calculation data to store
   * @param {string} calculation.manufacturer - Manufacturer of the crane
   * @param {string} calculation.model - Model of the crane
   * @param {string} calculation.country - Country of the crane
   * @param {string} calculation.chassisType - Chassis type of the crane
   * @param {number} calculation.maxLiftingCapacity - Maximum lifting capacity of the crane
   * @param {number} calculation.basePrice - Base price of the crane
   * @param {Object} calculation.result - Calculation result from API (contains request data)
   * @param {string} calculation.calculationMethod - 'payload' or 'safety_factor'
   */
  const addToHistory = useCallback(
    (calculation) => {
      try {
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

        const newEntry = {
          id: generateUniqueId(),
          // Store only crane metadata
          manufacturer: calculation.manufacturer,
          model: calculation.model,
          country: calculation.country || '',
          chassisType: calculation.chassisType,
          maxLiftingCapacity: calculation.maxLiftingCapacity,
          basePrice: calculation.basePrice || null,
          // Store calculation method and result (request data is in result)
          calculationMethod: calculation.calculationMethod,
          result: calculation.result,
          timestamp: new Date().toISOString(),
        }

        setHistory((prevHistory) => {
          // Add new entry to the beginning and limit to MAX_HISTORY_ENTRIES
          const updatedHistory = [newEntry, ...prevHistory].slice(
            0,
            MAX_HISTORY_ENTRIES,
          )

          // Save to localStorage
          localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(updatedHistory),
          )

          return updatedHistory
        })
      } catch (error) {
        console.error('Error saving calculation to history:', error)
      }
    },
    [setHistory],
  )

  return { addToHistory }
}

export default useHistoryAdd
