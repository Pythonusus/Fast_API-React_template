import { useState, useEffect } from 'react'

import { fetchCraneByName } from '@/src/api/cranes'
import { formatCalculationValue } from '@/src/utilities/formatters'

/**
 * Component to display crane price
 * @param {Object} props - Component props
 * @param {string} props.craneName - Name of the crane in format "Manufacturer_Model"
 */
const CranePriceField = ({ craneName }) => {
  const [price, setPrice] = useState(null)

  useEffect(() => {
    fetchCraneByName(craneName)
      .then((crane) => setPrice(crane.price_per_hour))
      .catch(() => setPrice(null))
  }, [craneName])

  return price ? formatCalculationValue(price, '₽') : '-'
}

export default CranePriceField
