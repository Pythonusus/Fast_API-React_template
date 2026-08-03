import React from 'react'
import { FormField, Popup } from 'semantic-ui-react'

// Function to validate numeric input and return error message if invalid
const validateNumericInput = (inputValue) => {
  if (!inputValue) return '' // Empty value is allowed

  // Check if input contains only valid characters
  if (!/^[0-9.,-]*$/.test(inputValue)) {
    return 'Разрешены только цифры, точка, запятая и знак минус'
  }

  // Check for multiple decimal separators
  const commaCount = (inputValue.match(/,/g) || []).length
  const dotCount = (inputValue.match(/\./g) || []).length
  if (commaCount + dotCount > 1) {
    return 'Используйте только один десятичный разделитель'
  }

  // Check for minus sign in wrong position
  if (inputValue.includes('-') && !inputValue.startsWith('-')) {
    return 'Знак минус может быть только в начале числа'
  }

  // Check for multiple minus signs
  if ((inputValue.match(/-/g) || []).length > 1) {
    return 'Используйте только один знак минус'
  }

  return '' // No errors
}

/**
 * Reusable form field component with validation display
 *
 * Provides consistent validation styling and error popups for form fields.
 * Supports both regular inputs and custom components like dropdowns.
 *
 * @param {Object} props - Component props
 * @param {string} props.field - Field name for ID generation
 * @param {string} props.label - Field label text
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} props.value - Current field value
 * @param {Function} props.onChange - Handler for value changes (receives string value)
 * @param {string} [props.error] - Error message for popup display
 * @param {string} [props.validationError] - Error state for field styling
 * @param {React.ReactNode} [props.children] - Custom component (like dropdown)
 * @param {string} [props.type='input'] - Field type ('input' or 'dropdown')
 * @param {string} [props.inputType='text'] - HTML input type attribute
 */
const ValidatedFormField = ({
  field,
  label,
  placeholder,
  value,
  onChange,
  error,
  validationError,
  children,
  type = 'input',
  inputType = 'text',
}) => {
  const handleInputChange = (e) => {
    const inputValue = e.target.value
    onChange(inputValue)
  }

  const handlePaste = (e) => {
    // For numeric fields, validate pasted content
    if (
      inputType === 'number' ||
      field === 'boomRadius' ||
      field === 'equipmentWeight' ||
      field === 'payload' ||
      field === 'safetyFactor'
    ) {
      const pastedText = e.clipboardData.getData('text')
      onChange(pastedText)
    }
  }

  // Get validation error for numeric fields
  const getNumericValidationError = () => {
    if (
      inputType === 'number' ||
      field === 'boomRadius' ||
      field === 'equipmentWeight' ||
      field === 'payload' ||
      field === 'safetyFactor'
    ) {
      return validateNumericInput(value)
    }
    return ''
  }

  const numericValidationError = getNumericValidationError()
  const hasError = !!error || !!validationError || !!numericValidationError

  const renderField = () => {
    if (children) {
      return children
    }

    if (type === 'dropdown') {
      return value
    }

    // For numeric fields, use text input but with validation
    if (inputType === 'number') {
      return (
        <input
          type='text'
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onPaste={handlePaste}
          maxLength='20'
        />
      )
    }

    return (
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onPaste={handlePaste}
        maxLength='20'
      />
    )
  }

  return (
    <FormField error={hasError} className='mb-5'>
      <label htmlFor={`${field}-${type}`}>
        {label}
        <Popup
          content={error || numericValidationError}
          open={!!(error || numericValidationError)}
          position='left center'
          color='red'
          size='small'
          onClose={() => onChange(value)}
          trigger={renderField()}
        />
      </label>
    </FormField>
  )
}

export default ValidatedFormField
