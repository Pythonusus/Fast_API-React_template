import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { generateAndDownloadComparisonReport } from '@/src/utilities/comparisonReportGenerator'
import './ComparisonDownloadButton.css'

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

/**
 * Helper function to build comparison results from comparison table
 */
const buildComparisonResultsFromTable = (comparisonTable) => {
  if (!comparisonTable || comparisonTable.length === 0) return null

  const results = comparisonTable
    .filter(
      (entry) =>
        entry.results &&
        (entry.results.lifting_capacity !== null ||
          entry.results.safety_factor !== null),
    )
    .map((entry) => {
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
      }
    })

  if (results.length === 0) return null

  // Calculate best cranes
  const validResults = results.filter(
    (r) =>
      r.success &&
      r.result.safety_factor !== null &&
      r.result.safety_factor >= 1,
  )

  let cheapestCrane = null
  let smallestSafetyFactorCrane = null

  if (validResults.length > 0) {
    cheapestCrane = validResults.reduce((min, current) => {
      const minPrice = min.crane.base_price || Infinity
      const currentPrice = current.crane.base_price || Infinity
      return currentPrice < minPrice ? current : min
    })

    smallestSafetyFactorCrane = validResults.reduce((min, current) => {
      const minSafetyFactor = min.result.safety_factor || Infinity
      const currentSafetyFactor = current.result.safety_factor || Infinity
      return currentSafetyFactor < minSafetyFactor ? current : min
    })
  }

  return {
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
  }
}

/**
 * Component for downloading comparison results as a Word document
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.comparisonResults - Comparison results object
 * @param {Array} props.comparisonTable - Comparison table entries with stored results
 * @param {Object} props.formData - Form data used for the comparison
 */
const ComparisonDownloadButton = ({
  comparisonResults,
  comparisonTable,
  formData,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    // Use comparisonResults if available, otherwise build from comparisonTable
    const resultsToUse =
      comparisonResults ||
      buildComparisonResultsFromTable(comparisonTable) ||
      null

    if (!resultsToUse || !resultsToUse.results) return

    setIsGenerating(true)
    try {
      await generateAndDownloadComparisonReport(resultsToUse, formData)
    } catch (error) {
      console.error('Failed to generate comparison report:', error)
      // You could add a toast notification here if you have one
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      icon
      labelPosition='left'
      size='tiny'
      color='teal'
      fluid
      onClick={handleDownload}
      disabled={
        (!hasComparisonResults(comparisonTable) &&
          (!comparisonResults || !comparisonResults.results)) ||
        isGenerating
      }
      loading={isGenerating}
      className='comparison-download-button'
    >
      <Icon name='download' />
      {isGenerating ? 'Создание отчета...' : 'Скачать отчет DOC'}
    </Button>
  )
}

export default ComparisonDownloadButton
