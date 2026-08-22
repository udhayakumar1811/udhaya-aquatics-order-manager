import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Atomically reserves the next order number using a Firestore transaction,
 * so two people/devices creating orders at the same moment never collide.
 * Returns a display ID like "AQ0001".
 */
export async function generateOrderId() {
  const counterRef = doc(db, 'counters', 'orders');

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? Number(counterSnap.data().lastOrderNumber) || 0 : 0;
    const next = current + 1;
    transaction.set(counterRef, { lastOrderNumber: next }, { merge: true });
    return next;
  });

  return `AQ${String(nextNumber).padStart(4, '0')}`;
}