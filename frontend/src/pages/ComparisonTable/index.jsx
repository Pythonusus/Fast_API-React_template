import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Dropdown,
  Header,
  Message,
  Popup,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'semantic-ui-react'

import ComparisonForm from '@/src/components/ComparisonForm'
import ComparisonResult from '@/src/components/ComparisonResult'
import {
  COMPARISON_TABLE_STORAGE_KEY,
  COMPARISON_RESULTS_STORAGE_KEY,
  MAX_COMPARISON_TABLE_ENTRIES,
} from '@/src/config'
import useComparisonForm from '@/src/hooks/useComparisonForm'
import useComparisonTableClear from '@/src/hooks/useComparisonTableClear'
import useComparisonTableDelete from '@/src/hooks/useComparisonTableDelete'
import useComparisonTableState from '@/src/hooks/useComparisonTableState'
import { formatCalculationValue } from '@/src/utilities/formatters'
import './ComparisonTable.css'

// Reusable clear comparison table button
const ClearComparisonTableButton = ({ onClear, className = '' }) => (
  <Button
    color='red'
    size='small'
    onClick={onClear}
    icon='trash'
    content='Удалить все краны'
    className={className}
  />
)

// Helper function to get radius range text for error message
const getRadiusRangeText = (entry) => {
  // Check if radiusMin and radiusMax are stored in results
  if (
    entry.results?.radiusMin !== null &&
    entry.results?.radiusMin !== undefined &&
    entry.results?.radiusMax !== null &&
    entry.results?.radiusMax !== undefined
  ) {
    return `${entry.results.radiusMin} - ${entry.results.radiusMax}`
  }

  // Fallback: try to get from crane data
  const crane = entry.crane
  const boomLength = entry.selectedBoomLength || null
  if (!boomLength) return ''
  try {
    const radiusTable =
      // eslint-disable-next-line security/detect-object-injection
      crane.lc_tables['Основная стрела']?.table?.[boomLength]
    if (!radiusTable) return ''
    const radiusKeys = Object.keys(radiusTable)
      .map(Number)
      .toSorted((a, b) => a - b)
    const radiusMin = radiusKeys.at(0)
    const radiusMax = radiusKeys.at(-1)
    if (radiusMin !== undefined && radiusMax !== undefined) {
      return `${radiusMin} - ${radiusMax}`
    }
  } catch (error) {
    console.error('Error getting radius range:', error)
  }
  return ''
}

// Helper function to format result value
const formatResultValue = (value, unit) => {
  if (!value) return <span className='comparison-result-placeholder'>-</span>
  return formatCalculationValue(value, unit)
}

// Helper function to create link navigation params
const createLinkParams = (boomLength, formData) => {
  const searchParams = new URLSearchParams({
    boomLength: boomLength || '',
    boomRadius: formData.boomRadius || '',
    equipmentWeight: formData.equipmentWeight || '',
    payload: formData.payload || '',
    mode: 'safety_factor',
  })

  return {
    search: searchParams.toString(),
    state: {
      initialFormData: {
        boomLength: boomLength || '',
        boomRadius: formData.boomRadius || '',
        equipmentWeight: formData.equipmentWeight || '',
        payload: formData.payload || '',
        safetyFactor: '',
      },
      initialMode: 'safety_factor',
      initialResult: null,
    },
  }
}

const ComparisonTable = () => {
  // Core state management
  const { comparisonTable, setComparisonTable } = useComparisonTableState()

  // Individual operation hooks
  const { clearComparisonTable } = useComparisonTableClear(
    comparisonTable,
    setComparisonTable,
  )
  const { deleteSingleEntry } = useComparisonTableDelete(
    comparisonTable,
    setComparisonTable,
  )

  const [hasError, setHasError] = useState(false)

  // Use comparison form hook
  const {
    formData,
    errors: formErrors,
    validationErrors,
    isSubmitting,
    comparisonResults,
    handleInputChange,
    handleSubmit,
    handleClearForm,
  } = useComparisonForm(comparisonTable, setComparisonTable)

  const handleClearComparisonTable = () => {
    if (
      globalThis.confirm(
        'Вы уверены, что хотите очистить таблицу сравнения? Это действие нельзя отменить.',
      )
    ) {
      clearComparisonTable()
      setHasError(false) // Reset error state
    }
  }

  const handleClearResults = () => {
    try {
      setComparisonTable((prevTable) => {
        const updatedTable = prevTable.map((entry) => ({
          ...entry,
          results: {
            lifting_capacity: null,
            safety_factor: null,
            remaining_lc: null,
          },
        }))

        // Save to localStorage
        localStorage.setItem(
          COMPARISON_TABLE_STORAGE_KEY,
          JSON.stringify(updatedTable),
        )

        return updatedTable
      })

      // Also clear comparison results from localStorage
      localStorage.removeItem(COMPARISON_RESULTS_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing results:', error)
      handleError(error)
    }
  }

  const handleError = (error) => {
    console.error('Error in ComparisonTable component:', error)
    setHasError(true)
  }

  // Handle boom length selection change
  const handleBoomLengthChange = useCallback(
    (entryId, newBoomLength) => {
      try {
        setComparisonTable((prevTable) => {
          const updatedTable = prevTable.map((entry) => {
            if (entry.id === entryId) {
              return {
                ...entry,
                selectedBoomLength: newBoomLength,
                // Reset results when boom length changes
                results: {
                  lifting_capacity: null,
                  safety_factor: null,
                  remaining_lc: null,
                },
              }
            }
            return entry
          })

          // Save to localStorage
          localStorage.setItem(
            COMPARISON_TABLE_STORAGE_KEY,
            JSON.stringify(updatedTable),
          )

          return updatedTable
        })
      } catch (error) {
        console.error('Error updating boom length:', error)
        handleError(error)
      }
    },
    [setComparisonTable],
  )

  // Render error UI if there's an error
  if (hasError) {
    return (
      <main className='comparison-table-main-content'>
        <div className='comparison-table-container'>
          <Message error>
            <Message.Header>
              Произошла ошибка при загрузке таблицы сравнения
            </Message.Header>
            <p>
              Не удалось загрузить таблицу сравнения. Возможно, данные
              повреждены.
            </p>
          </Message>

          <div className='error-message-container'>
            <ClearComparisonTableButton onClear={handleClearComparisonTable} />
          </div>
        </div>
      </main>
    )
  }

  // Try to render the component, catch any errors
  try {
    return (
      <main className='comparison-table-main-content'>
        <div className='comparison-table-container'>
          {comparisonTable.length === 0 ? (
            <Message info>
              <Message.Header>Таблица сравнения пуста</Message.Header>
              <p>Добавьте краны для сравнения.</p>
            </Message>
          ) : (
            <>
              <div className='font-size-4'>
                Максимум {MAX_COMPARISON_TABLE_ENTRIES} кранов в таблице
                сравнения. <br /> Сейчас добавлено: {comparisonTable.length}
              </div>
              <Table
                celled
                striped
                compact
                size='small'
                unstackable
                className='comparison-table center-text'
              >
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className='crane-column'>
                      Кран
                    </TableHeaderCell>
                    <TableHeaderCell className='country-column hide-on-tablet'>
                      Страна
                    </TableHeaderCell>
                    <TableHeaderCell className='chassis-column hide-on-tablet'>
                      Тип шасси
                    </TableHeaderCell>
                    <TableHeaderCell className='price-column'>
                      Стоимость <br /> маш.-ч (₽)
                    </TableHeaderCell>
                    <TableHeaderCell className='boom-column'>
                      Конфигурация стрелы
                    </TableHeaderCell>
                    <TableHeaderCell className='result-column'>
                      Г/П на вылете
                    </TableHeaderCell>
                    <TableHeaderCell className='result-column'>
                      Коэф. запаса
                    </TableHeaderCell>
                    <TableHeaderCell className='result-column'>
                      Запас Г/П
                    </TableHeaderCell>
                    <TableHeaderCell className='actions-column'>
                      Действия
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {comparisonTable.map((entry) => {
                    const crane = entry.crane
                    const craneName =
                      crane.name || `${crane.manufacturer}_${crane.model}`
                    const availableBoomLengths =
                      crane.lc_tables['Основная стрела'].boom_lengths || []
                    const selectedBoomLength = entry.selectedBoomLength || null

                    // Format boom lengths for Semantic UI Dropdown
                    const boomLengthOptions = availableBoomLengths.map(
                      (boomLength) => ({
                        key: boomLength,
                        text: boomLength,
                        value: boomLength,
                      }),
                    )

                    // Get the selected table or default to first available
                    const boomLengthToUse =
                      selectedBoomLength ||
                      (availableBoomLengths.length > 0
                        ? availableBoomLengths[0]
                        : null)

                    // Format result values or show error message
                    const hasError = !!entry.results?.error
                    const radiusRangeText = hasError
                      ? getRadiusRangeText(entry)
                      : ''

                    const liftingCapacity = formatResultValue(
                      entry.results?.lifting_capacity,
                      'т',
                    )
                    const safetyFactor = formatResultValue(
                      entry.results?.safety_factor,
                    )
                    const remainingLc = formatResultValue(
                      entry.results?.remaining_lc,
                      'т',
                    )

                    // Check if safety factor is less than 1
                    const isUnsafe =
                      entry.results?.safety_factor !== null &&
                      entry.results?.safety_factor !== undefined &&
                      entry.results.safety_factor < 1

                    // Apply red background for unsafe cranes or validation errors
                    const shouldHighlightUnsafe = isUnsafe || hasError

                    const linkParams = createLinkParams(
                      boomLengthToUse,
                      formData,
                    )

                    return (
                      <TableRow
                        key={entry.id}
                        className={`table-row-hover ${
                          shouldHighlightUnsafe
                            ? 'comparison-table-row-unsafe'
                            : ''
                        }`}
                      >
                        <TableCell className='fw-bold'>
                          <Popup
                            content='Перейти к крану'
                            size='tiny'
                            trigger={
                              <Link
                                to={{
                                  pathname: `/cranes/${encodeURIComponent(craneName)}`,
                                  search: linkParams.search,
                                }}
                                state={linkParams.state}
                                className='crane-name-link'
                              >
                                {crane.manufacturer} <br /> {crane.model}
                              </Link>
                            }
                          />
                        </TableCell>
                        <TableCell className='hide-on-tablet'>
                          {crane.country || '-'}
                        </TableCell>
                        <TableCell className='hide-on-tablet'>
                          {crane.chassis_type || '-'}
                        </TableCell>
                        <TableCell className='price-cell'>
                          {crane.base_price
                            ? formatCalculationValue(crane.base_price, '₽')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {boomLengthOptions.length > 0 ? (
                            <Dropdown
                              placeholder='Выберите стрелу'
                              fluid
                              selection
                              className='fw-normal'
                              options={boomLengthOptions}
                              value={boomLengthToUse}
                              onChange={(e, { value }) =>
                                handleBoomLengthChange(entry.id, value)
                              }
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        {hasError ? (
                          <TableCell
                            className='comparison-result-error'
                            colSpan='3'
                          >
                            <div className='comparison-result-error-text'>
                              {radiusRangeText
                                ? `Невозможно выполнить расчет. Допустимый вылет стрелы для данной конфигурации ${radiusRangeText} м`
                                : entry.results?.error ||
                                  'Невозможно выполнить расчет'}
                            </div>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell
                              className={
                                isUnsafe
                                  ? 'comparison-result-value-unsafe'
                                  : 'comparison-result-value'
                              }
                            >
                              {liftingCapacity}
                            </TableCell>
                            <TableCell
                              className={
                                isUnsafe
                                  ? 'comparison-result-value-unsafe'
                                  : 'comparison-result-value'
                              }
                            >
                              {safetyFactor}
                            </TableCell>
                            <TableCell
                              className={
                                isUnsafe
                                  ? 'comparison-result-value-unsafe'
                                  : 'comparison-result-value'
                              }
                            >
                              {remainingLc}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <div className='comparison-action-buttons'>
                            <Popup
                              content='Удалить кран из таблицы'
                              size='small'
                              trigger={
                                <Button
                                  icon='trash'
                                  content=''
                                  color='red'
                                  size='mini'
                                  onClick={() => deleteSingleEntry(entry.id)}
                                  className='comparison-delete-button'
                                />
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className='comparison-clear-button-container'>
                <ClearComparisonTableButton
                  onClear={handleClearComparisonTable}
                  className='comparison-clear-button'
                />
                <Button
                  color='grey'
                  size='small'
                  onClick={handleClearResults}
                  icon='eraser'
                  content='Очистить результаты'
                  className='comparison-clear-results-button'
                />
              </div>
            </>
          )}
        </div>
        {comparisonTable.length > 0 && (
          <div className='comparison-table-form-and-result-container'>
            <hr className='comparison-table-divider' />
            <Header
              as='h2'
              textAlign='center'
              className='comparison-result-header font-size-3'
            >
              Выполнить сравнение кранов
            </Header>
            <hr className='comparison-table-divider' />
            <div className='comparison-input-and-result-container'>
              <ComparisonForm
                formData={formData}
                errors={formErrors}
                validationErrors={validationErrors}
                isSubmitting={isSubmitting}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onClear={handleClearForm}
              />
              <ComparisonResult
                comparisonResults={comparisonResults}
                comparisonTable={comparisonTable}
                formData={formData}
              />
            </div>
          </div>
        )}
      </main>
    )
  } catch (error) {
    handleError(error)
    return null // This will trigger a re-render with the error UI
  }
}

export default ComparisonTable
