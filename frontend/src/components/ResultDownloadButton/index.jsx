import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { generateAndDownloadReport } from '@/src/utilities/reportGenerator'
import './ResultDownloadButton.css'

/**
 * Component for downloading calculation results as a Word document
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.calculationResult - API calculation result object
 * @param {string} props.calculationMode - Calculation mode ('payload' or 'safety_factor')
 * @param {Object} props.crane - Crane data object containing manufacturer and model
 */
const ResultDownloadButton = ({
  calculationResult,
  calculationMode,
  crane,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!calculationResult) return

    setIsGenerating(true)
    try {
      await generateAndDownloadReport(calculationResult, calculationMode, crane)
    } catch (error) {
      console.error('Failed to generate report:', error)
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
      disabled={!calculationResult || isGenerating}
      loading={isGenerating}
      className='result-download-button'
    >
      <Icon name='download' />
      {isGenerating ? 'Создание отчета...' : 'Скачать отчет DOC'}
    </Button>
  )
}

export default ResultDownloadButton
