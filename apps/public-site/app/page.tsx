import LandingClient from './landing-client';
import Link from 'next/link';
export default function HomePage() { return <><LandingClient/><nav style={{padding:'24px',textAlign:'center'}} aria-label="Explore"><Link href="/en/programs">Explore all programs</Link> · <Link href="/en/teachers">Meet our teachers</Link></nav></>; }
