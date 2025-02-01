import { useEffect, useState } from 'react';
import { Container, VStack, Heading, Text, SimpleGrid, useColorMode, Spinner, Center, Select, useToast } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { useStreamers } from '@/hooks/useStreamers';
import { CompanyProfile } from '@/types/company';
import { Streamer } from '@/types/streamer';
import { collection, doc, getDoc, getDocs, query, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateRelevanceScore, calculateAIScore } from '@/utils/scoring';
import { calculateAISummaryAndRecommendation } from '@/utils/recommendations';

export default function Home() {
  const { colorMode } = useColorMode();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const {
    streamers,
    loading,
    recomputingId,
    sortType,
    setSortType,
    loadStreamers,
    handleRecompute
  } = useStreamers();
  const toast = useToast();

  const checkAndUpdateMissingCalculations = async (profile: CompanyProfile) => {
    try {
      const streamersRef = collection(db, 'analyzedStreamers');
      const streamersSnapshot = await getDocs(query(streamersRef));
      let currentBatch = writeBatch(db);
      let updateCount = 0;
      let batchCount = 0;

      for (const streamerDoc of streamersSnapshot.docs) {
        try {
          const streamer = streamerDoc.data() as Streamer;
          let needsUpdate = false;
          const updates: Partial<Streamer> = {};

          if (streamer.aiScore === undefined || streamer.aiScore === null) {
            updates.aiScore = calculateAIScore(streamer);
            needsUpdate = true;
          }
          
          if (streamer.relevanceScore === undefined || streamer.relevanceScore === null) {
            updates.relevanceScore = calculateRelevanceScore(streamer, profile);
            needsUpdate = true;
          }
          
          if (!streamer.aiSummary || !streamer.aiRecommendation) {
            const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(streamer, profile);
            updates.aiSummary = aiSummary;
            updates.aiRecommendation = aiRecommendation;
            needsUpdate = true;
          }

          if (needsUpdate) {
            console.log(`Updating streamer ${streamerDoc.id} with:`, updates);
            
            currentBatch.update(doc(db, 'analyzedStreamers', streamerDoc.id), {
              ...updates,
              updatedAt: serverTimestamp()
            });

            updateCount++;
            batchCount++;

            // Commit batch when it reaches close to the limit (500)
            if (batchCount >= 400) {
              await currentBatch.commit();
              console.log(`Committed batch with ${batchCount} updates`);
              currentBatch = writeBatch(db);
              batchCount = 0;
              
              // Add a small delay between batches to prevent rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (streamerError) {
          console.error(`Error processing streamer ${streamerDoc.id}:`, streamerError);
          // Continue with next streamer instead of failing the entire batch
          continue;
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await currentBatch.commit();
        console.log(`Committed final batch with ${batchCount} updates`);
      }

      if (updateCount > 0) {
        toast({
          title: 'Database Update',
          description: `Successfully updated ${updateCount} streamers`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating missing calculations:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update some streamer calculations. Check console for details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Load company profile
        const companyDoc = await getDoc(doc(db, 'companyProfile', 'main'));
        if (companyDoc.exists()) {
          const profile = companyDoc.data() as CompanyProfile;
          setCompanyProfile(profile);
          // Check for missing calculations after loading company profile
          await checkAndUpdateMissingCalculations(profile);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    loadStreamers(companyProfile);
  }, [companyProfile]);

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <VStack align="stretch" spacing={2}>
            <Heading size="lg">Recommended For You</Heading>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
              Top streamers that match your brand
            </Text>
          </VStack>

          <Select 
            value={sortType} 
            onChange={(e) => setSortType(e.target.value)}
            maxW="250px"
            bg={colorMode === 'light' ? 'white' : 'gray.700'}
          >
            <option value="relevance">Sort by Overall Relevance</option>
            <option value="brandFit">Sort by Brand Fit Score</option>
            <option value="reach">Sort by Reach Score</option>
            <option value="followers">Sort by Followers</option>
          </Select>

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
              {streamers.slice(0, 3).map((streamer) => (
                <StreamerCard
                  key={streamer.id}
                  streamer={streamer}
                  isRecomputing={recomputingId === streamer.id}
                  onRecompute={() => handleRecompute(streamer.id, companyProfile)}
                  relevanceScore={streamer.relevanceScore}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center py={12}>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                No analyzed streamers yet. Go to the Evaluate page to analyze streamers!
              </Text>
            </Center>
          )}
        </VStack>
      </Container>
    </Layout>
  );
}
