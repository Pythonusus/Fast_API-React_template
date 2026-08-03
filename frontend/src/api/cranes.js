/**
 * API requests for fetching cranes and related data
 * @module api/cranes
 */

import { fetchWithLicense } from '@midasoft/license-checker-module'

import { PAGINATION_SIZE } from '@/src/config'
import { formatFormValue } from '@/src/utilities/formatters'

/**
 * Fetches filtered cranes from the backend with pagination support
 * @param {Object} [filters={}] - Criteria to filter cranes
 * @param {number} [offset=0] - Number of items to skip (for pagination)
 * @param {number} [limit=PAGINATION_SIZE] - Number of items to return
 * @returns {Promise<Object>} Object containing cranes array and pagination info
 *
 * @example
 * Get all cranes (no filters)
 * fetchFilteredCranes()
 *
 * Filter by single criteria
 * fetchFilteredCranes({ chassis_type: 'mobile' })
 *
 * Filter with pagination
 * fetchFilteredCranes({ model: 'LR1100' }, 0, 10)
 *
 * Filter by multiple criteria
 * fetchFilteredCranes({
 *   model: 'LR1100',
 *   chassis_type: 'mobile',
 *   manufacturer: 'Liebherr',
 *   min_max_lc: 100,
 *   max_max_lc: 500,
 * })
 */
export const fetchFilteredCranes = async (
  filters = {},
  offset = 0,
  limit = PAGINATION_SIZE,
) => {
  // Clean up filters: convert empty strings to null
  const cleanedFilters = {
    model: formatFormValue(filters.model),
    manufacturer: formatFormValue(filters.manufacturer),
    chassis_type: formatFormValue(filters.chassis_type),
    country: formatFormValue(filters.country),
    min_max_lc: formatFormValue(filters.min_max_lc),
    max_max_lc: formatFormValue(filters.max_max_lc),
    radius: formatFormValue(filters.radius),
    payload: formatFormValue(filters.payload),
    // Include sorting parameter
    sortBy: filters.sortBy || 'displayNameAsc',
    // Add pagination parameters
    offset,
    limit,
  }

  const response = await fetchWithLicense('/api/cranes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cleanedFilters),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch cranes')
  }

  const data = await response.json()
  return {
    cranes: data.cranes || [],
    cranes_count: data.cranes_count || 0,
    has_more: data.has_more || false,
    returned_count: data.returned_count || 0,
  }
}

/**
 * Fetches all available chassis types from the backend
 * @returns {Promise<string[]>} List of available chassis types
 */
export const fetchChassisTypes = async () => {
  const response = await fetchWithLicense('/api/chassis-types')

  if (!response.ok) {
    throw new Error('Failed to fetch chassis types')
  }

  const data = await response.json()
  return data.chassisTypes || []
}

/**
 * Fetches all available manufacturers from the backend
 * @returns {Promise<string[]>} List of available manufacturers
 */
export const fetchManufacturers = async () => {
  const response = await fetchWithLicense('/api/manufacturers')

  if (!response.ok) {
    throw new Error('Failed to fetch manufacturers')
  }

  const data = await response.json()
  return data.manufacturers || []
}

/**
 * Fetches all available countries from the backend
 * @returns {Promise<string[]>} List of available countries
 */
export const fetchCountries = async () => {
  const response = await fetchWithLicense('/api/countries')

  if (!response.ok) {
    throw new Error('Failed to fetch countries')
  }

  const data = await response.json()
  return data.countries || []
}

/**
 * Fetches all available sorting options from the backend
 * @returns {Promise<Array>} List of available sorting options
 */
export const fetchSortOptions = async () => {
  const response = await fetchWithLicense('/api/sort-options')

  if (!response.ok) {
    throw new Error('Failed to fetch sort options')
  }

  const data = await response.json()
  return data.sortOptions || []
}

/**
 * Fetches a single crane by name from the backend
 * @param {string} craneName - Name of the crane to fetch (format: "Manufacturer Model")
 * @returns {Promise<Object>} The crane object
 */
export const fetchCraneByName = async (craneName) => {
  const response = await fetchWithLicense(
    `/api/cranes/${encodeURIComponent(craneName)}`,
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Crane not found')
    }
    throw new Error('Failed to fetch crane')
  }

  return await response.json()
}
