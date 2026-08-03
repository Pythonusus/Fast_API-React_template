import { useCallback } from 'react'

const HISTORY_STORAGE_KEY = 'crane_calculation_history'

/**
 * Hook for deleting calculations from history
 *
 * @param {Array} history - Current history array
 * @param {Function} setHistory - Function to update history state
 * @returns {Function} deleteSingleEntry - Function to delete a single entry from history
 */
const useHistoryDelete = (history, setHistory) => {
  /**
   * Delete a single calculation entry from history
   * @param {number} entryId - ID of the entry to delete
   */
  const deleteSingleEntry = useCallback(
    (entryId) => {
      try {
        setHistory((prevHistory) => {
          const updatedHistory = prevHistory.filter(
            (entry) => entry.id !== entryId,
          )

          // Save to localStorage
          localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(updatedHistory),
          )

          return updatedHistory
        })
      } catch (error) {
        console.error('Error deleting calculation entry:', error)
      }
    },
    [setHistory],
  )

  return { deleteSingleEntry }
}

export default useHistoryDelete
