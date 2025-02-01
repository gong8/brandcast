import { Box, Image, Text, Tag, Flex, Badge, Progress, VStack, HStack, useColorMode, Card, CardBody, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Wrap, WrapItem, Link } from '@chakra-ui/react';
import { Social } from '@/types/streamer';

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
  views?: number;
  socials?: Array<{ link: string; website: string }>;
}

interface StreamerCardProps {
  streamer: Streamer;
  relevanceScore?: number;
}

export default function StreamerCard({ streamer, relevanceScore }: StreamerCardProps) {
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

  return (
    <Card bg={colorMode === 'light' ? 'white' : 'gray.800'}>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Streamer Image */}
          <Box position="relative" height="200px" overflow="hidden" borderRadius="md">
            <Image
              src={streamer.image || 'https://place-hold.it/800x400'}
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
              <Badge colorScheme={getScoreColor(streamer.aiScore)}>
                {streamer.aiScore ? streamer.aiScore.toFixed(1) : 'N/A'}
              </Badge>
            </Flex>
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
          <SimpleGrid columns={2} spacing={4}>
            <Stat>
              <StatLabel>Followers</StatLabel>
              <StatNumber>{formatNumber(streamer.followers)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Views</StatLabel>
              <StatNumber>{formatNumber(streamer.views)}</StatNumber>
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

          {/* AI Summary */}
          {streamer.aiSummary && (
            <Box
              bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
              p={3}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                AI Recommendation
              </Text>
              <Text fontSize="sm" noOfLines={3}>
                {streamer.aiSummary}
              </Text>
            </Box>
          )}

          {/* AI Score - Always show and calculate if missing */}
          <Box>
            <Text fontWeight="semibold" mb={1}>AI Score</Text>
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

          {/* Brand Match Score - Only show if we have company data */}
          {relevanceScore !== undefined && relevanceScore !== null && (
            <Box>
              <Text fontWeight="semibold" mb={1}>Brand Match Score</Text>
              <Progress 
                value={relevanceScore * 10} 
                colorScheme={getScoreColor(relevanceScore)}
                borderRadius="full"
                height="8px"
              />
              <Text fontSize="sm" textAlign="right" mt={1}>
                {formatScore(relevanceScore)}/10
              </Text>
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