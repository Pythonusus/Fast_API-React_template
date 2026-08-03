/**
 * API requests for payload and safety factor calculations
 * @module api/calcRequests
 */

import { fetchWithLicense } from '@midasoft/license-checker-module'

/**
 * Create a payload calculation request
 * @param {string} craneName - Name of the crane
 * @param {string} boomLen - Boom length configuration
 * @param {number} radius - Radius in meters
 * @param {number} equipmentWeight - Weight of equipment in tons
 * @param {number} safetyFactor - Safety factor
 * @returns {Object} Payload request object
 */
export const createPayloadRequest = (
  craneName,
  boomLen,
  radius,
  equipmentWeight,
  safetyFactor,
) => ({
  crane_name: craneName,
  boom_len: boomLen,
  radius: Number.parseFloat(radius),
  equipment_weight: Number.parseFloat(equipmentWeight),
  safety_factor: Number.parseFloat(safetyFactor),
})

/**
 * Create a safety factor calculation request
 * @param {string} craneName - Name of the crane
 * @param {string} boomLen - Boom length configuration
 * @param {number} radius - Radius in meters
 * @param {number} equipmentWeight - Weight of equipment in tons
 * @param {number} payload - Desired payload in tons
 * @returns {Object} Safety factor request object
 */
export const createSafetyFactorRequest = (
  craneName,
  boomLen,
  radius,
  equipmentWeight,
  payload,
) => ({
  crane_name: craneName,
  boom_len: boomLen,
  radius: Number.parseFloat(radius),
  equipment_weight: Number.parseFloat(equipmentWeight),
  payload: Number.parseFloat(payload),
})

/**
 * Calculate payload for given request
 * @param {Object} request - Payload calculation request
 * @returns {Promise<Object>} Calculation results
 */
export const calculatePayload = async (request) => {
  const payloadRequest = {
    payload_request: request,
  }

  const response = await fetchWithLicense('/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadRequest),
  })

  if (!response.ok) {
    throw new Error('Ошибка в расчете полезного груза')
  }

  return await response.json()
}

/**
 * Calculate safety factor for given request
 * @param {Object} request - Safety factor calculation request
 * @returns {Promise<Object>} Calculation results
 */
export const calculateSafetyFactor = async (request) => {
  const safetyRequest = {
    safety_request: request,
  }

  const response = await fetchWithLicense('/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(safetyRequest),
  })

  if (!response.ok) {
    throw new Error('Ошибка в расчете коэффициента запаса')
  }

  return await response.json()
}
