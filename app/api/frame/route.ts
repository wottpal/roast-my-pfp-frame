import { getFrameValidatedMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_RESPONSE = `
<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_URL}/frame-roast-bg.png" />
    <meta property="fc:frame:button:1" content="Roast my PFP" />
    <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_URL}/api/frame" />
</head></html>
`;

export async function POST(req: NextRequest): Promise<Response> {
  let fid: number;
  let castHash: string;
  try {
    const body: { trustedData?: { messageBytes?: string } } = await req.json();
    const message = await getFrameValidatedMessage(body);
    if (!message?.data?.fid) throw new Error('No fid');
    fid = message?.data?.fid;
    if (!message?.data?.frameActionBody?.castId?.hash) throw new Error('No cast hash');
    castHash = message?.data?.frameActionBody?.castId?.hash as any as string;
  } catch (err) {
    console.error(err);
    return new NextResponse(FALLBACK_RESPONSE);
  }

  // Get users that recasted this frame
  console.log(
    'Fetching:',
    `https://api.neynar.com/v2/farcaster/cast?type=hash&identifier=${castHash}`,
  );
  const neynarResponse = await fetch(
    `https://api.neynar.com/v2/farcaster/cast?type=hash&identifier=${castHash}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        api_key: 'process.env.NEYNAR_API_KEY',
      },
    },
  );

  const neynarResponseJson = await neynarResponse.json();
  console.log('Neynar response:', neynarResponseJson);
  const recasts = neynarResponseJson?.cast?.reactions?.recasts;
  if (!recasts?.length) return new NextResponse(FALLBACK_RESPONSE);
  const hasRecasted = recasts.some((recast: any) => recast?.fid === fid);
  if (!hasRecasted) return new NextResponse(FALLBACK_RESPONSE);

  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_URL}/api/image/${fid}.png" />
    <meta property="fc:frame:button:1" content="Roast my PFP" />
    <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_URL}/api/frame" />
  </head></html>`);
}
