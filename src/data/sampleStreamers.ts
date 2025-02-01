import { Streamer } from '@/types/streamer';

export const sampleStreamers: Streamer[] = [
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
    socials: [
      { link: 'https://www.twitter.com/caedrel', website: 'Twitter' },
      { link: 'https://www.instagram.com/caedrel', website: 'Instagram' },
      { link: 'http://www.youtube.com/Caedrel', website: 'YouTube' },
      { link: 'https://www.discord.gg/caedrel', website: 'Discord' },
      { link: 'https://www.tiktok.com/@caedrel', website: 'TikTok' }
    ]
  },
  {
    id: 'creative-crafts',
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
    aiRecommendation: 'Great fit for craft supplies and eco-friendly brands. Strong tutorial content and dedicated following.',
    followers: 500000,
    socials: []
  },
  {
    id: 'fitlife',
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
    aiRecommendation: 'Excellent for health supplements and fitness equipment brands. Authentic approach resonates well with audience.',
    followers: 750000,
    socials: []
  }
]; 