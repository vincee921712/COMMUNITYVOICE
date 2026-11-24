import { Complaint } from './types';
import { INITIAL_COMPLAINTS } from './mockData';
import { supabase, isSupabaseConfigured } from './supabase/client';

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula (in meters).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates token overlap similarity (Jaccard similarity) between two text strings.
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near',
    'sa', 'ang', 'ng', 'mga', 'may', 'na', 'kay', 'para', 'subalit',
    'hibao-an', 'sur', 'mandurriao', 'iloilo', 'city', 'barangay'
  ]);

  const tokenize = (str: string) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w))
    );

  const wordsA = tokenize(text1);
  const wordsB = tokenize(text2);

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...wordsA, ...wordsB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export interface DuplicateDetectionResult {
  isDuplicateFound: boolean;
  matchedComplaint: Complaint | null;
  distanceMeters: number;
  similarityScore: number;
  reason: string;
}

/**
 * Checks a proposed complaint against active/unresolved complaints.
 */
export function checkDuplicateProximity(
  targetLat: number,
  targetLng: number,
  targetTitle: string,
  targetDescription: string,
  targetCategoryId: string,
  existingComplaints: Complaint[],
  maxDistanceMeters: number = 100
): DuplicateDetectionResult {
  // Filter for active, unresolved complaints
  const activeComplaints = existingComplaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Closed'
  );

  let closestMatch: Complaint | null = null;
  let minDistance = Infinity;
  let highestSimilarity = 0;
  let bestReason = '';

  const combinedTargetText = `${targetTitle} ${targetDescription}`;

  for (const item of activeComplaints) {
    if (!item.latitude || !item.longitude) continue;

    const dist = calculateHaversineDistance(
      targetLat,
      targetLng,
      item.latitude,
      item.longitude
    );

    if (dist <= maxDistanceMeters) {
      const combinedItemText = `${item.title} ${item.description}`;
      const sim = calculateTextSimilarity(combinedTargetText, combinedItemText);
      const isSameCategory = item.category_id === targetCategoryId;

      // Duplicate match condition:
      // 1. Same category within 100 meters, OR
      // 2. High text similarity (>= 0.15) within 100 meters, OR
      // 3. Very close physical proximity (< 35 meters)
      const isMatch = isSameCategory || sim >= 0.15 || dist < 35;

      if (isMatch) {
        if (dist < minDistance || sim > highestSimilarity) {
          minDistance = dist;
          highestSimilarity = Math.max(highestSimilarity, sim);
          closestMatch = item;

          if (isSameCategory && sim >= 0.15) {
            bestReason = `Same category and matching issue description located ${dist} meters away.`;
          } else if (isSameCategory) {
            bestReason = `Active complaint in the same category located only ${dist} meters away.`;
          } else if (dist < 35) {
            bestReason = `Immediate physical proximity (${dist} meters) to an ongoing reported incident.`;
          } else {
            bestReason = `Similar incident keywords reported ${dist} meters away.`;
          }
        }
      }
    }
  }

  return {
    isDuplicateFound: closestMatch !== null,
    matchedComplaint: closestMatch,
    distanceMeters: minDistance === Infinity ? 0 : minDistance,
    similarityScore: Math.round(highestSimilarity * 100),
    reason: bestReason,
  };
}

/**
 * Loads all complaints from local storage and Supabase for real-time proximity checking.
 */
export async function fetchAllActiveComplaints(): Promise<Complaint[]> {
  const combinedMap = new Map<string, Complaint>();

  // 1. Load initial mock complaints
  for (const c of INITIAL_COMPLAINTS) {
    combinedMap.set(c.tracking_number, c);
  }

  // 2. Load localStorage complaints
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cv_custom_complaints');
      if (stored) {
        const parsed = JSON.parse(stored) as Complaint[];
        for (const item of parsed) {
          if (item && item.tracking_number) {
            combinedMap.set(item.tracking_number, item);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading local complaints for duplicate check:', e);
    }
  }

  // 3. Load from Supabase if online
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        for (const item of data) {
          if (item && item.tracking_number) {
            combinedMap.set(item.tracking_number, item as Complaint);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase duplicate fetch fallback:', e);
    }
  }

  return Array.from(combinedMap.values());
}
