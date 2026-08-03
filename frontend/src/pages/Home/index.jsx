import React, { useEffect, useState } from 'react'
import { Header } from 'semantic-ui-react'

import { fetchFilteredCranes } from '@/src/api/cranes'
import logo from '@/src/assets/crane_list_icon.png'
import CranesFilterSidebar from '@/src/components/CranesFilterSidebar'
import CranesList from '@/src/components/CranesList'
import {
  FILTERS_API_TIMEOUT,
  FILTERS_STORAGE_KEY,
  PAGINATION_SIZE,
} from '@/src/config'
import './Home.css'

/**
 * Default filter values
 */
const getDefaultFilters = () => ({
  model: '', // Search by crane model
  chassis_type: '', // Filter by chassis type (mobile, tower, etc.)
  manufacturer: '', // Filter by manufacturer
  country: '', // Filter by country
  min_max_lc: '', // Minimum lifting capacity filter
  max_max_lc: '', // Maximum lifting capacity filter
  radius: '', // Radius filter for deep filtering
  payload: '', // Payload filter for deep filtering
  sortBy: 'displayNameAsc', // Current sort criteria (default: Name ascending)
})

/**
 * Load filters from localStorage
 */
const loadFiltersFromStorage = () => {
  try {
    const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (storedFilters) {
      const parsedFilters = JSON.parse(storedFilters)
      // Merge with defaults to ensure all fields exist
      return { ...getDefaultFilters(), ...parsedFilters }
    }
  } catch (error) {
    console.error('Error loading filters from storage:', error)
    // Clear corrupted data
    localStorage.removeItem(FILTERS_STORAGE_KEY)
  }
  return getDefaultFilters()
}

/**
 * Save filters to localStorage
 */
const saveFiltersToStorage = (filters) => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch (error) {
    console.error('Error saving filters to storage:', error)
  }
}

/**
 * Main Home component - displays a filterable and sortable list of cranes
 * Features:
 * - Filter cranes by name, chassis type, manufacturer, and capacity range
 * - Sort cranes by various criteria (handled by backend)
 * - Load-more pagination for large datasets
 * - Real-time search with debouncing
 * - Responsive hidable sidebar
 * - Persists filter state between page navigations
 */
const Home = () => {
  // State for storing the list of cranes fetched from API
  const [cranes, setCranes] = useState([])
  // Loading state to show spinner while fetching data
  const [loading, setLoading] = useState(true)
  // Error state to display error messages if API call fails
  const [error, setError] = useState(null)
  // Pagination state
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filter state object containing all current filter values
  // Load from localStorage on mount
  const [filters, setFilters] = useState(() => loadFiltersFromStorage())

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters)
  }, [filters])

  /**
   * Effect hook that runs whenever filters change
   * Handles fetching and pagination of crane data (sorting handled by backend)
   */
  useEffect(() => {
    // Async function to load crane data from API (reset pagination)
    const loadCranes = async () => {
      setLoading(true) // Show loading spinner
      setError(null) // Clear any previous errors

      try {
        // Fetch filtered and sorted crane data from backend API with pagination reset
        const response = await fetchFilteredCranes(filters, 0, PAGINATION_SIZE)

        // Update state with crane data (already sorted by backend) and pagination info
        setCranes(response.cranes)
        setTotalCount(response.cranes_count)
        setHasMore(response.has_more)
      } catch (error_) {
        // Handle API errors with user-friendly message
        setError('Не удалось загрузить краны. Пожалуйста, попробуйте снова.')
        console.error('Ошибка загрузки кранов:', error_)
      } finally {
        setLoading(false) // Hide loading spinner
      }
    }

    // Debounce the API call to avoid excessive requests while user is typing
    // Waits FILTERS_API_TIMEOUT ms after last filter change before making API call
    const timeoutId = setTimeout(loadCranes, FILTERS_API_TIMEOUT)

    // Cleanup function to cancel pending API call if filters change again
    return () => clearTimeout(timeoutId)
  }, [filters]) // Dependency array: effect runs when filters object changes

  /**
   * Handler for filter changes from the sidebar component
   * @param {Function} filterUpdater - Function that returns new filter state
   */
  const handleFiltersChange = (filterUpdater) => {
    setFilters(filterUpdater)
  }

  /**
   * Handler to reset all filters to their default values
   * Clears search terms and resets sort to default
   */
  const handleClearFilters = () => {
    const defaultFilters = getDefaultFilters()
    setFilters(defaultFilters)
    // Clear from localStorage as well
    localStorage.removeItem(FILTERS_STORAGE_KEY)
  }

  /**
   * Handler for loading more cranes (pagination)
   * Fetches next batch of cranes and appends to existing list
   */
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    setError(null)

    try {
      // Fetch next batch of cranes using current offset
      const response = await fetchFilteredCranes(
        filters,
        cranes.length,
        PAGINATION_SIZE,
      )

      // Append new cranes to existing list (already sorted by backend)
      setCranes((prevCranes) => [...prevCranes, ...response.cranes])
      setHasMore(response.has_more)
      setTotalCount(response.cranes_count)
    } catch (error_) {
      setError(
        'Не удалось загрузить больше кранов. Пожалуйста, попробуйте снова.',
      )
      console.error('Ошибка загрузки дополнительных кранов:', error_)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className='home-container'>
      {/* Cranes list header */}
      <Header as='h1' className='main-header center-content'>
        <img
          src={logo}
          alt='Crane lifting capacity calculator logo'
          className='crane-list-icon'
        />
        <Header.Content className='font-size-1'>
          Доступные краны
          <Header.Subheader>
            Показано: {cranes.length} из {totalCount}
          </Header.Subheader>
        </Header.Content>
      </Header>

      {/* Sidebar */}
      <aside className='home-sidebar'>
        <CranesFilterSidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </aside>

      {/* Main Content */}
      <main className='home-main-content'>
        <CranesList
          cranes={cranes}
          loading={loading}
          error={error}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      </main>
    </div>
  )
}

export default Home
