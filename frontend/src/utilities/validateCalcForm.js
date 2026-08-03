/**
 * Validation utilities for crane calculation form
 */

/**
 * Validates that a value is a positive number
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
export const validatePositiveNumber = (value, fieldName) => {
  if (!value) return `Введите ${fieldName}`

  const num = Number.parseFloat(value)
  if (Number.isNaN(num) || num <= 0) {
    return `${fieldName} должен быть положительным числом`
  }
  return ''
}

/**
 * Validates that a value is a non-negative number
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
export const validateNonNegativeNumber = (value, fieldName) => {
  if (!value) return `Введите ${fieldName}`

  const num = Number.parseFloat(value)
  if (Number.isNaN(num) || num < 0) {
    return `${fieldName} должен быть неотрицательным числом`
  }
  return ''
}

/**
 * Validates that a value is a non-negative number (optional field)
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
export const validateOptionalNonNegativeNumber = (value, fieldName) => {
  if (!value) return '' // Empty value is allowed for optional fields

  const num = Number.parseFloat(value)
  if (Number.isNaN(num) || num < 0) {
    return `${fieldName} должен быть неотрицательным числом`
  }
  return ''
}

/**
 * Validates that a value is within a specified range
 * @param {string} value - The value to validate
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
export const validateNumberInRange = (value, min, max, fieldName) => {
  // First check if it's a positive number
  const positiveError = validatePositiveNumber(value, fieldName)
  if (positiveError) return positiveError

  const num = Number.parseFloat(value)

  // Check if it's within the allowed range
  if (num < min || num > max) {
    return `${fieldName} должен быть от ${min} до ${max} м для данной конфигурации`
  }

  return ''
}

/**
 * Validates that a required field has a value
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
export const validateRequiredField = (value, fieldName) => {
  return value ? '' : `Введите ${fieldName}`
}

/**
 * Validates common fields for both calculation forms
 * @param {Object} formData - The form data object
 * @param {Object} crane - The crane object containing radius data
 * @returns {Object} Object containing validation errors
 */
const validateCommonFields = (formData, crane) => {
  const errors = {}

  // Boom length validation
  if (!formData.boomLength) {
    errors.boomLength = 'Выберите конфигурацию стрелы'
  }

  // Radius validation
  const radiusTable =
    crane.lc_tables['Основная стрела'].table[formData.boomLength]
  const radiusKeys = Object.keys(radiusTable)
    .map(Number)
    .toSorted((a, b) => a - b)
  const radiusMin = radiusKeys.at(0)
  const radiusMax = radiusKeys.at(-1)

  const boomRadiusError = validateNumberInRange(
    formData.boomRadius,
    radiusMin,
    radiusMax,
    'Вылет стрелы',
  )
  if (boomRadiusError) {
    errors.boomRadius = boomRadiusError
  }

  // Equipment weight validation
  const equipmentWeightError = validateOptionalNonNegativeNumber(
    formData.equipmentWeight,
    'Вес строповочного оборудования',
  )
  if (equipmentWeightError) {
    errors.equipmentWeight = equipmentWeightError
  }

  return errors
}

/**
 * Validates that a value is a positive number (optional field)
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} Error message or empty string if valid
 */
const validateOptionalPositiveNumber = (value, fieldName) => {
  if (!value) return ''
  const num = Number.parseFloat(value)
  if (Number.isNaN(num) || num <= 0) {
    return `${fieldName} должен быть положительным числом`
  }
  return ''
}

/**
 * Validates the payload calculation form
 * @param {Object} formData - The form data object
 * @param {Object} crane - The crane object containing radius data
 * @returns {Object} Object containing validation errors
 */
export const validatePayloadCalcForm = (formData, crane) => {
  const errors = validateCommonFields(formData, crane)

  // Safety factor validation (required for payload calculation)
  const safetyFactorError = validateOptionalPositiveNumber(
    formData.safetyFactor,
    'Коэффициент запаса',
  )
  if (safetyFactorError) {
    errors.safetyFactor = safetyFactorError
  }

  return errors
}

/**
 * Validates the safety factor calculation form
 * @param {Object} formData - The form data object
 * @param {Object} crane - The crane object containing radius data
 * @returns {Object} Object containing validation errors
 */
export const validateSafetyFactorCalcForm = (formData, crane) => {
  const errors = validateCommonFields(formData, crane)

  // Load weight validation (required for safety factor calculation)
  const payloadError = validatePositiveNumber(formData.payload, 'Вес груза')
  if (payloadError) {
    errors.payload = payloadError
  }

  return errors
}

/**
 * Validates the entire crane calculation form (legacy function for backward compatibility)
 * @param {Object} formData - The form data object
 * @param {string} calculationMode - Calculation mode ('payload' or 'safety_factor')
 * @param {Object} crane - The crane object containing radius data
 * @returns {Object} Object containing validation errors
 */
export const validateCraneCalcForm = (formData, calculationMode, crane) => {
  // calculationMode = 'payload' means "by safety factor" (payload calculation)
  // calculationMode = 'safety_factor' means "by given load" (safety factor calculation)
  return calculationMode === 'payload'
    ? validatePayloadCalcForm(formData, crane)
    : validateSafetyFactorCalcForm(formData, crane)
}

/**
 * Checks if the form is valid (no errors)
 * @param {Object} errors - The validation errors object
 * @returns {boolean} True if form is valid, false otherwise
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0
}
