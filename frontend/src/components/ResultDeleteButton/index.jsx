import { Button } from 'semantic-ui-react'

import './ResultDeleteButton.css'

/**
 * Component for deleting a calculation result
 *
 * @param {Object} props - Component props
 * @param {Function} props.deleteSingleEntry - Function to delete the entry
 * @param {number} props.entryId - ID of the entry to delete
 * @param {boolean} props.skipConfirmation - If true, skip confirmation dialog (default: false)
 * @param {string} props.content - Content of the button (default: 'Удалить')
 * @param {string} props.size - Size of the button (default: 'tiny')
 * @param {string} props.className - Class name of the button (default: '')
 */
const ResultDeleteButton = ({
  deleteSingleEntry,
  entryId,
  skipConfirmation = false,
  content = 'Удалить',
  size = 'tiny',
  className = '',
}) => {
  const handleDelete = () => {
    if (
      skipConfirmation ||
      globalThis.confirm(
        'Вы уверены, что хотите удалить этот расчет из истории? Это действие нельзя отменить.',
      )
    ) {
      deleteSingleEntry(entryId)
    }
  }

  return (
    <Button
      labelPosition='left'
      color='red'
      size={size}
      fluid
      content={content}
      icon='trash'
      onClick={handleDelete}
      className={`result-delete-button ${className}`}
    />
  )
}

export default ResultDeleteButton
