import { Box, Image, Text, Tag, Flex, Badge, Progress, VStack, HStack, useColorMode, Card, CardBody, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Wrap, WrapItem, Link, Button } from '@chakra-ui/react';
import { Social } from '@/types/streamer';
import { FiRefreshCw } from 'react-icons/fi';

export interface Sponsor {
  name: string;
  logo: string;
}

export interface Streamer {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  categories: string[];
  sponsors?: Array<{ name: string; logo: string }>;
  aiSummary?: string;
  aiScore?: number;
  aiRecommendation?: string;
  followers?: number;
  socials?: Array<{ link: string; website: string }>;
  updatedAt?: Date;
}

interface StreamerCardProps {
  streamer: {
    id: string;
    name: string;
    image: string;
    description?: string;
    tags?: string[];
    categories?: string[];
    sponsors?: Array<{ name: string; logo: string }>;
    aiSummary?: string;
    aiScore?: number;
    aiRecommendation?: string;
    followers?: number;
    socials?: Array<{ link: string; website: string }>;
  };
  relevanceScore?: number;
  onRecompute?: (id: string) => void;
  isRecomputing: boolean;
}

export default function StreamerCard({ streamer, relevanceScore, onRecompute, isRecomputing }: StreamerCardProps) {
  const { colorMode } = useColorMode();

  // Format numbers with commas
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  // Format score to one decimal place
  const formatScore = (score: number | undefined) => {
    if (score === undefined || score === null) return 'N/A';
    return score.toFixed(1);
  };

  // Calculate average score
  const calculateAverageScore = () => {
    if (!streamer.aiScore && !relevanceScore) return 'N/A';
    const avg = ((streamer.aiScore || 0) + (relevanceScore || 0)) / 2;
    return formatScore(avg);
  };

  return (
    <Card bg={colorMode === 'light' ? 'white' : 'gray.800'}>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Streamer Image */}
          <Box position="relative" width="100%" paddingBottom="100%" overflow="hidden" borderRadius="md">
            <Box position="absolute" top="0" left="0" width="100%" height="100%">
              <Image
                src={streamer.image || 'https://place-hold.it/800x800'}
                alt={streamer.name}
                objectFit="cover"
                width="100%"
                height="100%"
              />
              <Flex
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                p={2}
                bg={colorMode === 'light' ? 'blackAlpha.600' : 'blackAlpha.800'}
                alignItems="center"
                justifyContent="space-between"
              >
                <Text color="white" fontWeight="bold" fontSize="lg">
                  {streamer.name}
                </Text>
                <Badge colorScheme={getScoreColor(calculateAverageScore() === 'N/A' ? undefined : parseFloat(calculateAverageScore()))}>
                  {calculateAverageScore()}
                </Badge>
              </Flex>
            </Box>
          </Box>

          {/* Brand Fit Score */}
          <Box>
            <Text fontWeight="semibold" mb={1}>Brand Fit Score</Text>
            <Progress
              value={(relevanceScore || 0) * 10}
              colorScheme={getScoreColor(relevanceScore)}
              borderRadius="full"
              height="8px"
            />
            <Text fontSize="sm" textAlign="right" mt={1}>
              {formatScore(relevanceScore)}/10
            </Text>
          </Box>

          {/* Brand Fit Analysis */}
          {streamer.aiRecommendation && (
            <Box
              bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
              p={4}
              borderRadius="md"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight="medium" color={colorMode === 'light' ? 'blue.600' : 'blue.200'}>
                  Brand Fit Analysis
                </Text>
                {/* Temporarily disabled recompute button
                {onRecompute && (
                  <Button
                    size="sm"
                    leftIcon={<FiRefreshCw />}
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => onRecompute(streamer.id)}
                    isLoading={isRecomputing}
                  >
                    Recompute
                  </Button>
                )}
                */}
              </Flex>
              <Text fontSize="sm">
                {streamer.aiRecommendation}
              </Text>
            </Box>
          )}

          {/* Reach & Influence Score */}
          <Box>
            <Text fontWeight="semibold" mb={1}>Reach & Influence Score</Text>
            <Progress
              value={(streamer.aiScore || 0) * 10}
              colorScheme={getScoreColor(streamer.aiScore)}
              borderRadius="full"
              height="8px"
            />
            <Text fontSize="sm" textAlign="right" mt={1}>
              {formatScore(streamer.aiScore)}/10
            </Text>
          </Box>

          {/* Categories */}
          {streamer.categories && streamer.categories.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Categories</Text>
              <Wrap>
                {streamer.categories.map((category, index) => (
                  <WrapItem key={index}>
                    <Tag size="md" colorScheme="blue" borderRadius="full">
                      {category}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}

          {/* Stats */}
          <SimpleGrid columns={1} spacing={4} mb={4}>
            <Stat>
              <StatLabel>Followers</StatLabel>
              <StatNumber>{formatNumber(streamer.followers)}</StatNumber>
            </Stat>
          </SimpleGrid>

          {/* Tags */}
          {streamer.tags && streamer.tags.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Tags</Text>
              <Flex gap={2} flexWrap="wrap">
                {streamer.tags.map((tag) => (
                  <Tag
                    key={tag}
                    size="sm"
                    variant="subtle"
                    colorScheme="blue"
                    whiteSpace="normal"
                    height="auto"
                    py={1}
                  >
                    {tag}
                  </Tag>
                ))}
              </Flex>
            </Box>
          )}

          {/* Description */}
          {streamer.description && (
            <Text
              color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
              fontSize="sm"
              noOfLines={2}
            >
              {streamer.description}
            </Text>
          )}

          {/* Sponsors */}
          {streamer.sponsors && streamer.sponsors.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Current Sponsors</Text>
              <Wrap>
                {streamer.sponsors.map((sponsor, index) => (
                  <WrapItem key={index}>
                    <Tag size="md" colorScheme="green" borderRadius="full">
                      {sponsor.name}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}

          {/* Social Media */}
          {streamer.socials && streamer.socials.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Social Media</Text>
              <Wrap>
                {streamer.socials.map((social, index) => (
                  <WrapItem key={index}>
                    <Link href={social.link} isExternal>
                      <Tag size="sm" colorScheme="gray" borderRadius="full">
                        {social.website}
                      </Tag>
                    </Link>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

// Helper function to determine score color
function getScoreColor(score: number | undefined): string {
  if (score === undefined || score === null) return 'gray';
  if (score >= 8) return 'green';
  if (score >= 6) return 'blue';
  if (score >= 4) return 'yellow';
  return 'red';
} 