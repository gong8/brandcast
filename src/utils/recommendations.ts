import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';

export const calculateAISummaryAndRecommendation = (
  streamer: Streamer,
  company: CompanyProfile | null
): { aiSummary: string; aiRecommendation: string } => {
  // Format numbers for readability
  const followersM = (streamer.followers || 0) / 1000000;
  
  // Generate AI Summary
  const aiSummary = `${streamer.name} is a ${streamer.categories?.join(', ') || 'content'} creator with ${followersM.toFixed(1)}M followers.`;
  
  // Generate AI Recommendation based on company profile
  let aiRecommendation = '';
  
  if (!company) {
    // Generic recommendation if no company profile exists
    aiRecommendation = `${streamer.categories?.length ? streamer.categories.join(', ') + ' content creator' : 'Content creator'} `;
    if (streamer.followers && streamer.followers > 1000000) {
      aiRecommendation += 'with a large following. ';
    } else if (streamer.followers && streamer.followers > 100000) {
      aiRecommendation += 'with a solid following. ';
    }
    if (streamer.socials?.length) {
      aiRecommendation += `Strong social media presence across ${streamer.socials.length} platforms. `;
    }
    if (streamer.tags?.length) {
      aiRecommendation += `Focuses on ${streamer.tags.slice(0, 3).join(', ')}.`;
    }
  } else {
    // Company-specific recommendation
    const matchingInterests = company.targetAudience.interests.filter(interest =>
      streamer.tags?.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
    );

    const matchingDemographics = company.targetAudience.demographics.filter(demographic =>
      streamer.tags?.some(tag => tag.toLowerCase().includes(demographic.toLowerCase()))
    );

    const matchingKeywords = company.adContent.keywords.filter(keyword =>
      streamer.tags?.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())) ||
      streamer.description?.toLowerCase().includes(keyword.toLowerCase())
    );

    const industryMatch = streamer.categories?.some(category =>
      category.toLowerCase().includes(company.industry.toLowerCase())
    );

    // Start with company context
    aiRecommendation = `For ${company.name} (${company.industry}): `;

    // Audience and Demographics Analysis
    if (matchingInterests.length > 0) {
      aiRecommendation += `Strong audience alignment in ${matchingInterests.join(', ')}${matchingInterests.length > 1 ? ' areas' : ''}. `;
    }
    
    if (matchingDemographics.length > 0) {
      aiRecommendation += `Appeals to your target ${matchingDemographics.join(' and ')} demographic${matchingDemographics.length > 1 ? 's' : ''}. `;
    }

    // Age Range Relevance
    if (streamer.tags?.some(tag => tag.toLowerCase().includes(company.targetAudience.ageRange.toLowerCase()))) {
      aiRecommendation += `Content particularly resonates with ${company.targetAudience.ageRange} age group. `;
    }

    // Industry and Content Alignment
    if (industryMatch) {
      aiRecommendation += `Direct ${company.industry} industry alignment offers authentic brand integration opportunities. `;
    } else if (streamer.categories) {
      aiRecommendation += `While not directly in ${company.industry}, their ${streamer.categories.join('/')} content could provide fresh exposure. `;
    }

    // Ad Content and Tone Match
    if (streamer.description?.toLowerCase().includes(company.adContent.tone.toLowerCase())) {
      aiRecommendation += `Content style naturally matches your ${company.adContent.tone} brand tone. `;
    }
    if (matchingKeywords.length > 0) {
      aiRecommendation += `Aligns with your key themes: ${matchingKeywords.join(', ')}. `;
    }

    // Reach and Platform Strategy
    let platformStrategy = '';
    if (streamer.followers && streamer.followers > 1000000) {
      platformStrategy = 'Offers major brand exposure';
    } else if (streamer.followers && streamer.followers > 100000) {
      platformStrategy = 'Provides focused brand reach';
    } else {
      platformStrategy = 'Offers niche audience targeting';
    }

    if (streamer.socials?.length) {
      platformStrategy += ` across ${streamer.socials.length} platforms (${streamer.socials.map(s => s.website).join(', ')}). `;
    } else {
      platformStrategy += '. ';
    }
    aiRecommendation += platformStrategy;

    // Current Sponsorship Context
    if (streamer.sponsors && streamer.sponsors.length > 0) {
      aiRecommendation += `Current brand collaborations with ${streamer.sponsors.map(s => s.name).join(', ')} demonstrate sponsorship experience. `;
    }

    // Recommendation Summary
    aiRecommendation += `Overall: ${
      matchingInterests.length > 0 && industryMatch ? 'Highly recommended partnership opportunity' :
      matchingInterests.length > 0 ? 'Strong potential for audience alignment' :
      industryMatch ? 'Good fit for industry-specific campaigns' :
      'Consider for audience expansion'
    }.`;
  }

  return { aiSummary, aiRecommendation };
}; 