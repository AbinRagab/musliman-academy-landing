import { ImageResponse } from 'next/og';

export const alt = 'Musliman Academy online Quran and Arabic classes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #06182d 0%, #12345a 65%, #b87333 100%)',
        }}
      >
        <div style={{ fontSize: 34, color: '#d8a36b', marginBottom: 24 }}>Musliman Academy</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>Every Learner Has a Way</div>
        <div style={{ fontSize: 34, marginTop: 28 }}>Online Quran, Arabic & Tajweed Classes</div>
      </div>
    ),
    size,
  );
}
