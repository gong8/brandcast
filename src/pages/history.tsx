import { useEffect, useState } from 'react';
import { Box, VStack, Heading, Text, SimpleGrid, useColorMode, Spinner, Center, useToast, Select } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { Streamer } from '@/types/streamer';
import { collection, query, orderBy, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CompanyProfile } from '@/types/company';
import { calculateRelevanceScore, calculateAIScore } from '@/utils/scoring';
import { calculateAISummaryAndRecommendation } from '@/utils/recommendations';

export default function History() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputingId, setRecomputingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const { colorMode } = useColorMode();
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        // Load streamers
        const q = query(
          collection(db, 'analysedStreamers'),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const streamerData = querySnapshot.docs
          .filter(doc => !doc.data()._isPlaceholder)
          .map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              relevanceScore: data.relevanceScore,
              aiScore: data.aiScore
            } as Streamer;
          });
        
        setStreamers(streamerData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRecompute = async (streamerId: string) => {
    setRecomputingId(streamerId);
    try {
      const streamer = streamers.find(s => s.id === streamerId);
      if (!streamer) {
        throw new Error('Streamer not found');
      }

      // Load company profile when needed
      const companySnapshot = await getDoc(doc(db, 'companyProfile', 'main'));
      if (!companySnapshot.exists()) {
        throw new Error('Company profile not found');
      }
      const companyProfile = companySnapshot.data() as CompanyProfile;

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
      setStreamers(prev => 
        prev.map(s => 
          s.id === streamerId 
            ? { ...s, ...updates }
            : s
        )
      );

      toast({
        title: 'Success',
        description: 'Scores recomputed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error recomputing scores:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to recompute scores',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRecomputingId(null);
    }
  };

  const getSortedStreamers = () => {
    return [...streamers].sort((a, b) => {
      switch (sortBy) {
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

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Analysis History</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Previously analysed Twitch streamers
          </Text>
        </Box>

        {!loading && streamers.length > 0 && (
          <Box>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              maxW="300px"
              mb={4}
            >
              <option value="relevance">Sort by Overall Relevance</option>
              <option value="brandFit">Sort by Brand Fit Score</option>
              <option value="reach">Sort by Reach Score</option>
              <option value="followers">Sort by Followers</option>
            </Select>
          </Box>
        )}

        {loading ? (
          <Center py={12}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              color={colorMode === 'light' ? 'blue.500' : 'blue.200'}
              size="xl"
            />
          </Center>
        ) : streamers.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {getSortedStreamers().map((streamer) => (
              <StreamerCard 
                key={streamer.id} 
                streamer={streamer} 
                relevanceScore={streamer.relevanceScore}
                isRecomputing={recomputingId === streamer.id}
                onRecompute={() => handleRecompute(streamer.id)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Center py={12}>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
              No analysed streamers yet. Try evaluating some streamers first!
            </Text>
          </Center>
        )}
      </VStack>
    </Layout>
  );
} 