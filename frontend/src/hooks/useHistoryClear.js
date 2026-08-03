import { useCallback } from 'react'

const HISTORY_STORAGE_KEY = 'crane_calculation_history'

/**
 * Hook for clearing calculation history
 *
 * @param {Array} history - Current history array
 * @param {Function} setHistory - Function to update history state
 * @returns {Function} clearHistory - Function to clear all history
 */
const useHistoryClear = (history, setHistory) => {
  /**
   * Clear all calculation history
   */
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
      setHistory([])
    } catch (error) {
      console.error('Error clearing calculation history:', error)
    }
  }, [setHistory])

  return { clearHistory }
}

export default useHistoryClear
