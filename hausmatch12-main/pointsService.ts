import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, increment, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import {
  UserPoints, BadgeTier, SpecialtyBadge,
  getTierForPoints, POINT_VALUES
} from '../types';

const pointsRef = (userId: string) => doc(db, 'userPoints', userId);

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const snap = await getDoc(pointsRef(userId));
  return snap.exists() ? (snap.data() as UserPoints) : null;
}