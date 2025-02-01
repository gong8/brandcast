import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { getIndustryKeywords } from './industry';

export const calculateAIScore = (streamer: Streamer): number => {
  // Base score starts at 5
  let score = 5;

  // Follower score (up to 3 points)
  if (streamer.followers) {
    score += Math.min(streamer.followers / 1000000, 3);
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

export const calculateRelevanceScore = (streamer: Streamer, company: CompanyProfile | null): number => {
  if (!company) {
    // Fallback scoring when no company profile exists
    return calculateFallbackScore(streamer);
  }

  let score = 5; // Base score

  // Topic/Industry match (up to 2 points)
  const industryKeywords = getIndustryKeywords(company.industry);
  const topicMatch = streamer.tags.some(tag => 
    industryKeywords.some(keyword => 
      tag.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  if (topicMatch) score += 2;

  // Audience age match (up to 1 point)
  const ageMatch = streamer.tags.some(tag =>
    tag.toLowerCase().includes(company.targetAudience.ageRange.toLowerCase())
  );
  if (ageMatch) score += 1;

  // Interest match (up to 1.5 points)
  const interestMatch = company.targetAudience.interests.some(interest =>
    streamer.tags.some(tag =>
      tag.toLowerCase().includes(interest.toLowerCase())
    )
  );
  if (interestMatch) score += 1.5;

  // Demographics match (up to 1.5 points)
  const demographicMatch = company.targetAudience.demographics.some(demographic =>
    streamer.tags.some(tag =>
      tag.toLowerCase().includes(demographic.toLowerCase())
    )
  );
  if (demographicMatch) score += 1.5;

  // Brand tone match (up to 1 point)
  if (company.adContent.tone) {
    const toneMatch = streamer.description.toLowerCase().includes(company.adContent.tone.toLowerCase());
    if (toneMatch) score += 1;
  }

  // Keywords match (up to 1.5 points)
  const keywordMatches = company.adContent.keywords.filter(keyword =>
    streamer.tags.some(tag =>
      tag.toLowerCase().includes(keyword.toLowerCase())
    )
  ).length;
  score += Math.min(keywordMatches * 0.5, 1.5);

  // Engagement bonus (up to 1 point)
  if (streamer.description.toLowerCase().includes('high')) score += 1;

  // Normalize score to 0-10 range and round to 1 decimal place
  return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
};

export const calculateFallbackScore = (streamer: Streamer): number => {
  let score = 5; // Base score

  // Engagement score (0-2)
  if (streamer.description.toLowerCase().includes('high')) score += 2;
  else if (streamer.description.toLowerCase().includes('medium')) score += 1;

  // Audience diversity (0-1)
  score += Math.min(streamer.tags.length * 0.25, 1);

  // Topic diversity (0-1)
  score += Math.min(streamer.tags.length * 0.25, 1);

  // Follower bonus (0-1)
  const followerCount = streamer.followers || 0;
  score += Math.min(followerCount / 1000000, 1);

  // Round to 1 decimal place
  return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
};

export const getScoreColor = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'gray';
  if (score >= 8) return 'green';
  if (score >= 6) return 'blue';
  if (score >= 4) return 'yellow';
  return 'red';
}; 