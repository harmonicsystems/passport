import { z } from 'zod';

/**
 * QR Code payload specification
 *
 * Format: mp1:<JWT>
 * - mp1 = market passport version 1
 * - JWT signed with HS256 server-side
 */

export const QR_VERSION_PREFIX = 'mp1:';

// JWT claims for check-in QR codes
export const CheckInTokenClaimsSchema = z.object({
  iss: z.literal('market-passport'),
  aud: z.literal('checkin'),
  mid: z.string().min(1), // marketId
  eid: z.string().min(1), // eventDayId
  iat: z.number(), // issued at (Unix timestamp)
  exp: z.number(), // expires at (Unix timestamp)
  jti: z.string().optional(), // token id (for revocation)
});

export type CheckInTokenClaims = z.infer<typeof CheckInTokenClaimsSchema>;

// Parse a scanned QR string
export const QrPayloadSchema = z.string().transform((val, ctx) => {
  if (!val.startsWith(QR_VERSION_PREFIX)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid QR code format',
    });
    return z.NEVER;
  }
  return val.slice(QR_VERSION_PREFIX.length);
});

/**
 * Extract the JWT from a scanned QR string
 * Returns the JWT string or null if invalid format
 */
export function extractJwtFromQr(qrString: string): string | null {
  if (!qrString.startsWith(QR_VERSION_PREFIX)) {
    return null;
  }
  return qrString.slice(QR_VERSION_PREFIX.length);
}

/**
 * Create a QR payload string from a JWT
 */
export function createQrPayload(jwt: string): string {
  return `${QR_VERSION_PREFIX}${jwt}`;
}
