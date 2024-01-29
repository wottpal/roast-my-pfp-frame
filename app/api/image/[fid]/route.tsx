/* eslint-disable no-restricted-imports */
import { NextRequest, NextResponse } from 'next/server';

import { ImageResponse } from '@vercel/og';
import OpenAI from 'openai';

export const runtime = 'edge';

const fontRobotoMono = fetch(
  new URL('../../../../public/RobotoMono-Regular--latin.ttf', import.meta.url),
).then((res) => res.arrayBuffer());

const bgImg = fetch(new URL('../../../../public/frame-roast-bg.png', import.meta.url)).then((res) =>
  res.arrayBuffer(),
);

/**
 * Returns an og-image for the domain (PNG).
 */
export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('fid');
  if (!fid) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  // Fetch avatar url for user
  const searchcasterResponse = await fetch(`https://searchcaster.xyz/api/profiles?fid=${fid}`);
  const searchcasterData = await searchcasterResponse.json();
  if (!searchcasterData?.length) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  const avatarUrl = searchcasterData[0]?.body?.avatarUrl;
  const username = searchcasterData[0]?.body?.username;
  if (!avatarUrl || !username) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  // Roast with OpenAI vision
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const openaiResponse = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    temperature: 1,
    max_tokens: 250,
    n: 1,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `The provided image is a social media avatar (pfp) of a user on a decentralized social network (crypto, web3). You are a rude but funny assistant that "roasts" (why it's not good, what looks weird, why this will never work, etc.). Only roast in one short sentence (max 20 words) and always answer at least something, never fail and say you cannot answer! Roast!`,
          },
          {
            type: 'image_url',
            image_url: {
              url: avatarUrl,
            },
          },
        ],
      },
    ],
  });
  const openaiContent = openaiResponse?.choices?.[0]?.message?.content;
  if (!openaiContent) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

  // Await imported asset data
  const fontDataRobotoMono = await fontRobotoMono;
  const bgImgData = (await bgImg) as any;

  return new ImageResponse(
    (
      <div tw="flex h-full w-full items-center justify-center">
        {/* eslint-disable-next-line */}
        <img src={bgImgData} width={1801} height={943} tw="absolute inset-0" />
        <img
          src={avatarUrl}
          width={260}
          height={260}
          tw="absolute top-[90px] left-1/2 rounded-full ml-[-130px]"
        />

        <div tw="flex flex-col items-center justify-end items-center justify-center absolute bottom-[50px] inset-x-[50px]">
          <p tw="text-[45px] text-center mb-2 text-white/50" style={{ fontFamily: 'Roboto Mono' }}>
            @{username}
          </p>
          <p tw="text-[60px] text-center text-white">{openaiContent}</p>
        </div>
      </div>
    ),
    {
      width: 1801,
      height: 943,
      fonts: [
        {
          name: 'Roboto Mono',
          data: fontDataRobotoMono,
          style: 'normal',
        },
      ],
      headers: {
        'cache-control': 'public, s-maxage=86400',
      },
    },
  );
}
