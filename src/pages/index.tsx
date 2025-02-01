import { useEffect, useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Input, Text, VStack, useToast, Heading, Card, CardBody, Image, Center, useColorMode, SimpleGrid, Spinner, Select } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import StreamerCard, { Streamer } from '@/components/StreamerCard';
import { Social, TwitchStreamer } from '@/types/streamer';
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getAuthErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    default:
      return 'An error occurred. Please try again';
  }
};

// Function to transform Twitch data to our format
const transformTwitchData = (twitchData: any): Streamer => {
  // Extract categories from panel elements (you might want to customize this logic)
  const categories = ['Gaming', 'League of Legends'];
  
  // Extract tags from socials and other data
  const tags = [
    ...twitchData.socials.map((social: Social) => social.website),
    twitchData.countryCode || ''
  ].filter(Boolean);

  // Calculate AI score based on followers and views (example logic)
  const followerScore = Math.min(twitchData.followers / 100000, 5); // Max 5 points for followers
  const viewScore = Math.min(twitchData.views / 10000, 5); // Max 5 points for views
  const aiScore = ((followerScore + viewScore) / 2).toFixed(1);

  return {
    id: twitchData.name.toLowerCase(),
    name: twitchData.name,
    image: twitchData.panelImageURLs[0] || 'https://place-hold.it/800x400',
    description: twitchData.description,
    tags,
    categories,
    sponsors: [], // You could extract these from panel elements if needed
    aiSummary: `${twitchData.name} is a content creator with ${(twitchData.followers / 1000000).toFixed(1)}M followers and ${(twitchData.views / 1000).toFixed(1)}K views.`,
    aiScore: parseFloat(aiScore),
    aiRecommendation: `Popular streamer with strong social media presence across ${twitchData.socials.length} platforms. ${twitchData.countryCode ? `Based in ${twitchData.countryCode}.` : ''}`,
    followers: twitchData.followers,
    views: twitchData.views,
    socials: twitchData.socials
  };
};

// Example of transformed Twitch data
const sampleStreamers: Streamer[] = [
  {
    id: 'caedrel',
    name: 'Caedrel',
    image: 'https://panels.twitch.tv/panel-92038375-image-89a80ecc-8fd5-41b8-879a-7ec0c9fe41db',
    description: 'Professional League of Legends player turned content creator',
    tags: ['Twitter', 'Instagram', 'YouTube', 'Discord', 'TikTok', 'GB'],
    categories: ['Gaming', 'League of Legends'],
    sponsors: [
      { name: 'Displate', logo: '/sponsors/displate.png' },
      { name: 'DPM.LOL', logo: '/sponsors/dpm.png' }
    ],
    aiSummary: 'Caedrel is a content creator with 1.1M followers and 63.3K views.',
    aiScore: 8.5,
    aiRecommendation: 'Popular streamer with strong social media presence across 5 platforms. Based in GB.',
    followers: 1100000,
    views: 63314,
    socials: [
      { link: 'https://www.twitter.com/caedrel', website: 'Twitter' },
      { link: 'https://www.instagram.com/caedrel', website: 'Instagram' },
      { link: 'http://www.youtube.com/Caedrel', website: 'YouTube' },
      { link: 'https://www.discord.gg/caedrel', website: 'Discord' },
      { link: 'https://www.tiktok.com/@caedrel', website: 'TikTok' }
    ]
  },
  {
    id: '2',
    name: 'Creative Crafts',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    description: 'DIY and crafting content creator focusing on sustainable materials and innovative designs.',
    tags: ['DIY', 'Crafts', 'Sustainable', 'Art'],
    categories: ['Creative', 'Lifestyle'],
    sponsors: [
      { name: 'ArtSupply', logo: '/sponsors/artsupply.png' },
      { name: 'EcoMaterials', logo: '/sponsors/eco.png' }
    ],
    aiSummary: 'Unique niche creator with highly engaged craft community.',
    aiScore: 7.9,
    aiRecommendation: 'Great fit for craft supplies and eco-friendly brands. Strong tutorial content and dedicated following.'
  },
  {
    id: '3',
    name: 'FitLife Journey',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    description: 'Fitness and wellness streamer focusing on holistic health approaches and workout routines.',
    tags: ['Fitness', 'Wellness', 'Health', 'Lifestyle'],
    categories: ['Health', 'Fitness'],
    sponsors: [
      { name: 'NutriBlend', logo: '/sponsors/nutriblend.png' },
      { name: 'FitGear', logo: '/sponsors/fitgear.png' }
    ],
    aiSummary: 'Consistent health and wellness content creator with growing audience.',
    aiScore: 8.2,
    aiRecommendation: 'Excellent for health supplements and fitness equipment brands. Authentic approach resonates well with audience.'
  }
].sort((a, b) => b.aiScore - a.aiScore); // Sort by AI score

interface CompanyProfile {
  name: string;
  description: string;
  industry: string;
  targetAudience: {
    ageRange: string;
    interests: string[];
    demographics: string[];
  };
  adContent: {
    description: string;
    tone: string;
    keywords: string[];
  };
}

interface CachedScore {
  streamerId: string;
  relevanceScore: number;
  companyId: string;
  calculatedAt: number;
}

const calculateAIScore = (streamer: Streamer): number => {
  // Base score starts at 5
  let score = 5;

  // Follower score (up to 2 points)
  if (streamer.followers) {
    score += Math.min(streamer.followers / 1000000, 2);
  }

  // View score (up to 1 point)
  if (streamer.views) {
    score += Math.min(streamer.views / 1000000, 1);
  }

  // Content diversity score (up to 1 point)
  if (streamer.tags) {
    score += Math.min(streamer.tags.length * 0.2, 1);
  }

  // Social media presence (up to 1 point)
  if (streamer.socials) {
    score += Math.min(streamer.socials.length * 0.2, 1);
  }

  return Math.min(Math.round(score * 10) / 10, 10);
};

const calculateAISummaryAndRecommendation = (streamer: Streamer): { aiSummary: string; aiRecommendation: string } => {
  // Format numbers for readability
  const followersM = (streamer.followers || 0) / 1000000;
  const viewsK = (streamer.views || 0) / 1000;
  
  // Generate AI Summary
  const aiSummary = `${streamer.name} is a content creator with ${followersM.toFixed(1)}M followers and ${viewsK.toFixed(1)}K views.`;
  
  // Generate AI Recommendation
  let aiRecommendation = `${streamer.categories?.length ? streamer.categories.join(', ') + ' content creator' : 'Content creator'} `;
  
  // Add engagement info
  if (streamer.followers && streamer.followers > 1000000) {
    aiRecommendation += 'with a large following. ';
  } else if (streamer.followers && streamer.followers > 100000) {
    aiRecommendation += 'with a solid following. ';
  } else {
    aiRecommendation += 'with growing audience. ';
  }

  // Add social media presence
  if (streamer.socials?.length) {
    aiRecommendation += `Strong social media presence across ${streamer.socials.length} platforms. `;
  }

  // Add content focus
  if (streamer.tags?.length) {
    aiRecommendation += `Focuses on ${streamer.tags.slice(0, 3).join(', ')}.`;
  }

  return { aiSummary, aiRecommendation };
};

export default function Home() {
  const [streamers, setStreamers] = useState<Array<Streamer & { relevanceScore?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { user, signup, login } = useAuth();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  const logoSrc = colorMode === 'light' ? '/images/logo.png' : '/images/logo-dark.png';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      toast({
        title: 'Error',
        description: getAuthErrorMessage(errorCode),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load company profile
      const companyDoc = await getDoc(doc(db, 'companyProfile', 'main'));
      const companyData = companyDoc.exists() ? companyDoc.data() as CompanyProfile : null;
      setCompanyProfile(companyData);

      // Load streamers
      const streamersSnapshot = await getDocs(collection(db, 'analyzedStreamers'));
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
          const { aiSummary, aiRecommendation } = calculateAISummaryAndRecommendation(data);
          updatedData.aiSummary = aiSummary;
          updatedData.aiRecommendation = aiRecommendation;
          needsUpdate = true;
        }

        // Update document if needed
        if (needsUpdate) {
          needsBatchCommit = true;
          const streamerRef = doc(db, 'analyzedStreamers', docId);
          batch.set(streamerRef, updatedData, { merge: true });
          
          // Add to history
          const historyRef = doc(db, 'history', docId);
          batch.set(historyRef, {
            ...updatedData,
            analyzedAt: Date.now()
          }, { merge: true });
        }

        return {
          ...updatedData,
          id: docId
        };
      }) as Streamer[];

      // Commit the batch if we have any operations
      if (needsBatchCommit) {
        try {
          await batch.commit();
        } catch (error) {
          console.error('Error saving updates:', error);
        }
      }

      // Try to get cached scores first
      const cachedScores = await getCachedScores(streamersData.map(s => s.id));
      
      // Calculate scores only for streamers without valid cached scores
      const streamersWithScores = await calculateMissingScores(streamersData, cachedScores, companyData);

      // Sort streamers
      const sortedStreamers = sortStreamers(streamersWithScores, sortBy);
      setStreamers(sortedStreamers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCachedScores = async (streamerIds: string[]): Promise<{ [key: string]: number }> => {
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

  const calculateMissingScores = async (
    streamers: Streamer[],
    cachedScores: { [key: string]: number },
    companyData: CompanyProfile | null
  ): Promise<Array<Streamer & { relevanceScore?: number }>> => {
    const batch = writeBatch(db);
    const updatedStreamers = streamers.map(streamer => {
      let relevanceScore: number;

      if (cachedScores[streamer.id] !== undefined) {
        // Use cached score if available
        relevanceScore = cachedScores[streamer.id];
      } else {
        // Calculate new score
        relevanceScore = calculateRelevanceScore(streamer, companyData);
        
        // Cache the new score
        const scoreDoc = doc(db, 'streamerScores', `${streamer.id}_main`);
        batch.set(scoreDoc, {
          streamerId: streamer.id,
          companyId: 'main',
          relevanceScore,
          calculatedAt: Date.now()
        });

        // Add to history
        const historyRef = doc(db, 'history', streamer.id);
        batch.set(historyRef, {
          ...streamer,
          relevanceScore,
          analyzedAt: Date.now()
        }, { merge: true });
      }

      return {
        ...streamer,
        relevanceScore
      };
    });

    // Commit all new scores and history entries in a single batch
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error saving scores and history:', error);
    }

    return updatedStreamers;
  };

  const calculateRelevanceScore = (streamer: Streamer, company: CompanyProfile | null): number => {
    if (!company) {
      // Fallback scoring when no company profile exists
      return calculateFallbackScore(streamer);
    }

    let score = 5; // Base score

    // Topic/Industry match
    const industryKeywords = getIndustryKeywords(company.industry);
    const topicMatch = streamer.tags.some(tag => 
      industryKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    if (topicMatch) score += 2;

    // Audience age match
    const ageMatch = streamer.tags.some(tag =>
      tag.toLowerCase().includes(company.targetAudience.ageRange.toLowerCase())
    );
    if (ageMatch) score += 1;

    // Interest match
    const interestMatch = company.targetAudience.interests.some(interest =>
      streamer.tags.some(tag =>
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    if (interestMatch) score += 1.5;

    // Demographics match
    const demographicMatch = company.targetAudience.demographics.some(demographic =>
      streamer.tags.some(tag =>
        tag.toLowerCase().includes(demographic.toLowerCase())
      )
    );
    if (demographicMatch) score += 1.5;

    // Brand tone match
    if (company.adContent.tone) {
      const toneMatch = streamer.description.toLowerCase().includes(company.adContent.tone.toLowerCase());
      if (toneMatch) score += 1;
    }

    // Keywords match
    const keywordMatches = company.adContent.keywords.filter(keyword =>
      streamer.tags.some(tag =>
        tag.toLowerCase().includes(keyword.toLowerCase())
      )
    ).length;
    score += keywordMatches * 0.5;

    // Engagement bonus
    if (streamer.description.toLowerCase().includes('high')) score += 1;

    // Normalize score to 0-10 range and round to 1 decimal place
    return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
  };

  const calculateFallbackScore = (streamer: Streamer): number => {
    let score = 5; // Base score

    // Engagement score (0-2)
    if (streamer.description.toLowerCase().includes('high')) score += 2;
    else if (streamer.description.toLowerCase().includes('medium')) score += 1;

    // Audience diversity (0-1)
    score += Math.min(streamer.tags.length * 0.25, 1);

    // Topic diversity (0-1)
    score += Math.min(streamer.tags.length * 0.25, 1);

    // Follower bonus (0-0.5)
    const followerCount = streamer.followers || 0;
    score += Math.min(followerCount / 1000000, 0.5);

    // View bonus (0-0.5)
    const viewCount = streamer.views || 0;
    score += Math.min(viewCount / 10000000, 0.5);

    // Round to 1 decimal place
    return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
  };

  const getIndustryKeywords = (industry: string): string[] => {
    const industryMap: { [key: string]: string[] } = {
      gaming: ['game', 'gaming', 'esports', 'streamer', 'player'],
      technology: ['tech', 'technology', 'software', 'hardware', 'digital'],
      fashion: ['fashion', 'style', 'clothing', 'beauty', 'lifestyle'],
      food: ['food', 'cooking', 'restaurant', 'beverage', 'cuisine'],
      entertainment: ['entertainment', 'media', 'film', 'music', 'show'],
      sports: ['sports', 'athlete', 'fitness', 'workout', 'competition'],
      other: []
    };
    return industryMap[industry] || [];
  };

  const sortStreamers = (streamersToSort: Array<Streamer & { relevanceScore?: number }>, sortType: string) => {
    return [...streamersToSort].sort((a, b) => {
      switch (sortType) {
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'followers':
          return (b.followers || 0) - (a.followers || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    setStreamers(sortStreamers(streamers, sortBy));
  }, [sortBy]);

  if (!user) {
    return (
      <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'} py={10}>
        <Container maxW="md">
          <Center mb={8}>
            <Box width="240px">
              <Image
                src={logoSrc}
                alt="Brandcast Logo"
                width="100%"
                height="auto"
                objectFit="contain"
              />
            </Box>
          </Center>
          <Card>
            <CardBody>
              <VStack as="form" spacing={6} onSubmit={handleAuth}>
                <Box textAlign="center">
                  <Heading size="lg" mb={2}>{isLogin ? 'Welcome back' : 'Create account'}</Heading>
                  <Text color="gray.600">
                    {isLogin ? 'Sign in to continue to Brandcast' : 'Sign up for a new account'}
                  </Text>
                </Box>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    bg="white"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    size="lg"
                    bg="white"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  fontSize="md"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>

                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  color="blue.500"
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Dashboard</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Discover and analyze Twitch streamers for your brand
          </Text>
        </Box>

        <Box>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            maxW="200px"
            mb={4}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="followers">Sort by Followers</option>
            <option value="views">Sort by Views</option>
          </Select>
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
              />
            ))}
          </SimpleGrid>
        ) : (
          <Center py={12}>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
              No streamers analyzed yet. Try evaluating some streamers first!
            </Text>
          </Center>
        )}
      </VStack>
    </Layout>
  );
}
