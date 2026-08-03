import React, { useEffect, useRef, useState } from 'react'
import { Header, Table } from 'semantic-ui-react'

import AddToComparisonButton from '@/src/components/AddToComparisonButton'
import ImageGallery from '@/src/components/ImageGallery'
import './CraneDataView.css'

const getLcTableRows = (lc_table) => {
  const boomLengths = lc_table.boom_lengths
  const radiuses = lc_table.radiuses
  const rows = []
  for (const radius of radiuses) {
    const row = [radius]
    for (const boomLength of boomLengths) {
      // boomLength and radius are not user-controlled, so we can use them as keys
      // eslint-disable-next-line security/detect-object-injection
      const capacity = lc_table.table[boomLength]?.[radius] || '-'
      row.push(capacity)
    }
    rows.push(row)
  }
  return rows
}

const CraneView = ({ crane }) => {
  // Get available table names
  const availableTableNames = crane.lc_tables_names

  // Set default table name to 'Основная стрела' or fallback to first available
  const defaultTableName = availableTableNames.includes('Основная стрела')
    ? 'Основная стрела'
    : availableTableNames[0] || ''

  const [tableName, setTableName] = useState(defaultTableName)

  // Move all hooks BEFORE any conditional returns
  const metadataTableRef = useRef(null)
  const scrollableContainerRef = useRef(null)

  // Update table name if crane changes or if default is not available
  useEffect(() => {
    if (!availableTableNames.includes(tableName)) {
      setTableName(defaultTableName)
    }
  }, [crane, defaultTableName, tableName, availableTableNames])

  // Update table-scrollable-container height to match metadata-table
  useEffect(() => {
    const updateHeight = () => {
      if (metadataTableRef.current && scrollableContainerRef.current) {
        requestAnimationFrame(() => {
          const metadataTableHeight = metadataTableRef.current.offsetHeight
          if (metadataTableHeight > 0) {
            scrollableContainerRef.current.style.height = `${metadataTableHeight}px`
          }
        })
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateHeight, 0)

    // Update on window resize
    window.addEventListener('resize', updateHeight)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateHeight)
    }
  }, [crane, tableName]) // Re-run when crane or table changes

  // Get the selected table
  // tableName is not user-controlled, so we can use it as a key
  // eslint-disable-next-line security/detect-object-injection
  const selectedTable = crane.lc_tables[tableName]
  if (!selectedTable) {
    return null // or return an error message
  }

  const lcTableRows = getLcTableRows(selectedTable)
  const boomLengths = selectedTable.boom_lengths

  return (
    <div className='crane-data-view-container'>
      <div className='crane-metadata-container'>
        <div ref={metadataTableRef}>
          <Table
            celled
            striped
            unstackable
            size='small'
            className='metadata-table mb-5'
          >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell colSpan='2' className='table-main-header'>
                  <Header
                    as='h1'
                    textAlign='center'
                    className='font-size-4 text-white'
                  >
                    Характеристики крана {crane.manufacturer} {crane.model}
                  </Header>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <b>Тип шасси:</b>
                </Table.Cell>
                <Table.Cell>{crane.chassis_type}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Страна производитель:</b>
                </Table.Cell>
                <Table.Cell>{crane.country}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Макс. грузоподъемность:</b>
                </Table.Cell>
                <Table.Cell>{crane.max_lifting_capacity}т</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Код по {crane.pricebook}:</b>
                </Table.Cell>
                <Table.Cell>{crane.resource_code}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Базовая цена:</b>
                </Table.Cell>
                <Table.Cell>{crane.base_price} руб./маш.-ч</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Зарплата машиниста:</b>
                </Table.Cell>
                <Table.Cell>{crane.labor_cost} руб./маш.-ч</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Cуммарная стоимость:</b>
                </Table.Cell>
                <Table.Cell>{crane.price_per_hour} руб./маш.-ч</Table.Cell>
              </Table.Row>
              {crane.description && (
                <Table.Row>
                  <Table.Cell>
                    <b>Примечания:</b>
                  </Table.Cell>
                  <Table.Cell className='font-size-6'>
                    {crane.description.split(';').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </Table.Cell>
                </Table.Row>
              )}
              {crane.manufacturer_url && (
                <Table.Row>
                  <Table.Cell>
                    <b>Ссылка на сайт производителя:</b>
                  </Table.Cell>
                  <Table.Cell className='font-size-6'>
                    <a
                      href={crane.manufacturer_url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {crane.manufacturer_url}
                    </a>
                  </Table.Cell>
                </Table.Row>
              )}
              {crane.crane_url && (
                <Table.Row>
                  <Table.Cell>
                    <b>Ссылка на кран:</b>
                  </Table.Cell>
                  <Table.Cell className='font-size-6'>
                    <a
                      href={crane.crane_url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {crane.manufacturer_url}
                      {crane.model.toLowerCase()}
                    </a>
                  </Table.Cell>
                </Table.Row>
              )}
              {crane.dwg_url && (
                <Table.Row>
                  <Table.Cell>
                    <b>Ссылка на dwg:</b>
                  </Table.Cell>
                  <Table.Cell className='font-size-6'>
                    <a
                      href={crane.dwg_url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {crane.dwg_url}
                    </a>
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row>
                <Table.Cell textAlign='top'>
                  <b>Доступные загрузки:</b>
                </Table.Cell>
                <Table.Cell>
                  {crane.attachments
                    .filter((attachment) => !attachment.is_inline)
                    .map((attachment) => (
                      <div key={attachment.id} className='font-size-6'>
                        <a
                          href={`/api/attachments/${attachment.id}`}
                          className='attachment-link'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <i className='file alternate icon'></i>
                          {attachment.filename}
                        </a>
                      </div>
                    ))}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <b>Добавить в таблицу сравнения:</b>
                </Table.Cell>
                <Table.Cell className='center-text'>
                  <AddToComparisonButton
                    craneName={crane.name}
                    className='detail-add-to-comparison-button'
                  />
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
        {crane.attachments?.some((attachment) => attachment.is_inline) && (
          <ImageGallery attachments={crane.attachments} />
        )}
      </div>

      <div ref={scrollableContainerRef} className='table-scrollable-container'>
        <Table
          compact
          celled
          striped
          size='small'
          unstackable
          className='custom-small-table'
        >
          <Table.Header className='sticky-top'>
            <Table.Row>
              <Table.HeaderCell
                colSpan={boomLengths.length + 1}
                className='table-main-header'
              >
                <Header
                  as='h2'
                  textAlign='center'
                  className='font-size-4 text-white'
                >
                  Таблица грузоподъемности (т)
                </Header>
              </Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell className='custom-header-cell sticky-left'></Table.HeaderCell>
              <Table.HeaderCell
                colSpan={boomLengths.length}
                textAlign='center'
                className='custom-header-cell font-size-5'
              >
                Конфигурация стрелы
              </Table.HeaderCell>
            </Table.Row>
            <Table.Row textAlign='center'>
              <Table.HeaderCell className='custom-header-cell sticky-left font-size-5'>
                Вылет, м
              </Table.HeaderCell>
              {boomLengths.map((boomLength) => (
                <Table.HeaderCell
                  key={boomLength}
                  className=' custom-boom-cell'
                >
                  {boomLength}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {lcTableRows.map((row, index) => (
              <Table.Row key={index} className='lc_table_body_row'>
                {row.map((cell, cellIndex) => (
                  <Table.Cell key={cellIndex}>{cell}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default CraneView
