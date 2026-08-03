import React from 'react'
import { Button, Form, Header } from 'semantic-ui-react'

import ValidatedFormField from '@/src/components/ValidatedFormField'
import './ComparisonForm.css'

/**
 * Form component for comparison table calculation inputs
 *
 * Renders form fields for comparison calculation including radius,
 * equipment weight, and either payload or safety factor based on mode.
 * Crane names and boom length are taken from the comparison table.
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form field values
 * @param {Object} props.errors - Error messages for popups
 * @param {Object} props.validationErrors - Validation errors for field styling
 * @param {boolean} props.isSubmitting - Loading state during calculation
 * @param {Function} props.onInputChange - Handler for field value changes (field: string, value: string)
 * @param {Function} props.onSubmit - Handler for form submission (event: Event)
 * @param {Function} props.onClear - Handler to reset form (no parameters)
 */
const ComparisonForm = ({
  formData,
  errors,
  validationErrors,
  isSubmitting,
  onInputChange,
  onSubmit,
  onClear,
}) => {
  return (
    <div className='comparison-form'>
      <Header
        as='h3'
        textAlign='center'
        className='comparison-form-header font-size-4'
      >
        Введите исходные данные
      </Header>
      <Form size='small' onSubmit={onSubmit}>
        <ValidatedFormField
          field='boomRadius'
          label='Вылет стрелы, м'
          placeholder='Введите вылет стрелы'
          value={formData.boomRadius}
          onChange={(value) => onInputChange('boomRadius', value)}
          error={errors.boomRadius}
          validationError={validationErrors.boomRadius}
          inputType='number'
        />

        <ValidatedFormField
          field='equipmentWeight'
          label='Вес строповочного оборудования (необязательно), т'
          placeholder='Введите вес строповочного оборудования (0 по умолчанию)'
          value={formData.equipmentWeight}
          onChange={(value) => onInputChange('equipmentWeight', value)}
          error={errors.equipmentWeight}
          validationError={validationErrors.equipmentWeight}
          inputType='number'
        />
        <ValidatedFormField
          field='payload'
          label='Вес груза, т'
          placeholder='Введите вес груза'
          value={formData.payload}
          onChange={(value) => onInputChange('payload', value)}
          error={errors.payload}
          validationError={validationErrors.payload}
          inputType='number'
        />

        <div className='comparison-buttons-container'>
          <Button
            type='submit'
            color='blue'
            fluid
            size='tiny'
            loading={isSubmitting}
            disabled={isSubmitting}
            className='comparison-form-calculate-button'
          >
            Вычислить
          </Button>
          <Button
            type='button'
            color='grey'
            fluid
            size='tiny'
            onClick={onClear}
            disabled={isSubmitting}
            className='comparison-form-clear-button'
          >
            Очистить
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default ComparisonForm
