import { useState, useMemo, useEffect } from 'react'
import { Button, Popup } from 'semantic-ui-react'

import { MAX_COMPARISON_TABLE_ENTRIES, POPUP_TIMEOUT } from '@/src/config'
import useComparisonTableAdd from '@/src/hooks/useComparisonTableAdd'
import useComparisonTableState from '@/src/hooks/useComparisonTableState'
import './AddToComparisonButton.css'

/**
 * Reusable button component for adding cranes to comparison table
 *
 * @param {Object} props - Component props
 * @param {string} props.craneName - Name of the crane to add (manufacturer_model format)
 * @param {string} props.className - Optional additional CSS classes
 * @param {string} props.size - Button size (default: 'small')
 * @param {boolean} props.compact - If true, shows only icon without text
 */
const AddToComparisonButton = ({
  craneName,
  className = '',
  size = 'mini',
}) => {
  const { comparisonTable, setComparisonTable } = useComparisonTableState()
  const { addCraneToComparison } = useComparisonTableAdd(setComparisonTable)

  const [isLoading, setIsLoading] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Check if crane is already in comparison table
  const isCraneInTable = useMemo(() => {
    return comparisonTable.some((entry) => entry.crane?.name === craneName)
  }, [comparisonTable, craneName])

  // Check if limit is reached
  const isLimitReached = useMemo(() => {
    return comparisonTable.length >= MAX_COMPARISON_TABLE_ENTRIES
  }, [comparisonTable.length])

  // Auto-hide limit warning after timeout
  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => {
        setShowLimitWarning(false)
      }, POPUP_TIMEOUT)
      return () => clearTimeout(timer)
    }
  }, [showLimitWarning])

  // Auto-hide success message after timeout
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, POPUP_TIMEOUT)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const handleAddToComparison = async () => {
    if (isLoading) {
      return
    }

    // Check limit and show warning if reached, but don't prevent clicking
    if (isLimitReached) {
      setShowLimitWarning(true)
      return
    }

    setIsLoading(true)
    try {
      const result = await addCraneToComparison(craneName)
      if (result.success) {
        setShowSuccess(true)
      }
      // State will automatically update based on comparisonTable changes
    } catch (error) {
      console.error('Error adding crane to comparison:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine button state and content based on persisted comparison table state
  let buttonContent
  let buttonIcon
  let buttonColor
  let buttonDisabled = false
  let popupContent
  let popupOpen = false

  if (isLoading) {
    buttonContent = ''
    buttonIcon = 'spinner'
    buttonColor = 'teal'
    buttonDisabled = true
    popupContent = 'Загрузка данных крана...'
  } else if (showLimitWarning) {
    buttonContent = ''
    buttonIcon = 'exclamation triangle'
    buttonColor = 'orange'
    popupContent = `Достигнут лимит кранов в таблице сравнения (${MAX_COMPARISON_TABLE_ENTRIES})`
    popupOpen = true
  } else if (showSuccess) {
    buttonContent = ''
    buttonIcon = 'check'
    buttonColor = 'green'
    popupContent = 'Кран добавлен в таблицу сравнения'
    popupOpen = true
  } else if (isCraneInTable) {
    buttonContent = ''
    buttonIcon = 'check'
    buttonColor = 'green'
    popupContent =
      'Кран добавлен в таблицу сравнения. Нажмите, чтобы добавить еще раз'
  } else {
    buttonContent = ''
    buttonIcon = 'add'
    buttonColor = 'teal'
    popupContent = 'Добавить в таблицу сравнения'
  }

  return (
    <Popup
      content={popupContent}
      size='small'
      open={popupOpen}
      on={popupOpen ? null : 'hover'}
      onClose={() => {
        setShowLimitWarning(false)
        setShowSuccess(false)
      }}
      trigger={
        <Button
          icon={buttonIcon}
          content={buttonContent}
          color={buttonColor}
          size={size}
          disabled={buttonDisabled}
          loading={isLoading}
          onClick={handleAddToComparison}
          className={`add-to-comparison-button ${className}`}
        />
      }
    />
  )
}

export default AddToComparisonButton
