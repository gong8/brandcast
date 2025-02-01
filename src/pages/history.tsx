import { useEffect, useState } from 'react';
import { Box, VStack, Heading, Text, SimpleGrid, useColorMode, Spinner, Center } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { Streamer } from '@/types/streamer';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function History() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorMode } = useColorMode();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const q = query(
          collection(db, 'analyzedStreamers'),
          orderBy('analyzedAt', 'desc')
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
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Analysis History</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Previously analysed Twitch streamers
          </Text>
        </Box>

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
            {streamers.map((streamer) => (
              <StreamerCard 
                key={streamer.id} 
                streamer={streamer} 
                relevanceScore={streamer.relevanceScore}
                isRecomputing={false} 
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