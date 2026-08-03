import { useEffect, useState } from 'react'

import {
  calculatePayload,
  calculateSafetyFactor,
  createPayloadRequest,
  createSafetyFactorRequest,
} from '@/src/api/calcRequests'
import useHistoryAdd from '@/src/hooks/useHistoryAdd'
import useHistoryState from '@/src/hooks/useHistoryState'
import {
  isFormValid,
  validatePayloadCalcForm,
  validateSafetyFactorCalcForm,
} from '@/src/utilities/validateCalcForm'

// Timeout for auto-closing popups
const popupTimeout = 5000

// Helper function to normalize numeric input (convert comma to dot for parsing)
const normalizeNumericInput = (value) => {
  if (!value) return value
  return value.replace(',', '.')
}

/**
 * Custom hook for managing crane calculation form state and logic
 *
 * Handles form data, validation, API calls, and calculation mode switching.
 * Provides all necessary state and handlers for the calculation form.
 *
 * @param {Object} crane - Crane data object
 * @param {Object} initialFormData - Optional initial form data for pre-filling
 * @param {boolean} initialMode - Optional initial calculation mode
 * @param {Object} initialResult - Optional initial calculation result for pre-filling
 * @returns {Object} Form state and handlers
 * @returns {string} returns.calculationMode - Current calculation mode ('payload' or 'safety_factor')
 * @returns {Function} returns.setCalculationMode - Function to change calculation mode (receives string)
 * @returns {Object} returns.formData - Current form field values
 * @returns {string} returns.formData.boomLength - Selected boom length configuration
 * @returns {string} returns.formData.boomRadius - Boom radius value
 * @returns {string} returns.formData.equipmentWeight - Equipment weight value (optional)
 * @returns {string} returns.formData.payload - Payload value (when calculating safety factor)
 * @returns {string} returns.formData.safetyFactor - Safety factor value (when calculating payload/max load)
 * @returns {Object} returns.errors - Error messages for popups
 * @returns {Object} returns.validationErrors - Validation errors for field styling
 * @returns {boolean} returns.isSubmitting - Loading state during calculation
 * @returns {Object|null} returns.calculationResult - API calculation result
 * @returns {Function} returns.handleInputChange - Handler for form field changes (field: string, value: string)
 * @returns {Function} returns.handleSubmit - Handler for form submission (event: Event)
 * @returns {Function} returns.handleClearForm - Handler to reset form (no parameters)
 */
const useCalculationForm = (
  crane,
  initialFormData = null,
  initialMode = false,
  initialResult = null,
) => {
  const { history, setHistory } = useHistoryState()
  const { addToHistory } = useHistoryAdd(history, setHistory)

  const [calculationMode, setCalculationMode] = useState(
    initialMode || 'safety_factor',
  )
  const [formData, setFormData] = useState(() => {
    const defaultFormData = {
      boomLength: '',
      boomRadius: '',
      equipmentWeight: '',
      payload: '',
      safetyFactor: '',
    }

    if (initialFormData) {
      return {
        ...defaultFormData,
        ...initialFormData,
      }
    }

    return defaultFormData
  })
  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Store separate results for each calculation mode
  const [payloadCalculationResult, setPayloadCalculationResult] = useState(
    initialMode === 'payload' && initialResult ? initialResult : null,
  )
  const [safetyFactorCalculationResult, setSafetyFactorCalculationResult] =
    useState(
      initialMode === 'safety_factor' && initialResult ? initialResult : null,
    )

  // Auto-close popups after 5 seconds, but keep field styling
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({}) // Clear popups
        // Keep validationErrors for field styling
      }, popupTimeout)

      return () => clearTimeout(timer)
    }
  }, [errors])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear both popup and field styling when user starts typing
    // eslint-disable-next-line security/detect-object-injection
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
    // eslint-disable-next-line security/detect-object-injection
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Use the appropriate validation function based on calculation mode
    const validationErrors =
      calculationMode === 'payload'
        ? validatePayloadCalcForm(formData, crane)
        : validateSafetyFactorCalcForm(formData, crane)

    setErrors(validationErrors)
    setValidationErrors(validationErrors)

    if (!isFormValid(validationErrors)) {
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (calculationMode === 'payload') {
        // Calculate payload (maximum load) using safety factor
        const baseRequest = createPayloadRequest(
          crane.name,
          formData.boomLength,
          Number.parseFloat(normalizeNumericInput(formData.boomRadius)),
          formData.equipmentWeight
            ? Number.parseFloat(normalizeNumericInput(formData.equipmentWeight))
            : 0,
          formData.safetyFactor
            ? Number.parseFloat(normalizeNumericInput(formData.safetyFactor))
            : 1,
        )
        result = await calculatePayload(baseRequest)
        setPayloadCalculationResult(result)

        // Save successful calculation to history
        addToHistory({
          manufacturer: crane.manufacturer,
          model: crane.model,
          country: crane.country || '',
          chassisType: crane.chassis_type || 'Unknown',
          maxLiftingCapacity: crane.max_lifting_capacity || 'Unknown',
          basePrice: crane.base_price || null,
          calculationMethod: 'payload',
          result: result,
        })
      } else {
        // Calculate safety factor using given payload
        const baseRequest = createSafetyFactorRequest(
          crane.name,
          formData.boomLength,
          Number.parseFloat(normalizeNumericInput(formData.boomRadius)),
          formData.equipmentWeight
            ? Number.parseFloat(normalizeNumericInput(formData.equipmentWeight))
            : 0,
          Number.parseFloat(normalizeNumericInput(formData.payload)),
        )
        result = await calculateSafetyFactor(baseRequest)
        setSafetyFactorCalculationResult(result)

        // Save successful calculation to history
        addToHistory({
          manufacturer: crane.manufacturer,
          model: crane.model,
          country: crane.country || '',
          chassisType: crane.chassis_type || 'Unknown',
          maxLiftingCapacity: crane.max_lifting_capacity || 'Unknown',
          basePrice: crane.base_price || null,
          calculationMethod: 'safety_factor',
          result: result,
        })
      }
    } catch (error) {
      console.error('Calculation error:', error)
      setErrors((prev) => ({
        ...prev,
        general: 'Ошибка при выполнении расчета',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearForm = () => {
    setFormData({
      boomLength: '',
      boomRadius: '',
      equipmentWeight: '',
      payload: '',
      safetyFactor: '',
    })
    setErrors({})
    setValidationErrors({})
    setPayloadCalculationResult(null)
    setSafetyFactorCalculationResult(null)
  }

  // Return the appropriate result based on current mode
  const calculationResult =
    calculationMode === 'payload'
      ? payloadCalculationResult
      : safetyFactorCalculationResult

  return {
    calculationMode,
    setCalculationMode,
    formData,
    errors,
    validationErrors,
    isSubmitting,
    calculationResult,
    handleInputChange,
    handleSubmit,
    handleClearForm,
  }
}

export default useCalculationForm
