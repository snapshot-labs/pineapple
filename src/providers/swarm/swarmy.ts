import fetch from 'node-fetch';

type SwarmyResponse = {
  swarmReference: string;
  id: number;
};

const SWARMY_API_KEY = process.env.SWARMY_API_KEY;

export const provider = 'swarmy';

export function isConfigured(): boolean {
  return !!SWARMY_API_KEY;
}

export async function set(data: Buffer | object): Promise<{ cid: string; provider: string }> {
  if (data instanceof Buffer) {
    throw new Error('Swarmy only supports JSON data');
  }

  const response = await fetch(`https://api.swarmy.cloud/api/data/utf8?k=${SWARMY_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'filename.json',
      contentType: 'application/json',
      utf8: JSON.stringify(data)
    })
  });

  if (!response.ok) {
    throw new Error(`Swarm upload failed: ${response.statusText}`);
  }

  const json: SwarmyResponse = await response.json();

  return {
    cid: json.swarmReference,
    provider
  };
}
