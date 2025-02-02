import type { NextApiRequest, NextApiResponse } from 'next';
import { migrateDisplayNameToName } from '@/utils/migrations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await migrateDisplayNameToName();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({ error: 'Migration failed' });
  }
} 