import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { formatCalculationValue } from '@/src/utilities/formatters'
import './ComparisonCopyButton.css'

const copyWithFallback = async (text) => {
  // Try to use the clipboard API if available but writeText failed
  if (navigator.clipboard && navigator.clipboard.write) {
    try {
      const blob = new Blob([text], { type: 'text/plain' })
      const clipboardItem = new ClipboardItem({ 'text/plain': blob })
      await navigator.clipboard.write([clipboardItem])
      return
    } catch {
      // Fall through to next method
    }
  }

  // Try using the older clipboard API methods
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through to final fallback
    }
  }

  // Simple fallback: just throw an error
  // In practice, clipboard API works in 99% of cases
  throw new Error('Clipboard not available')
}

const buildParametersSection = (formData, result) => {
  result.push(
    'ОТЧЕТ О ТЕХНИКО-ЭКОНОМИЧЕСКОМ СРАВНЕНИИ КРАНОВ',
    '',
    'ПАРАМЕТРЫ РАСЧЕТА',
  )
  if (formData.boomRadius) {
    result.push(`Вылет стрелы: ${formData.boomRadius} м`)
  }
  if (formData.equipmentWeight) {
    result.push(`Вес строп. оборудования: ${formData.equipmentWeight} т`)
  }
  if (formData.payload) {
    result.push(`Вес груза: ${formData.payload} т`)
  }
  result.push(
    'Сборник сметных цен: ФСЭМ ФСНБ 2022',
    '',
    'РЕЗУЛЬТАТЫ СРАВНЕНИЯ',
    '',
  )
}

const formatCraneResult = (calcResult, index) => {
  const crane = calcResult.crane
  const resultData = calcResult.result
  const manufacturer = crane.manufacturer || 'Н/Д'
  const model = crane.model || 'Н/Д'
  const boomLength = calcResult.boomLength || 'Н/Д'
  const chassisType = crane.chassis_type || 'Н/Д'
  const country = crane.country || 'Н/Д'
  const price = crane.base_price
    ? formatCalculationValue(crane.base_price, '₽')
    : 'Н/Д'
  const liftingCapacity = resultData.lifting_capacity
    ? formatCalculationValue(resultData.lifting_capacity, 'т')
    : 'Н/Д'
  const safetyFactor = resultData.safety_factor
    ? formatCalculationValue(resultData.safety_factor)
    : 'Н/Д'
  const remainingLc = resultData.remaining_lc
    ? formatCalculationValue(resultData.remaining_lc, 'т')
    : 'Н/Д'

  return [
    `${index + 1}. ${manufacturer}`,
    `   ${model}`,
    `   Стрела: ${boomLength}`,
    `   Тип шасси: ${chassisType}`,
    `   Страна: ${country}`,
    `   Сметная цена без учета оплаты труда машинистов: ${price} руб./маш.-ч`,
    `   Г/П на данном вылете: ${liftingCapacity}`,
    `   Коэффициент запаса: ${safetyFactor}`,
    `   Запас Г/П: ${remainingLc}`,
    '',
  ]
}

const buildCraneResultsSection = (validResults, result) => {
  if (validResults.length === 0) {
    result.push('Нет валидных результатов')
    return
  }

  for (const [index, calcResult] of validResults.entries()) {
    result.push(...formatCraneResult(calcResult, index))
  }
  result.push('')
}

const buildBestCranesSection = (comparisonResults, result) => {
  if (
    !comparisonResults.cheapestCrane &&
    !comparisonResults.smallestSafetyFactorCrane
  ) {
    return
  }

  result.push('ВЫВОДЫ ПО РЕЗУЛЬТАТАМ СРАВНЕНИЯ', '')

  if (comparisonResults.cheapestCrane) {
    const cheapest = comparisonResults.cheapestCrane
    const displayName = cheapest.boomLength
      ? `${cheapest.name} (${cheapest.boomLength})`
      : cheapest.name
    const priceText = cheapest.price
      ? formatCalculationValue(cheapest.price, '₽')
      : 'Н/Д'
    result.push(`Наименьшая стоимость маш.-ч: ${displayName} - ${priceText}`)
  }

  if (comparisonResults.smallestSafetyFactorCrane) {
    const smallest = comparisonResults.smallestSafetyFactorCrane
    const displayName = smallest.boomLength
      ? `${smallest.name} (${smallest.boomLength})`
      : smallest.name
    const safetyFactorText = smallest.safetyFactor
      ? formatCalculationValue(smallest.safetyFactor)
      : 'Н/Д'
    result.push(
      `Наименьший коэффициент запаса: ${displayName} - ${safetyFactorText}`,
    )
  }
}

const buildComparisonCopyText = (comparisonResults, formData) => {
  if (!comparisonResults || !comparisonResults.results) {
    return ''
  }

  const result = []
  buildParametersSection(formData, result)

  // Filter out cranes with errors (including radius validation errors)
  const validResults = comparisonResults.results.filter(
    (r) => r.success && !r.error,
  )
  buildCraneResultsSection(validResults, result)

  buildBestCranesSection(comparisonResults, result)

  return result.join('\n')
}

/**
 * Helper function to check if comparison table has any results
 */
const hasComparisonResults = (comparisonTable) => {
  if (!comparisonTable || comparisonTable.length === 0) return false
  return comparisonTable.some(
    (entry) =>
      entry.results &&
      (entry.results.lifting_capacity !== null ||
        entry.results.safety_factor !== null ||
        entry.results.remaining_lc !== null),
  )
}

const hasEntryResults = (entry) => {
  return (
    entry.results &&
    (entry.results.lifting_capacity !== null ||
      entry.results.safety_factor !== null)
  )
}

const mapEntryToResult = (entry) => {
  const crane = entry.crane
  const resultData = entry.results
  const boomLength = entry.selectedBoomLength || null

  return {
    success: !entry.results.error,
    result: {
      lifting_capacity: resultData.lifting_capacity,
      safety_factor: resultData.safety_factor,
      remaining_lc: resultData.remaining_lc,
    },
    crane,
    boomLength,
    error: entry.results.error || null,
  }
}

const isValidResult = (r) => {
  return (
    r.success &&
    !r.error &&
    r.result.safety_factor !== null &&
    r.result.safety_factor >= 1
  )
}

const findCheapestCrane = (validResults) => {
  return validResults.reduce((min, current) => {
    const minPrice = min.crane.base_price || Infinity
    const currentPrice = current.crane.base_price || Infinity
    return currentPrice < minPrice ? current : min
  })
}

const findSmallestSafetyFactorCrane = (validResults) => {
  return validResults.reduce((min, current) => {
    const minSafetyFactor = min.result.safety_factor || Infinity
    const currentSafetyFactor = current.result.safety_factor || Infinity
    return currentSafetyFactor < minSafetyFactor ? current : min
  })
}

const formatCheapestCrane = (cheapestCrane) => {
  return {
    name: `${cheapestCrane.crane.manufacturer} ${cheapestCrane.crane.model}`,
    boomLength: cheapestCrane.boomLength,
    price: cheapestCrane.crane.base_price,
  }
}

const formatSmallestSafetyFactorCrane = (smallestSafetyFactorCrane) => {
  return {
    name: `${smallestSafetyFactorCrane.crane.manufacturer} ${smallestSafetyFactorCrane.crane.model}`,
    boomLength: smallestSafetyFactorCrane.boomLength,
    safetyFactor: smallestSafetyFactorCrane.result.safety_factor,
  }
}

const calculateBestCranes = (validResults) => {
  if (validResults.length === 0) {
    return { cheapestCrane: null, smallestSafetyFactorCrane: null }
  }

  const cheapest = findCheapestCrane(validResults)
  const smallest = findSmallestSafetyFactorCrane(validResults)

  return {
    cheapestCrane: formatCheapestCrane(cheapest),
    smallestSafetyFactorCrane: formatSmallestSafetyFactorCrane(smallest),
  }
}

/**
 * Helper function to build comparison results from comparison table
 */
const buildComparisonResultsFromTable = (comparisonTable) => {
  if (!comparisonTable || comparisonTable.length === 0) return null

  const results = comparisonTable
    .filter((entry) => hasEntryResults(entry))
    .map((entry) => mapEntryToResult(entry))

  if (results.length === 0) return null

  const validResults = results.filter((r) => isValidResult(r))
  const bestCranes = calculateBestCranes(validResults)

  return {
    results,
    ...bestCranes,
  }
}

/**
 * Component for copying comparison results to clipboard
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.comparisonResults - Comparison results object
 * @param {Array} props.comparisonTable - Comparison table entries with stored results
 * @param {Object} props.formData - Form data used for the comparison
 */
const ComparisonCopyButton = ({
  comparisonResults,
  comparisonTable,
  formData,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // Use comparisonResults if available, otherwise build from comparisonTable
    const resultsToUse =
      comparisonResults ||
      buildComparisonResultsFromTable(comparisonTable) ||
      null

    if (!resultsToUse || !resultsToUse.results) return

    const text = buildComparisonCopyText(resultsToUse, formData)
    if (!text) return

    try {
      await (navigator?.clipboard?.writeText
        ? navigator.clipboard.writeText(text)
        : copyWithFallback(text))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard failed - just fail silently
      // In practice, this rarely happens in modern browsers
    }
  }

  return (
    <Button
      icon
      labelPosition='left'
      size='tiny'
      color='teal'
      fluid
      onClick={handleCopy}
      disabled={
        !hasComparisonResults(comparisonTable) &&
        (!comparisonResults || !comparisonResults.results)
      }
      className='comparison-copy-button'
    >
      <Icon name={copied ? 'check' : 'copy'} />
      {copied ? 'Скопировано' : 'Копировать результат'}
    </Button>
  )
}

export default ComparisonCopyButton
