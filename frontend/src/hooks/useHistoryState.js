import { useState, useEffect } from 'react'

const HISTORY_STORAGE_KEY = 'crane_calculation_history'

/**
 * Core hook for managing calculation history state
 * Handles loading from localStorage and providing the history array
 *
 * @returns {Array} history - Array of calculation history entries
 */
const useHistoryState = () => {
  const [history, setHistory] = useState([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        setHistory(parsedHistory)
      }
    } catch (error) {
      console.error('Error loading calculation history:', error)
      // Clear corrupted data
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
  }, [])

  return { history, setHistory }
}

export default useHistoryState
