import { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Input, Button, useToast, Card, useColorMode, Flex, keyframes, Spinner } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { TwitchStreamer, Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { collection, doc, getDoc, setDoc, serverTimestamp, writeBatch, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateRelevanceScore, calculateAIScore } from '@/utils/scoring';
import { calculateAISummaryAndRecommendation } from '@/utils/recommendations';

const pulseKeyframe = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1); }
  100% { transform: scale(0.95); }
`;

const LoadingAnimation = () => {
  const { colorMode } = useColorMode();
  return (
    <VStack spacing={8} align="center" py={12}>
      <Box
        position="relative"
        width="200px"
        height="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          position="absolute"
          width="full"
          height="full"
          borderRadius="full"
          bg={colorMode === 'light' ? 'blue.100' : 'blue.900'}
          animation={`${pulseKeyframe} 2s ease-in-out infinite`}
        />
        <Box
          position="absolute"
          width="150px"
          height="150px"
          borderRadius="full"
          bg={colorMode === 'light' ? 'blue.200' : 'blue.800'}
          animation={`${pulseKeyframe} 2s ease-in-out infinite 0.2s`}
        />
        <Box
          position="absolute"
          width="100px"
          height="100px"
          borderRadius="full"
          bg={colorMode === 'light' ? 'blue.300' : 'blue.700'}
          animation={`${pulseKeyframe} 2s ease-in-out infinite 0.4s`}
        />
        <Spinner
          thickness="4px"
          speed="0.8s"
          color={colorMode === 'light' ? 'blue.500' : 'blue.200'}
          size="xl"
        />
      </Box>
      <VStack spacing={2}>
        <Text
          fontSize="xl"
          fontWeight="semibold"
          color={colorMode === 'light' ? 'gray.700' : 'gray.100'}
        >
          Evaluating Streamer
        </Text>
        <Text
          color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
          textAlign="center"
        >
          Analyzing content, engagement, and brand potential...
        </Text>
      </VStack>
    </VStack>
  );
};

export default function Evaluate() {
  const [twitchUrl, setTwitchUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Streamer | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const companyDoc = await getDoc(doc(db, 'companyProfile', 'main'));
        if (companyDoc.exists()) {
          const profile = companyDoc.data() as CompanyProfile;
          setCompanyProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    }

    fetchCompanyProfile();
  }, []);

  const extractTwitchUsername = (input: string): string | null => {
    // Remove whitespace
    input = input.trim();

    // If it's a URL, extract username
    if (input.includes('twitch.tv/')) {
      try {
        const urlObj = new URL(input);
        return urlObj.pathname.split('/')[1];
      } catch {
        // If URL parsing fails, try to extract username directly
        const match = input.match(/twitch\.tv\/([^\/\s]+)/);
        return match ? match[1] : null;
      }
    }

    // If it's just a username (no URL), return as is if valid
    if (/^[a-zA-Z0-9_]{4,25}$/.test(input)) {
      return input;
    }

    return null;
  };

  const processWithClaude = async (twitchData: TwitchStreamer): Promise<Streamer> => {
    try {
      const response = await fetch('/api/analyze-streamer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(twitchData),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze streamer data');
      }

      return await response.json();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to analyze streamer data');
    }
  };

  const checkCache = async (username: string): Promise<Streamer | null> => {
    try {
      const docRef = doc(db, 'analysedStreamers', username.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Streamer;
      }
      
      return null;
    } catch (error) {
      console.error('Cache check error:', error);
      return null;
    }
  };

  const handleEvaluate = async () => {
    try {
      setLoading(true);
      const username = extractTwitchUsername(twitchUrl);
      
      if (!username) {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid Twitch URL (e.g., https://twitch.tv/username)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Check cache first
      const cachedData = await checkCache(username);
      if (cachedData) {
        const relevanceScore = calculateRelevanceScore(cachedData, companyProfile);
        setEvaluation({ ...cachedData, relevanceScore });
        toast({
          title: 'Cached Result',
          description: 'Showing previously analysed data',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Fetch new data if not in cache
      const twitchResponse = await fetch(`/api/fetch-twitch-data?username=${username}`);
      if (!twitchResponse.ok) {
        throw new Error('Failed to fetch Twitch data');
      }
      
      const twitchData: TwitchStreamer = await twitchResponse.json();
      const processedData = await processWithClaude(twitchData);
      
      // Calculate all scores and analyses
      const relevanceScore = calculateRelevanceScore(processedData, companyProfile);
      const aiScore = calculateAIScore(processedData);
      const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(processedData, companyProfile);

      const evaluationWithScores = {
        ...processedData,
        relevanceScore,
        aiScore,
        aiSummary,
        aiRecommendation
      };
      
      // Save to Firestore with a batch write
      const batch = writeBatch(db);
      
      // Save complete streamer data
      const streamerRef = doc(db, 'analysedStreamers', username.toLowerCase());
      batch.set(streamerRef, {
        ...evaluationWithScores,
        analysedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        id: username.toLowerCase()
      });

      // Save brand fit score
      const scoreRef = doc(db, 'streamerScores', `${username.toLowerCase()}_main`);
      batch.set(scoreRef, {
        streamerId: username.toLowerCase(),
        companyId: 'main',
        relevanceScore,
        calculatedAt: Date.now()
      });

      // Commit both operations
      await batch.commit();
      
      setEvaluation(evaluationWithScores);
      
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to evaluate streamer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Evaluate Streamer</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Enter a Twitch URL to analyse the streamer's potential
          </Text>
        </Box>

        <Card p={6} bg={colorMode === 'light' ? 'white' : 'gray.800'}>
          <VStack spacing={4}>
            <Input
              placeholder="https://twitch.tv/username or username"
              value={twitchUrl}
              onChange={(e) => setTwitchUrl(e.target.value)}
              size="lg"
              bg={colorMode === 'light' ? 'white' : 'gray.700'}
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
              _hover={{
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300'
              }}
              _focus={{
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                boxShadow: `0 0 0 1px ${colorMode === 'light' ? 'blue.500' : 'blue.300'}`
              }}
            />
            <Button
              colorScheme={colorMode === 'light' ? 'blue' : 'gray'}
              onClick={handleEvaluate}
              isLoading={loading}
              loadingText="Evaluating..."
              width="full"
              size="lg"
              bg={colorMode === 'light' ? 'blue.500' : 'gray.700'}
              color={colorMode === 'light' ? 'white' : 'gray.100'}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                bg: colorMode === 'light' ? 'blue.600' : 'gray.600'
              }}
              _active={{
                bg: colorMode === 'light' ? 'blue.700' : 'gray.500'
              }}
              transition="all 0.2s"
            >
              Evaluate
            </Button>
          </VStack>
        </Card>

        {loading ? (
          <LoadingAnimation />
        ) : evaluation && (
          <Box>
            <Heading size="md" mb={4}>Evaluation Result</Heading>
            <StreamerCard 
              streamer={evaluation} 
              isRecomputing={false} 
              onRecompute={undefined}
              relevanceScore={evaluation.relevanceScore} 
            />
          </Box>
        )}
      </VStack>
    </Layout>
  );
} 