import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Roast my PFP'],
  image: 'frame-start.png',
  post_url: `${process.env.NEXT_PUBLIC_URL}/api/frame`,
});

export const metadata: Metadata = {
  title: 'Roast my PFP',
  description: 'Made by @dennis',
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL!),
  openGraph: {
    title: 'Roast my PFP',
    description: 'Made by @dennis',
    images: [`/frame-start.png`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Roast my PFP</h1>
    </>
  );
}
