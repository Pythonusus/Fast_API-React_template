import React from 'react'
import { Container, Header } from 'semantic-ui-react'

import ResultCopyButton from '@/src/components/ResultCopyButton'
import ResultDownloadButton from '@/src/components/ResultDownloadButton'
import { formatCalculationValue } from '@/src/utilities/formatters'
import './CalculationResults.css'

/**
 * Component to display crane calculation results
 *
 * Shows lifting capacity and either payload or safety factor based on calculation mode.
 * Displays placeholder text when no calculation has been performed.
 *
 * @param {Object} props - Component props
 * @param {Object} props.calculationResult - Calculation result object
 * @param {string} props.calculationMode - Calculation mode ('payload' or 'safety_factor')
 * @param {Object} props.crane - Crane data object containing manufacturer and model
 */
const CalculationResults = ({ calculationResult, calculationMode, crane }) => {
  const isPayloadMode = calculationMode === 'payload'

  const renderResultValue = () => {
    if (!calculationResult) {
      return (
        <span className='calculation-result-value-placeholder'>
          Выполните расчет для получения результатов
        </span>
      )
    }

    if (isPayloadMode) {
      // When calculating payload (max load), show payload
      if (calculationResult.payload) {
        return formatCalculationValue(calculationResult.payload)
      }
    } else {
      // When calculating safety factor, show safety factor
      if (calculationResult.safety_factor) {
        return formatCalculationValue(calculationResult.safety_factor)
      }
    }

    return (
      <span className='calculation-result-value-placeholder'>
        Выполните расчет для получения результатов
      </span>
    )
  }

  return (
    <div className='calculation-results'>
      <Header
        as='h3'
        textAlign='center'
        className='calculation-results-header font-size-4'
      >
        Результаты расчета грузоподъемности
      </Header>
      <Container className='calculation-results-cards-container'>
        <div className='calculation-results-card'>
          <div className='calculation-results-label font-size-5 fw-bold'>
            Грузоподъемность на данном вылете, т
          </div>
          <div className='calculation-results-value font-size-5 fw-bold'>
            {calculationResult ? (
              formatCalculationValue(calculationResult.lifting_capacity)
            ) : (
              <span className='calculation-result-value-placeholder font-size-5'>
                Выполните расчет для получения результатов
              </span>
            )}
          </div>
        </div>
        {isPayloadMode ? (
          <div className='calculation-results-card'>
            <div className='calculation-results-label font-size-5 fw-bold'>
              Допустимый вес груза, т
            </div>
            <div className='calculation-results-value font-size-5 fw-bold'>
              {renderResultValue()}
            </div>
          </div>
        ) : (
          <>
            <div className='calculation-results-card'>
              <div className='calculation-results-label font-size-5 fw-bold'>
                Коэффициент запаса
              </div>
              <div className='calculation-results-value font-size-5 fw-bold'>
                {renderResultValue()}
              </div>
            </div>
            <div className='calculation-results-card'>
              <div className='calculation-results-label font-size-5 fw-bold'>
                Запас грузоподъемности, т
              </div>
              <div className='calculation-results-value font-size-5 fw-bold'>
                {calculationResult && calculationResult.request.payload ? (
                  formatCalculationValue(
                    calculationResult.lifting_capacity -
                      calculationResult.request.payload -
                      calculationResult.request.equipment_weight,
                  )
                ) : (
                  <span className='calculation-result-value-placeholder font-size-5'>
                    Выполните расчет для получения результатов
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        <div className='calculation-results-actions'>
          <ResultCopyButton
            calculationResult={calculationResult}
            crane={crane}
          />
          <ResultDownloadButton
            calculationResult={calculationResult}
            calculationMode={calculationMode}
            crane={crane}
          />
        </div>
      </Container>
    </div>
  )
}

export default CalculationResults
