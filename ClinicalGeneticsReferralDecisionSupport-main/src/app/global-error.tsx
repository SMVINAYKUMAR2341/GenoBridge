'use client'

export const dynamic = 'force-dynamic'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#021627', color: '#fff', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h2>GenoBridge System Notice</h2>
        <p style={{ color: '#8aaec3' }}>An unexpected system state was encountered.</p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#00D8C3',
            color: '#021627',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  )
}
