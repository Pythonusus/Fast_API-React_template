import React from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Container,
  Header,
  Icon,
  Message,
  Popup,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'semantic-ui-react'

import AddToComparisonButton from '@/src/components/AddToComparisonButton'
import './CranesList.css'

const CranesList = ({
  cranes = [],
  loading = false,
  error = null,
  hasMore = false,
  loadingMore = false,
  onLoadMore = null,
}) => {
  if (loading && cranes.length === 0) {
    return (
      <Container>
        <div className='loading-container'>
          <Icon name='spinner' loading size='huge' />
          <Header as='h2' className='loading-header'>
            Загружаем краны...
          </Header>
        </div>
      </Container>
    )
  }

  return (
    <>
      {/* Error Message */}
      {error && (
        <Message negative>
          <Message.Header>Ошибка</Message.Header>
          <p>{error}</p>
        </Message>
      )}

      {/* Show cranes if available */}
      {cranes.length > 0 ? (
        <Table celled striped compact unstackable>
          <TableHeader className='cranes-table-header'>
            <TableRow>
              <TableHeaderCell className='text-white'>
                Название <br />
                <span className='font-size-5 text-white'>
                  (нажмите для перехода к расчету)
                </span>
              </TableHeaderCell>
              <TableHeaderCell className='text-white'>
                Тип шасси
              </TableHeaderCell>
              <TableHeaderCell className='hide-on-tablet text-white'>
                Страна <br /> производитель
              </TableHeaderCell>
              <TableHeaderCell className='hide-on-tablet text-white'>
                Код ресурса по ФСЭМ-2022
              </TableHeaderCell>
              <TableHeaderCell className='hide-on-tablet text-white'>
                Стоимость маш.-ч (₽)
              </TableHeaderCell>
              <TableHeaderCell className='text-white'>
                Макс. г/п (т)
              </TableHeaderCell>
              <TableHeaderCell className='text-white comparison-column'>
                Добавить к сравнению
              </TableHeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {cranes.map((crane) => (
              <TableRow key={crane.name} className='table-row-hover'>
                <TableCell>
                  <Popup
                    content='Перейти к расчету крана'
                    trigger={
                      <Link
                        className='crane-name-link'
                        to={`/cranes/${encodeURIComponent(crane.name)}`}
                      >
                        {crane.manufacturer} {crane.model}
                      </Link>
                    }
                  />
                </TableCell>
                <TableCell>{crane.chassis_type}</TableCell>
                <TableCell className='hide-on-tablet'>
                  {crane.country}
                </TableCell>
                <TableCell className='hide-on-tablet'>
                  {crane.resource_code}
                </TableCell>
                <TableCell className='hide-on-tablet'>
                  {crane.base_price.toLocaleString()}
                </TableCell>
                <TableCell>{crane.max_lifting_capacity}</TableCell>
                <TableCell className='comparison-cell'>
                  <AddToComparisonButton craneName={crane.name} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Message info>
          <Message.Header>Не найдено</Message.Header>
          <p>
            Нет кранов, соответствующих вашим текущим фильтрам. Попробуйте
            изменить критерии поиска.
          </p>
        </Message>
      )}

      {/* Show More Button */}
      {hasMore && cranes.length > 0 && (
        <Button
          primary
          size='small'
          loading={loadingMore}
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? 'Загружаем...' : 'Показать ещё'}
        </Button>
      )}
    </>
  )
}

export default CranesList
