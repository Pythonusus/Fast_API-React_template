/**
 * Pagination configuration for the application
 *
 * Default number of items to load per page/batch
 * Used for initial load and "Show More" functionality
 */
export const PAGINATION_SIZE = Number.parseInt(
  import.meta.env.PAGINATION_SIZE || '30',
  10,
)

/**
 * Maximum number of history entries to store
 */
export const MAX_HISTORY_ENTRIES = 50

/**
 * Maximum number of comparison table entries to store
 */
export const MAX_COMPARISON_TABLE_ENTRIES = 10

/**
 * Storage key for comparison table
 */
export const COMPARISON_TABLE_STORAGE_KEY = 'crane_comparison_table'

/**
 * Storage key for history
 */
export const HISTORY_STORAGE_KEY = 'crane_calculation_history'

/**
 * Storage key for comparison form data
 */
export const COMPARISON_FORM_STORAGE_KEY = 'crane_comparison_form_data'

/**
 * Storage key for comparison results (best cranes info)
 */
export const COMPARISON_RESULTS_STORAGE_KEY = 'crane_comparison_results'

/**
 * Storage key for crane filters
 */
export const FILTERS_STORAGE_KEY = 'crane_filters'

/**
 * Timeout for popup messages
 */
export const POPUP_TIMEOUT = 3000

/**
 * Timeout in ms since last filters change before calling the API
 */
export const FILTERS_API_TIMEOUT = 800

/**
 * Friendly countries for sorting preference
 * Ordered list of countries that should be preferred when sorting cranes with the same price:
 * 1. Российская Федерация (highest priority)
 * 2. Other friendly countries (ГДР, Китай)
 * 3. All other countries (lowest priority)
 */
export const FRIENDLY_COUNTRIES = ['Российская Федерация', 'ГДР', 'Китай']
