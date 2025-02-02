import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const ngrokResponse = await fetch(
      `https://9916-2a0c-5bc0-40-3e28-84c6-cd09-8fa0-be5e.ngrok-free.app/streamerSearch/${userId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
      }
    );

    if (!ngrokResponse.ok) {
      const errorText = await ngrokResponse.text();
      throw new Error(`Ngrok API error: ${ngrokResponse.status} ${errorText}`);
    }

    const data = await ngrokResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Streamer search error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch streamers'
    });
  }
} 