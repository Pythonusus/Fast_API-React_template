/**
 * Read and validate a successful API response body.
 *
 * Call after ``response.ok``. A non-JSON body or a payload that fails the
 * Zod schema throws with ``INVALID_RESPONSE_BODY`` so hooks can show the
 * same error card as a failed request, instead of crashing in render.
 */
import type { z } from "zod";

import { INVALID_RESPONSE_BODY } from "~/common-texts/errors";

export const parseResponseJson = async <T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(INVALID_RESPONSE_BODY);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error(INVALID_RESPONSE_BODY);
  }

  return parsed.data;
};
