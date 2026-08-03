import React from 'react'
import {
  Button,
  Checkbox,
  Dropdown,
  Form,
  FormField,
  Header,
} from 'semantic-ui-react'

import ValidatedFormField from '@/src/components/ValidatedFormField'
import './CalculationForm.css'

/**
 * Form component for crane calculation inputs
 *
 * Renders all form fields for crane calculation including boom configuration,
 * radius, equipment weight, and either payload or safety factor based on mode.
 *
 * @param {Object} props - Component props
 * @param {Object} props.crane - Crane data object with lc_table_boom_lengths
 * @param {Object} props.formData - Current form field values
 * @param {Object} props.errors - Error messages for popups
 * @param {Object} props.validationErrors - Validation errors for field styling
 * @param {boolean} props.isSubmitting - Loading state during calculation
 * @param {string} props.calculationMode - Current calculation mode
 * @param {Function} props.onInputChange - Handler for field value changes (field: string, value: string)
 * @param {Function} props.onSubmit - Handler for form submission (event: Event)
 * @param {Function} props.onClear - Handler to reset form (no parameters)
 * @param {Function} props.onModeChange - Handler to change calculation mode (receives boolean)
 */
const CalculationForm = ({
  crane,
  formData,
  errors,
  validationErrors,
  isSubmitting,
  calculationMode,
  onInputChange,
  onSubmit,
  onClear,
  onModeChange,
}) => {
  const boomLengthOptions = crane.lc_tables['Основная стрела'].boom_lengths.map(
    (boomLength) => ({
      key: boomLength,
      text: boomLength,
      value: boomLength,
    }),
  )

  return (
    <div className='calculation-form'>
      <Header
        as='h3'
        textAlign='center'
        className='calculation-form-header font-size-4'
      >
        Введите исходные данные
      </Header>
      <Form size='small' onSubmit={onSubmit}>
        <FormField className='calculation-method-form-field'>
          <label className='custom-form-label'>
            <Checkbox
              toggle
              checked={calculationMode === 'payload'}
              onChange={(e, { checked }) =>
                onModeChange(checked ? 'payload' : 'safety_factor')
              }
            />
            <div className='calculation-method-container font-size-5'>
              <span className='calculation-method-label'>Режим расчета:</span>
              {calculationMode === 'payload'
                ? ' по коэффициенту запаса'
                : ' по заданному грузу'}
            </div>
          </label>
        </FormField>

        <ValidatedFormField
          field='boomLength'
          label='Конфигурация стрелы'
          value={formData.boomLength}
          onChange={(value) => onInputChange('boomLength', value)}
          error={errors.boomLength}
          validationError={validationErrors.boomLength}
          type='dropdown'
          children={
            <Dropdown
              id='boom-length-dropdown'
              placeholder='Выберите конфигурацию стрелы'
              fluid
              selection
              className='fw-normal'
              options={boomLengthOptions}
              value={formData.boomLength}
              onChange={(e, { value }) => onInputChange('boomLength', value)}
            />
          }
        />

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

        {calculationMode === 'payload' ? (
          <ValidatedFormField
            field='safetyFactor'
            label='Необходимый коэффициент запаса (необязательно)'
            placeholder='Введите коэффициент запаса (1.0 по умолчанию)'
            value={formData.safetyFactor}
            onChange={(value) => onInputChange('safetyFactor', value)}
            error={errors.safetyFactor}
            validationError={validationErrors.safetyFactor}
            inputType='number'
          />
        ) : (
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
        )}

        <div className='calculation-buttons-container'>
          <Button
            type='submit'
            color='blue'
            fluid
            size='tiny'
            loading={isSubmitting}
            disabled={isSubmitting}
            className='calculate-button'
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
            className='clear-button'
          >
            Очистить
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default CalculationForm
