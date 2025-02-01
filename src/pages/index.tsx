import { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Input, Text, VStack, useToast, Heading, Card, CardBody, Image, Center, useColorMode, SimpleGrid } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import StreamerCard, { Streamer } from '@/components/StreamerCard';

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

// Sample data - replace with real data from your backend
const sampleStreamers: Streamer[] = [
  {
    id: '1',
    name: 'TechPro Gaming',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    description: 'Professional gamer specializing in FPS and strategy games. Known for detailed game analysis and competitive gameplay.',
    tags: ['FPS', 'Strategy', 'Competitive', 'Educational'],
    categories: ['Gaming', 'Esports'],
    sponsors: [
      { name: 'GameFuel', logo: '/sponsors/gamefuel.png' },
      { name: 'RTX', logo: '/sponsors/rtx.png' }
    ],
    aiSummary: 'High-engagement streamer with consistent schedule and professional setup.',
    aiScore: 8.7,
    aiRecommendation: 'Highly recommended for gaming brands targeting competitive players. Strong educational content and engaged community.'
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

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { user, signup, login } = useAuth();
  const toast = useToast();
  const { colorMode } = useColorMode();

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
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Welcome back!</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={8}>
            You are signed in as {user.email}
          </Text>
          
          <Heading size="md" mb={4}>Featured Streamers</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {sampleStreamers.map((streamer) => (
              <StreamerCard key={streamer.id} streamer={streamer} />
            ))}
          </SimpleGrid>
        </Box>
      </VStack>
    </Layout>
  );
}
