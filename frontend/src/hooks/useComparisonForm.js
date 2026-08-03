import { useCallback, useState, useEffect } from 'react'

import {
  calculateSafetyFactor,
  createSafetyFactorRequest,
} from '@/src/api/calcRequests'
import {
  COMPARISON_TABLE_STORAGE_KEY,
  COMPARISON_FORM_STORAGE_KEY,
  COMPARISON_RESULTS_STORAGE_KEY,
  FRIENDLY_COUNTRIES,
} from '@/src/config'
import useHistoryAdd from '@/src/hooks/useHistoryAdd'
import useHistoryState from '@/src/hooks/useHistoryState'

/**
 * Validates if radius is valid for a crane's boom length
 * @param {Object} crane - The crane object
 * @param {string} boomLength - The boom length to check
 * @param {number} radius - The radius value to validate
 * @returns {Object} Object with isValid boolean and error message if invalid
 */
const validateRadiusForCrane = (crane, boomLength, radius) => {
  if (!crane || !boomLength || radius === null || radius === undefined) {
    return { isValid: false, error: 'Недостаточно данных для проверки' }
  }

  try {
    const radiusTable =
      // eslint-disable-next-line security/detect-object-injection
      crane.lc_tables?.['Основная стрела']?.table?.[boomLength]
    if (!radiusTable) {
      return { isValid: false, error: 'Конфигурация стрелы не найдена' }
    }

    const radiusKeys = Object.keys(radiusTable)
      .map(Number)
      .toSorted((a, b) => a - b)

    if (radiusKeys.length === 0) {
      return { isValid: false, error: 'Нет доступных значений вылета' }
    }

    const radiusMin = radiusKeys.at(0)
    const radiusMax = radiusKeys.at(-1)

    if (radius < radiusMin || radius > radiusMax) {
      return {
        isValid: false,
        error: `Невозможно выполнить расчет. Допустимый вылет для данной конфигурации ${radiusMin} - ${radiusMax}`,
        radiusMin,
        radiusMax,
      }
    }

    return { isValid: true, error: null }
  } catch (error) {
    console.error('Error validating radius for crane:', error)
    return { isValid: false, error: 'Ошибка при проверке вылета' }
  }
}

/**
 * Get country priority for sorting (lower = higher priority)
 * 0 = Российская Федерация
 * 1 = Other friendly countries (ГДР, Китай)
 * 2 = All other countries
 */
const getCountryPriority = (country) => {
  if (!country) return 2
  if (country === 'Российская Федерация') return 0
  if (FRIENDLY_COUNTRIES.includes(country)) return 1
  return 2
}

// Helper function to normalize numeric input (convert comma to dot for parsing)
const normalizeNumericInput = (value) => {
  if (!value) return value
  return value.replace(',', '.')
}

/**
 * Custom hook for managing comparison form state and logic
 *
 * Handles form data, validation, API calls for multiple cranes, and saving to history.
 * Provides all necessary state and handlers for the comparison form.
 *
 * @param {Array} comparisonTable - Array of comparison table entries
 * @param {Function} setComparisonTable - Function to update comparison table state
 * @returns {Object} Form state and handlers
 * @returns {Object} returns.formData - Current form field values
 * @returns {string} returns.formData.boomRadius - Boom radius value
 * @returns {string} returns.formData.equipmentWeight - Equipment weight value (optional)
 * @returns {string} returns.formData.payload - Payload value
 * @returns {Object} returns.errors - Error messages for popups
 * @returns {Object} returns.validationErrors - Validation errors for field styling
 * @returns {boolean} returns.isSubmitting - Loading state during calculation
 * @returns {Array|null} returns.comparisonResults - Array of calculation results for each crane
 * @returns {Function} returns.handleInputChange - Handler for form field changes (field: string, value: string)
 * @returns {Function} returns.handleSubmit - Handler for form submission (event: Event)
 * @returns {Function} returns.handleClearForm - Handler to reset form (no parameters)
 */
const useComparisonForm = (comparisonTable, setComparisonTable) => {
  const { history, setHistory } = useHistoryState()
  const { addToHistory } = useHistoryAdd(history, setHistory)

  // Load form data from localStorage on mount
  const [formData, setFormData] = useState(() => {
    try {
      const storedFormData = localStorage.getItem(COMPARISON_FORM_STORAGE_KEY)
      if (storedFormData) {
        const parsed = JSON.parse(storedFormData)
        return {
          boomRadius: parsed.boomRadius || '',
          equipmentWeight: parsed.equipmentWeight || '',
          payload: parsed.payload || '',
        }
      }
    } catch (error) {
      console.error('Error loading comparison form data:', error)
    }
    return {
      boomRadius: '',
      equipmentWeight: '',
      payload: '',
    }
  })

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        COMPARISON_FORM_STORAGE_KEY,
        JSON.stringify(formData),
      )
    } catch (error) {
      console.error('Error saving comparison form data:', error)
    }
  }, [formData])

  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load comparison results from localStorage on mount
  const [comparisonResults, setComparisonResults] = useState(() => {
    try {
      const storedResults = localStorage.getItem(COMPARISON_RESULTS_STORAGE_KEY)
      if (storedResults) {
        return JSON.parse(storedResults)
      }
    } catch (error) {
      console.error('Error loading comparison results:', error)
    }
    return null
  })

  // Save comparison results to localStorage whenever it changes
  useEffect(() => {
    try {
      if (comparisonResults) {
        localStorage.setItem(
          COMPARISON_RESULTS_STORAGE_KEY,
          JSON.stringify(comparisonResults),
        )
      } else {
        localStorage.removeItem(COMPARISON_RESULTS_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error saving comparison results:', error)
    }
  }, [comparisonResults])

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear both popup and field styling when user starts typing
      // eslint-disable-next-line security/detect-object-injection
      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev }
          // eslint-disable-next-line security/detect-object-injection
          updated[field] = ''
          return updated
        })
      }
      // eslint-disable-next-line security/detect-object-injection
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const updated = { ...prev }
          // eslint-disable-next-line security/detect-object-injection
          updated[field] = ''
          return updated
        })
      }
    },
    [errors, validationErrors],
  )

  const validateForm = useCallback(() => {
    const newErrors = {}
    const newValidationErrors = {}

    // Validate boom radius
    if (!formData.boomRadius || formData.boomRadius.trim() === '') {
      newErrors.boomRadius = 'Вылет стрелы обязателен для заполнения'
      newValidationErrors.boomRadius = true
    } else {
      const radius = Number.parseFloat(
        normalizeNumericInput(formData.boomRadius),
      )
      if (Number.isNaN(radius) || radius <= 0) {
        newErrors.boomRadius = 'Вылет стрелы должен быть положительным числом'
        newValidationErrors.boomRadius = true
      }
    }

    // Validate payload
    if (!formData.payload || formData.payload.trim() === '') {
      newErrors.payload = 'Вес груза обязателен для заполнения'
      newValidationErrors.payload = true
    } else {
      const payload = Number.parseFloat(normalizeNumericInput(formData.payload))
      if (Number.isNaN(payload) || payload <= 0) {
        newErrors.payload = 'Вес груза должен быть положительным числом'
        newValidationErrors.payload = true
      }
    }

    // Validate equipment weight (optional, but if provided must be valid)
    if (formData.equipmentWeight && formData.equipmentWeight.trim() !== '') {
      const equipmentWeight = Number.parseFloat(
        normalizeNumericInput(formData.equipmentWeight),
      )
      if (Number.isNaN(equipmentWeight) || equipmentWeight < 0) {
        newErrors.equipmentWeight =
          'Вес строповочного оборудования должен быть неотрицательным числом'
        newValidationErrors.equipmentWeight = true
      }
    }

    // Validate that comparison table is not empty
    if (!comparisonTable || comparisonTable.length === 0) {
      newErrors.general = 'Добавьте краны в таблицу сравнения'
    }

    setErrors(newErrors)
    setValidationErrors(newValidationErrors)

    return Object.keys(newErrors).length === 0
  }, [formData, comparisonTable])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)
      setComparisonResults(null)

      try {
        const radius = Number.parseFloat(
          normalizeNumericInput(formData.boomRadius),
        )

        // Prepare all requests and validate radius
        const prepareRequest = (entry) => {
          const crane = entry.crane
          const craneName = crane.name || `${crane.manufacturer}_${crane.model}`

          // Get selected boom length or default to first available
          const availableBoomLengths =
            crane.lc_tables['Основная стрела']?.boom_lengths || []
          const boomLength =
            entry.selectedBoomLength ||
            (availableBoomLengths.length > 0 ? availableBoomLengths[0] : null)

          if (!boomLength) {
            return {
              entryId: entry.id,
              crane,
              craneName,
              boomLength: null,
              request: null,
              radiusError: 'Кран не имеет доступных конфигураций стрелы',
            }
          }

          // Validate radius for this crane and boom length
          const radiusValidation = validateRadiusForCrane(
            crane,
            boomLength,
            radius,
          )

          if (!radiusValidation.isValid) {
            return {
              entryId: entry.id,
              crane,
              craneName,
              boomLength,
              request: null,
              radiusError: radiusValidation.error,
              radiusMin: radiusValidation.radiusMin,
              radiusMax: radiusValidation.radiusMax,
            }
          }

          return {
            entryId: entry.id,
            crane,
            craneName,
            boomLength,
            request: createSafetyFactorRequest(
              craneName,
              boomLength,
              radius,
              formData.equipmentWeight
                ? Number.parseFloat(
                    normalizeNumericInput(formData.equipmentWeight),
                  )
                : 0,
              Number.parseFloat(normalizeNumericInput(formData.payload)),
            ),
            radiusError: null,
          }
        }

        const requests = comparisonTable.map((entry) => prepareRequest(entry))

        // Execute all requests in parallel
        const executeCalculation = async ({
          entryId,
          crane,
          craneName,
          boomLength,
          request,
          radiusError,
          radiusMin,
          radiusMax,
        }) => {
          // If radius is invalid, return error immediately without API call
          if (radiusError) {
            return {
              entryId,
              success: false,
              error: radiusError,
              crane,
              craneName,
              boomLength,
              radiusMin,
              radiusMax,
            }
          }

          // If no request (e.g., no boom length), return error
          if (!request) {
            return {
              entryId,
              success: false,
              error: 'Невозможно выполнить расчет',
              crane,
              craneName,
              boomLength,
            }
          }

          try {
            const result = await calculateSafetyFactor(request)

            // Calculate remaining lifting capacity
            const remainingLc =
              result.lifting_capacity -
              request.payload -
              request.equipment_weight

            return {
              entryId,
              success: true,
              result: {
                ...result,
                remaining_lc: remainingLc,
              },
              crane,
              craneName,
              boomLength,
            }
          } catch (error) {
            console.error(`Error calculating for crane ${craneName}:`, error)
            return {
              entryId,
              success: false,
              error: error.message || 'Ошибка при выполнении расчета',
              crane,
              craneName,
              boomLength,
            }
          }
        }

        const results = await Promise.all(
          requests.map((req) => executeCalculation(req)),
        )

        // Update comparison table with results
        const findResultForEntry = (entryId, calculationResults) => {
          return calculationResults.find((r) => r.entryId === entryId)
        }

        const updateEntryWithResult = (entry, calculationResults) => {
          const result = findResultForEntry(entry.id, calculationResults)
          if (result && result.success) {
            return {
              ...entry,
              results: {
                lifting_capacity: result.result.lifting_capacity,
                safety_factor: result.result.safety_factor,
                remaining_lc: result.result.remaining_lc,
                error: null,
                radiusMin: null,
                radiusMax: null,
              },
            }
          }
          if (result && !result.success) {
            // Use the error message from result, which includes radius range if available
            const errorMessage = result.error || 'невозможно выполнить расчет'
            return {
              ...entry,
              results: {
                lifting_capacity: null,
                safety_factor: null,
                remaining_lc: null,
                error: errorMessage,
                radiusMin: result.radiusMin || null,
                radiusMax: result.radiusMax || null,
              },
            }
          }
          return entry
        }

        // Helper: Get entry priority (0=successful, 1=unsafe, 2=other, 3=error)
        // Errors should be last, so they get the highest priority number
        const getEntryPriority = (entry) => {
          const hasError = !!entry.results?.error
          const safetyFactor = entry.results?.safety_factor

          if (hasError) return 3 // Errors last
          if (typeof safetyFactor === 'number' && safetyFactor >= 1) {
            return 0 // Successful first
          }
          if (typeof safetyFactor === 'number' && safetyFactor < 1) {
            return 1 // Unsafe second
          }
          return 2 // Other (no results) third
        }

        const updateTableWithResults = (prevTable, calculationResults) => {
          const updatedTable = prevTable.map((entry) =>
            updateEntryWithResult(entry, calculationResults),
          )

          // Sort the table: successful (by price) -> unsafe -> errors
          const sortedTable = [...updatedTable].sort((a, b) => {
            const aPriority = getEntryPriority(a)
            const bPriority = getEntryPriority(b)

            // Compare by priority first
            if (aPriority !== bPriority) {
              return aPriority - bPriority
            }

            // Same priority: handle special cases
            if (aPriority === 0) {
              // Both successful: sort by price, then by country, then by boom length index
              const aPrice = a.crane.base_price || Infinity
              const bPrice = b.crane.base_price || Infinity
              const priceDiff = aPrice - bPrice
              if (priceDiff !== 0) {
                return priceDiff
              }
              // Same price: sort by country priority
              // (Российская Федерация first, then other friendly countries, then others)
              const aCountryPriority = getCountryPriority(a.crane.country)
              const bCountryPriority = getCountryPriority(b.crane.country)
              const countryDiff = aCountryPriority - bCountryPriority
              if (countryDiff !== 0) {
                return countryDiff
              }
              // Same price and country: sort by boom length index (smaller indexes first)
              const aBoomLengths =
                a.crane.lc_tables['Основная стрела']?.boom_lengths || []
              const bBoomLengths =
                b.crane.lc_tables['Основная стрела']?.boom_lengths || []
              const aSelectedBoomLength =
                a.selectedBoomLength ||
                (aBoomLengths.length > 0 ? aBoomLengths[0] : null)
              const bSelectedBoomLength =
                b.selectedBoomLength ||
                (bBoomLengths.length > 0 ? bBoomLengths[0] : null)
              const aBoomIndex = aSelectedBoomLength
                ? aBoomLengths.indexOf(aSelectedBoomLength)
                : Infinity
              const bBoomIndex = bSelectedBoomLength
                ? bBoomLengths.indexOf(bSelectedBoomLength)
                : Infinity
              return aBoomIndex - bBoomIndex
            }

            // For unsafe, error, or other: keep original order
            return 0
          })

          // Save to localStorage
          localStorage.setItem(
            COMPARISON_TABLE_STORAGE_KEY,
            JSON.stringify(sortedTable),
          )

          return sortedTable
        }

        setComparisonTable((prevTable) =>
          updateTableWithResults(prevTable, results),
        )

        // Save successful calculations to history
        for (const result of results) {
          if (result.success) {
            addToHistory({
              manufacturer: result.crane.manufacturer,
              model: result.crane.model,
              country: result.crane.country || '',
              chassisType: result.crane.chassis_type || 'Unknown',
              maxLiftingCapacity:
                result.crane.max_lifting_capacity || 'Unknown',
              basePrice: result.crane.base_price || null,
              calculationMethod: 'safety_factor',
              result: result.result,
            })
          }
        }

        // Calculate best cranes from successful results with safety factor >= 1
        // Exclude cranes with radius validation errors or other errors
        const successfulResults = results.filter((r) => r.success)
        const validResults = successfulResults.filter(
          (r) =>
            r.result.safety_factor !== null &&
            r.result.safety_factor !== undefined &&
            r.result.safety_factor >= 1,
        )
        let cheapestCrane = null
        let smallestSafetyFactorCrane = null

        if (validResults.length > 0) {
          // Find cheapest crane (lowest base_price, with country preference on tie)
          cheapestCrane = validResults.reduce((min, current) => {
            const minPrice = min.crane.base_price || Infinity
            const currentPrice = current.crane.base_price || Infinity

            // If prices differ, prefer cheaper one
            if (currentPrice < minPrice) return current
            if (currentPrice > minPrice) return min

            // Same price: prefer by country (Российская Федерация > friendly > others)
            const minCountryPriority = getCountryPriority(min.crane.country)
            const currentCountryPriority = getCountryPriority(
              current.crane.country,
            )
            if (currentCountryPriority < minCountryPriority) return current
            if (currentCountryPriority > minCountryPriority) return min

            // Same price and country: keep current min
            return min
          })

          // Find crane with smallest safety factor
          smallestSafetyFactorCrane = validResults.reduce((min, current) => {
            const minSafetyFactor = min.result.safety_factor || Infinity
            const currentSafetyFactor = current.result.safety_factor || Infinity
            return currentSafetyFactor < minSafetyFactor ? current : min
          })
        }

        // Set comparison results for display with best cranes info
        setComparisonResults({
          results,
          cheapestCrane: cheapestCrane
            ? {
                name: `${cheapestCrane.crane.manufacturer} ${cheapestCrane.crane.model}`,
                boomLength: cheapestCrane.boomLength,
                price: cheapestCrane.crane.base_price,
              }
            : null,
          smallestSafetyFactorCrane: smallestSafetyFactorCrane
            ? {
                name: `${smallestSafetyFactorCrane.crane.manufacturer} ${smallestSafetyFactorCrane.crane.model}`,
                boomLength: smallestSafetyFactorCrane.boomLength,
                safetyFactor: smallestSafetyFactorCrane.result.safety_factor,
              }
            : null,
        })
      } catch (error) {
        console.error('Comparison calculation error:', error)
        setErrors((prev) => ({
          ...prev,
          general: 'Ошибка при выполнении расчетов',
        }))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, comparisonTable, setComparisonTable, validateForm, addToHistory],
  )

  const handleClearForm = useCallback(() => {
    const clearedData = {
      boomRadius: '',
      equipmentWeight: '',
      payload: '',
    }
    setFormData(clearedData)
    setErrors({})
    setValidationErrors({})
    setComparisonResults(null)
    // Clear from localStorage
    try {
      localStorage.removeItem(COMPARISON_FORM_STORAGE_KEY)
      localStorage.removeItem(COMPARISON_RESULTS_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing comparison form data:', error)
    }
  }, [])

  return {
    formData,
    errors,
    validationErrors,
    isSubmitting,
    comparisonResults,
    handleInputChange,
    handleSubmit,
    handleClearForm,
  }
}

export default useComparisonForm
