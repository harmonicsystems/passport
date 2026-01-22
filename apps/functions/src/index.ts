import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  CheckInTokenClaimsSchema,
  createQrPayload,
  extractJwtFromQr,
  type CheckIn,
  type EventDay,
} from '@market-passport/shared';

admin.initializeApp();
const db = admin.firestore();

// Get JWT secret from environment
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  return secret;
};

// ============================================
// Generate QR Token (Admin only)
// ============================================

const GenerateQrRequestSchema = z.object({
  marketId: z.string().min(1),
  eventDayId: z.string().min(1),
  expiresAt: z.number(), // Unix timestamp
});

export const generateQrToken = functions.https.onCall(async (data, context) => {
  // Verify authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  // Verify admin
  const adminDoc = await db.collection('admins').doc(context.auth.token.email?.toLowerCase() || '').get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  // Validate request
  const parsed = GenerateQrRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request data');
  }

  const { marketId, eventDayId, expiresAt } = parsed.data;

  // Verify event day exists
  const eventDayDoc = await db.collection('eventDays').doc(eventDayId).get();
  if (!eventDayDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event day not found');
  }

  const eventDay = eventDayDoc.data() as EventDay;
  if (eventDay.marketId !== marketId) {
    throw new functions.https.HttpsError('invalid-argument', 'Market ID mismatch');
  }

  // Generate JWT
  const claims = {
    iss: 'market-passport',
    aud: 'checkin',
    mid: marketId,
    eid: eventDayId,
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt,
  };

  const token = jwt.sign(claims, getJwtSecret(), { algorithm: 'HS256' });
  const qrPayload = createQrPayload(token);

  // Store token ID on event day for reference
  await eventDayDoc.ref.update({ qrTokenId: token.substring(0, 16) });

  return { qrPayload };
});

// ============================================
// Check In
// ============================================

const CheckInRequestSchema = z.object({
  qrPayload: z.string().min(1),
});

export const checkIn = functions.https.onCall(async (data, context) => {
  // Verify authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const userId = context.auth.uid;

  // Validate request
  const parsed = CheckInRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request data');
  }

  // Extract JWT from QR payload
  const jwtToken = extractJwtFromQr(parsed.data.qrPayload);
  if (!jwtToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QR code format');
  }

  // Verify JWT
  let claims;
  try {
    const decoded = jwt.verify(jwtToken, getJwtSecret(), {
      algorithms: ['HS256'],
      audience: 'checkin',
      issuer: 'market-passport',
    });

    const claimsParsed = CheckInTokenClaimsSchema.safeParse(decoded);
    if (!claimsParsed.success) {
      throw new Error('Invalid claims');
    }
    claims = claimsParsed.data;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new functions.https.HttpsError('failed-precondition', 'QR code expired');
    }
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QR code');
  }

  const { mid: marketId, eid: eventDayId } = claims;

  // Check if already checked in today
  const existingCheckIn = await db
    .collection('checkIns')
    .where('userId', '==', userId)
    .where('eventDayId', '==', eventDayId)
    .limit(1)
    .get();

  if (!existingCheckIn.empty) {
    throw new functions.https.HttpsError('already-exists', 'Already checked in today');
  }

  // Get event day to find seasonId
  const eventDayDoc = await db.collection('eventDays').doc(eventDayId).get();
  if (!eventDayDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event day not found');
  }
  const eventDay = eventDayDoc.data() as EventDay;

  // Create check-in
  const checkIn: Omit<CheckIn, 'id'> = {
    marketId,
    eventDayId,
    userId,
    timestamp: Date.now(),
    source: 'scan',
  };

  const checkInRef = await db.collection('checkIns').add(checkIn);

  // Count visits this season for reward computation
  const seasonCheckIns = await db
    .collection('checkIns')
    .where('userId', '==', userId)
    .where('marketId', '==', marketId)
    .get();

  // Filter to current season (in practice, you'd join with eventDays)
  // For MVP, we count all check-ins for this market
  const visitCount = seasonCheckIns.size;

  return {
    success: true,
    checkInId: checkInRef.id,
    visitCount,
  };
});

// ============================================
// Get User Stats
// ============================================

export const getUserStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const userId = context.auth.uid;
  const marketId = data?.marketId;

  if (!marketId) {
    throw new functions.https.HttpsError('invalid-argument', 'marketId required');
  }

  // Get all check-ins for this user at this market
  const checkIns = await db
    .collection('checkIns')
    .where('userId', '==', userId)
    .where('marketId', '==', marketId)
    .orderBy('timestamp', 'desc')
    .get();

  const visits = checkIns.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Get earned rewards
  const rewards = await db
    .collection('userRewards')
    .where('userId', '==', userId)
    .get();

  const earnedRewards = rewards.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    visitCount: visits.length,
    visits,
    earnedRewards,
  };
});
