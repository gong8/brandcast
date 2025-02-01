import { collection, doc, getDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { calculateAIScore } from '@/utils/scoring';
import { calculateAISummaryAndRecommendation } from '@/utils/recommendations';

interface CachedScore {
  streamerId: string;
  relevanceScore: number;
  companyId: string;
  calculatedAt: number;
}

export const getCompanyProfile = async (): Promise<CompanyProfile | null> => {
  const companyDoc = await getDoc(doc(db, 'companyProfile', 'main'));
  return companyDoc.exists() ? companyDoc.data() as CompanyProfile : null;
};

export const getCachedScores = async (streamerIds: string[]): Promise<{ [key: string]: number }> => {
  try {
    const cachedScoresSnapshot = await getDocs(collection(db, 'streamerScores'));
    const cachedScores: { [key: string]: number } = {};
    
    cachedScoresSnapshot.docs.forEach(doc => {
      const data = doc.data() as CachedScore;
      // Only use cached scores that are less than 24 hours old
      if (Date.now() - data.calculatedAt < 24 * 60 * 60 * 1000) {
        cachedScores[data.streamerId] = data.relevanceScore;
      }
    });
    
    return cachedScores;
  } catch (error) {
    console.error('Error getting cached scores:', error);
    return {};
  }
};

export const updateStreamer = async (
  streamerId: string,
  streamer: Streamer,
  companyProfile: CompanyProfile | null,
  relevanceScore: number
) => {
  const batch = writeBatch(db);

  // Update streamer document
  const streamerRef = doc(db, 'analysedStreamers', streamerId);
  batch.set(streamerRef, {
    ...streamer,
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Update cached score
  const scoreRef = doc(db, 'streamerScores', `${streamerId}_main`);
  batch.set(scoreRef, {
    streamerId,
    companyId: 'main',
    relevanceScore,
    calculatedAt: Date.now()
  });

  // Add to history
  const historyRef = doc(db, 'history', streamerId);
  batch.set(historyRef, {
    ...streamer,
    relevanceScore,
    analysedAt: Date.now()
  }, { merge: true });

  await batch.commit();
};

export const loadStreamers = async (companyProfile: CompanyProfile | null) => {
  const streamersSnapshot = await getDocs(collection(db, 'analysedStreamers'));
  const batch = writeBatch(db);
  let needsBatchCommit = false;
  
  const streamersData = streamersSnapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data() as Streamer;
    const docId = docSnapshot.id;
    let updatedData = { ...data };
    let needsUpdate = false;
    
    // Calculate AI score if missing
    if (data.aiScore === undefined) {
      updatedData.aiScore = calculateAIScore(data);
      needsUpdate = true;
    }

    // Calculate AI summary and recommendation if either is missing
    if (!data.aiSummary || !data.aiRecommendation) {
      const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(data, companyProfile);
      updatedData.aiSummary = aiSummary;
      updatedData.aiRecommendation = aiRecommendation;
      needsUpdate = true;
    }

    // Update document if needed
    if (needsUpdate) {
      needsBatchCommit = true;
      const streamerRef = doc(db, 'analysedStreamers', docId);
      batch.set(streamerRef, updatedData, { merge: true });
      
      // Add to history
      const historyRef = doc(db, 'history', docId);
      batch.set(historyRef, {
        ...updatedData,
        analysedAt: Date.now()
      }, { merge: true });
    }

    return {
      ...updatedData,
      id: docId
    };
  });

  // Commit the batch if we have any operations
  if (needsBatchCommit) {
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error saving updates:', error);
    }
  }

  return streamersData;
}; 