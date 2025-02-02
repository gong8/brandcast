import type { NextApiRequest, NextApiResponse } from 'next';
import { migrateGameAndSponsors } from '@/utils/migrations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await migrateGameAndSponsors();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Migration API error:', error);
    return res.status(500).json({ message: 'Migration failed', error });
  }
} 