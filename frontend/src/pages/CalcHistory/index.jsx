import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Message,
  Popup,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'semantic-ui-react'

import ResultCopyButton from '@/src/components/ResultCopyButton'
import ResultDeleteButton from '@/src/components/ResultDeleteButton'
import ResultDownloadButton from '@/src/components/ResultDownloadButton'
import { MAX_HISTORY_ENTRIES } from '@/src/config'
import useHistoryClear from '@/src/hooks/useHistoryClear'
import useHistoryDelete from '@/src/hooks/useHistoryDelete'
import useHistoryState from '@/src/hooks/useHistoryState'
import {
  formatCalculationValue,
  formatTimestamp,
} from '@/src/utilities/formatters'
import './CalcHistory.css'

// Function to prepare initial form data from history entry
const prepareInitialFormData = (entry) => {
  const request = entry.result.request

  return {
    boomLength: request.boom_len,
    boomRadius: request.radius.toString(),
    equipmentWeight: request.equipment_weight
      ? request.equipment_weight.toString()
      : '',
    payload:
      entry.calculationMethod === 'safety_factor'
        ? request.payload.toString()
        : '',
    safetyFactor:
      entry.calculationMethod === 'payload'
        ? request.safety_factor.toString()
        : '',
  }
}

// Reusable clear history button
const ClearHistoryButton = ({ onClear, className = '' }) => (
  <Button
    color='red'
    size='small'
    onClick={onClear}
    icon='trash'
    content='Очистить историю'
    className={className}
  />
)

const CalcHistory = () => {
  // Core state management
  const { history, setHistory } = useHistoryState()

  // Individual operation hooks
  const { clearHistory } = useHistoryClear(history, setHistory)
  const { deleteSingleEntry } = useHistoryDelete(history, setHistory)

  const [hasError, setHasError] = useState(false)

  const handleClearHistory = () => {
    if (
      globalThis.confirm(
        'Вы уверены, что хотите очистить историю расчетов? Это действие нельзя отменить.',
      )
    ) {
      clearHistory()
      setHasError(false) // Reset error state
    }
  }

  const handleError = (error) => {
    console.error('Error in CalcHistory component:', error)
    setHasError(true)
  }

  // Render error UI if there's an error
  if (hasError) {
    return (
      <main className='calc-history-main-content'>
        <div className='calc-history-container'>
          <Message error>
            <Message.Header>
              Произошла ошибка при загрузке истории
            </Message.Header>
            <p>
              Не удалось загрузить историю расчетов. Возможно, данные
              повреждены.
            </p>
          </Message>

          <div className='error-message-container'>
            <ClearHistoryButton onClear={handleClearHistory} />
          </div>
        </div>
      </main>
    )
  }

  // Try to render the component, catch any errors
  try {
    return (
      <main className='calc-history-main-content'>
        <div className='calc-history-container'>
          {history.length === 0 ? (
            <Message info>
              <Message.Header>История пуста</Message.Header>
              <p>Выполните расчеты, чтобы увидеть их здесь.</p>
            </Message>
          ) : (
            <>
              <div className='font-size-4'>
                Хранятся последние {MAX_HISTORY_ENTRIES} расчетов.
                <br /> Сейчас сохранено: {history.length}
              </div>
              <Table
                celled
                striped
                compact
                size='small'
                unstackable
                className='history-table center-text'
              >
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className='history-timestamp-column'>
                      Дата
                    </TableHeaderCell>
                    <TableHeaderCell className='history-crane-column'>
                      Кран
                    </TableHeaderCell>
                    <TableHeaderCell className='history-country-column'>
                      Страна
                    </TableHeaderCell>
                    <TableHeaderCell className='history-chassis-column'>
                      Тип <br /> шасси
                    </TableHeaderCell>
                    <TableHeaderCell className='history-price-column'>
                      Стоимость <br /> маш.-ч (₽)
                    </TableHeaderCell>
                    <TableHeaderCell className='history-boom-column'>
                      Стрела
                    </TableHeaderCell>
                    <TableHeaderCell className='history-method-column'>
                      Метод <br /> расчета
                    </TableHeaderCell>
                    <TableHeaderCell className='history-radius-column'>
                      Вылет <br /> стрелы
                    </TableHeaderCell>
                    <TableHeaderCell className='history-equipment-column'>
                      Вес <br /> оборуд.
                    </TableHeaderCell>
                    <TableHeaderCell className='history-input-column'>
                      <span>
                        Вес груза
                        <hr />
                        Коэф. запаса
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell className='history-capacity-column'>
                      Г/П <br /> на вылете
                    </TableHeaderCell>
                    <TableHeaderCell className='history-result-column'>
                      <span>
                        Коэф. запаса
                        <hr />
                        Вес груза
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell className='history-actions-column'>
                      Действия
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {history.map((entry) => {
                    const timestamp = formatTimestamp(entry.timestamp)

                    const request = entry.result.request

                    const isPayloadMethod =
                      entry.calculationMethod === 'payload'

                    // Extract and format request values
                    const boomLength = request.boom_len
                    const chassisType = entry.chassisType
                    const radius = formatCalculationValue(request.radius, 'м')
                    const equipmentWeight = formatCalculationValue(
                      request.equipment_weight,
                      'т',
                    )

                    const inputValue = isPayloadMethod
                      ? formatCalculationValue(request.safety_factor)
                      : formatCalculationValue(request.payload, 'т')

                    // Extract and format result values
                    const liftingCapacity = formatCalculationValue(
                      entry.result.lifting_capacity,
                      'т',
                    )

                    const calculationResult = isPayloadMethod
                      ? formatCalculationValue(entry.result.payload, 'т')
                      : formatCalculationValue(entry.result.safety_factor)

                    // Prepare data for navigation
                    const initialFormData = prepareInitialFormData(entry)
                    const initialMode = isPayloadMethod
                      ? 'payload'
                      : 'safety_factor'
                    const initialResult = entry.result
                    const craneName = `${entry.manufacturer}_${entry.model}`

                    return (
                      <TableRow key={entry.id} className='table-row-hover'>
                        <TableCell className='history-timestamp-cell'>
                          <span>
                            {timestamp.date}
                            <br />
                            {timestamp.time}
                          </span>
                        </TableCell>
                        <TableCell className='fw-bold'>
                          <Popup
                            content='Перейти к расчету'
                            size='tiny'
                            trigger={
                              <Link
                                to={{
                                  pathname: `/cranes/${encodeURIComponent(craneName)}`,
                                  search: new URLSearchParams({
                                    boomLength:
                                      initialFormData.boomLength || '',
                                    boomRadius:
                                      initialFormData.boomRadius || '',
                                    equipmentWeight:
                                      initialFormData.equipmentWeight || '',
                                    payload: initialFormData.payload || '',
                                    safetyFactor:
                                      initialFormData.safetyFactor || '',
                                    mode: initialMode,
                                  }).toString(),
                                }}
                                state={{
                                  initialFormData,
                                  initialMode,
                                  initialResult,
                                }}
                                className='crane-name-link'
                              >
                                {entry.manufacturer} {entry.model}
                              </Link>
                            }
                          />
                        </TableCell>
                        <TableCell className='history-country-cell'>
                          {entry.country || ''}
                        </TableCell>
                        <TableCell>{chassisType}</TableCell>
                        <TableCell className='history-price-cell'>
                          {entry.basePrice
                            ? formatCalculationValue(entry.basePrice, '₽')
                            : '-'}
                        </TableCell>
                        <TableCell>{boomLength}</TableCell>
                        <TableCell className='history-method-cell'>
                          {entry.calculationMethod === 'payload' ? (
                            <span className='history-method-label font-size-5'>
                              Коэф. запаса
                            </span>
                          ) : (
                            <span className='history-method-label font-size-5'>
                              Вес груза
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{radius}</TableCell>
                        <TableCell>{equipmentWeight}</TableCell>
                        <TableCell>{inputValue}</TableCell>
                        <TableCell className='history-result-value fw-bold'>
                          {liftingCapacity}
                        </TableCell>
                        <TableCell className='history-result-value fw-bold'>
                          {calculationResult}
                        </TableCell>
                        <TableCell>
                          <div className='history-action-buttons'>
                            <ResultCopyButton
                              calculationResult={entry.result}
                              crane={{
                                name: `${entry.manufacturer}_${entry.model}`,
                                manufacturer: entry.manufacturer,
                                model: entry.model,
                                chassis_type: entry.chassisType || null,
                                max_lifting_capacity:
                                  entry.maxLiftingCapacity || null,
                              }}
                            />
                            <ResultDownloadButton
                              calculationResult={entry.result}
                              calculationMode={entry.calculationMethod}
                              crane={{
                                name: `${entry.manufacturer}_${entry.model}`,
                                manufacturer: entry.manufacturer,
                                model: entry.model,
                                chassis_type: entry.chassisType || null,
                                max_lifting_capacity:
                                  entry.maxLiftingCapacity || null,
                              }}
                            />
                            <ResultDeleteButton
                              deleteSingleEntry={deleteSingleEntry}
                              entryId={entry.id}
                              content='Удалить расчет'
                              skipConfirmation={true}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className='history-clear-button-container'>
                <ClearHistoryButton
                  onClear={handleClearHistory}
                  className='history-clear-button'
                />
              </div>
            </>
          )}
        </div>
      </main>
    )
  } catch (error) {
    handleError(error)
    return null // This will trigger a re-render with the error UI
  }
}

export default CalcHistory
