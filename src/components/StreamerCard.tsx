import { Box, Image, Text, Tag, Flex, Badge, Progress, VStack, HStack, useColorMode } from '@chakra-ui/react';

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
  sponsors: Sponsor[];
  aiSummary: string;
  aiScore: number;
  aiRecommendation: string;
  categories: string[];
}

interface StreamerCardProps {
  streamer: Streamer;
}

export default function StreamerCard({ streamer }: StreamerCardProps) {
  const { colorMode } = useColorMode();

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-4px)' }}
      shadow="md"
    >
      {/* Streamer Image */}
      <Box position="relative" height="200px">
        <Image
          src={streamer.image}
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
            {streamer.aiScore.toFixed(1)}
          </Badge>
        </Flex>
      </Box>

      <VStack p={4} align="stretch" spacing={3}>
        {/* Categories */}
        <HStack spacing={2}>
          {streamer.categories.map((category) => (
            <Badge key={category} colorScheme="purple">
              {category}
            </Badge>
          ))}
        </HStack>

        {/* Tags */}
        <Box>
          <HStack spacing={2} flexWrap="wrap" gap={2}>
            {streamer.tags.map((tag) => (
              <Tag
                key={tag}
                size="sm"
                variant="subtle"
                colorScheme="blue"
              >
                {tag}
              </Tag>
            ))}
          </HStack>
        </Box>

        {/* Description */}
        <Text
          color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
          fontSize="sm"
          noOfLines={2}
        >
          {streamer.description}
        </Text>

        {/* Sponsors */}
        <Box>
          <Text
            fontSize="sm"
            fontWeight="medium"
            mb={2}
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
          >
            Current Sponsors
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {streamer.sponsors.map((sponsor) => (
              <Box
                key={sponsor.name}
                borderWidth="1px"
                borderRadius="md"
                px={2}
                py={1}
                fontSize="xs"
              >
                {sponsor.name}
              </Box>
            ))}
          </HStack>
        </Box>

        {/* AI Summary */}
        <Box
          bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
          p={3}
          borderRadius="md"
        >
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            AI Recommendation
          </Text>
          <Text fontSize="sm" noOfLines={3}>
            {streamer.aiRecommendation}
          </Text>
        </Box>

        {/* Score Progress */}
        <Box>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="sm" fontWeight="medium">
              AI Score
            </Text>
            <Text fontSize="sm" fontWeight="bold">
              {streamer.aiScore.toFixed(1)}/10
            </Text>
          </Flex>
          <Progress
            value={streamer.aiScore * 10}
            colorScheme={getScoreColor(streamer.aiScore)}
            borderRadius="full"
          />
        </Box>
      </VStack>
    </Box>
  );
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'green';
  if (score >= 6) return 'blue';
  if (score >= 4) return 'yellow';
  return 'red';
} 