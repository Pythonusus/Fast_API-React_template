/**
 * Formats a number to a fixed decimal places with optional unit
 * @param {number|string} value - The value to format
 * @param {string} unit - Optional unit to append (e.g., 'т', 'м')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string with unit
 */
export const formatNumber = (value, unit = '', decimals = 2) => {
  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) {
    const zeros = '0'.repeat(decimals)
    const formatted = `0.${zeros}`
    return unit ? `${formatted} ${unit}` : formatted
  }

  const formattedNum = num.toFixed(decimals)
  return unit ? `${formattedNum} ${unit}` : formattedNum
}

/**
 * Formats a number for display in calculation results
 * @param {number|string} value - The value to format
 * @param {string} unit - Optional unit to append
 * @returns {string} Formatted number with 2 decimal places and unit
 */
export const formatCalculationValue = (value, unit = '') => {
  return formatNumber(value, unit, 2)
}

/**
 * Formats a timestamp into localized date and time strings
 * @param {number|string|Date} timestamp - The timestamp to format
 * @returns {Object} An object containing formatted date and time strings
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const dateStr = date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const timeStr = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return {
    date: dateStr,
    time: timeStr,
    // Combined format for simple use cases
    formatted: `${dateStr} ${timeStr}`,
  }
}

/**
 * Formats form values by converting empty strings, null, and undefined to null
 * @param {*} value - The form value to format
 * @returns {*} The original value or null if it was empty/null/undefined
 */
export const formatFormValue = (value) => {
  return value === '' || value === null || value === undefined ? null : value
}
