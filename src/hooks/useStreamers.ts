import { useState } from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { calculateAIScore, calculateRelevanceScore } from '@/utils/scoring';
import { calculateAISummaryAndRecommendation } from '@/utils/recommendations';
import { useToast } from '@chakra-ui/react';

export const useStreamers = () => {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputingId, setRecomputingId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<string>('relevance');
  const toast = useToast();

  const sortStreamers = (streamersToSort: Streamer[], type: string) => {
    return [...streamersToSort].sort((a, b) => {
      switch (type) {
        case 'relevance':
          const aAvg = ((a.relevanceScore || 0) + (a.aiScore || 0)) / 2;
          const bAvg = ((b.relevanceScore || 0) + (b.aiScore || 0)) / 2;
          return bAvg - aAvg;
        case 'brandFit':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'reach':
          return (b.aiScore || 0) - (a.aiScore || 0);
        case 'followers':
          return (b.followers || 0) - (a.followers || 0);
        default:
          return 0;
      }
    });
  };

  const setSortTypeAndSort = (newSortType: string) => {
    setSortType(newSortType);
    setStreamers(prev => sortStreamers(prev, newSortType));
  };

  const loadStreamers = async (companyProfile: CompanyProfile | null) => {
    if (!companyProfile) return;
    
    try {
      setLoading(true);
      const streamersSnapshot = await getDocs(collection(db, 'analysedStreamers'));
      const streamersData = streamersSnapshot.docs
        .filter(doc => !doc.data()._isPlaceholder)
        .map(doc => ({
          ...doc.data() as Streamer,
          id: doc.id
        }));

      if (streamersData.length === 0) {
        setStreamers([]);
        return;
      }

      const batch = writeBatch(db);
      const updatedStreamers = streamersData.map(streamer => {
        // Always calculate fresh scores
        const aiScore = calculateAIScore(streamer);
        const relevanceScore = calculateRelevanceScore(streamer, companyProfile);
        const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(streamer, companyProfile);

        // Update main document
        const streamerRef = doc(db, 'analysedStreamers', streamer.id);
        const updates = {
          aiScore,
          relevanceScore,
          aiSummary,
          aiRecommendation,
          updatedAt: new Date()
        };
        batch.update(streamerRef, updates);

        // Return updated streamer
        return {
          ...streamer,
          ...updates
        };
      });

      // Commit updates
      await batch.commit();
      console.log('Updated streamers:', updatedStreamers);

      // Set sorted streamers
      const sortedStreamers = sortStreamers(updatedStreamers, sortType);
      setStreamers(sortedStreamers);
    } catch (error) {
      console.error('Error loading streamers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load streamers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async (streamerId: string, companyProfile: CompanyProfile | null) => {
    if (!companyProfile) return;
    
    setRecomputingId(streamerId);
    try {
      const streamer = streamers.find(s => s.id === streamerId);
      if (!streamer) return;

      // Calculate fresh scores
      const aiScore = calculateAIScore(streamer);
      const relevanceScore = calculateRelevanceScore(streamer, companyProfile);
      const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(streamer, companyProfile);

      const updates = {
        aiScore,
        relevanceScore,
        aiSummary,
        aiRecommendation,
        updatedAt: new Date()
      };

      // Update in Firestore
      const batch = writeBatch(db);
      const streamerRef = doc(db, 'analysedStreamers', streamerId);
      batch.update(streamerRef, updates);
      await batch.commit();

      // Update local state
      setStreamers(prev => {
        const updated = prev.map(s => 
          s.id === streamerId 
            ? { ...s, ...updates }
            : s
        );
        return sortStreamers(updated, sortType);
      });

    } catch (error) {
      console.error('Error recomputing scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to recompute scores',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRecomputingId(null);
    }
  };

  return {
    streamers,
    loading,
    recomputingId,
    sortType,
    setSortType: setSortTypeAndSort,
    loadStreamers,
    handleRecompute
  };
}; 