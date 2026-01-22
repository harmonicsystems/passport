import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

/**
 * Simple QR Code component
 * Uses a canvas-based approach for MVP
 * TODO: Replace with proper qrcode library for production
 */
export default function QRCode({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    // Dynamic import of qrcode library
    import('qrcode').then((QRCodeLib) => {
      QRCodeLib.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#2c2c2c',
          light: '#ffffff',
        },
      });
    }).catch((err) => {
      console.error('QR code generation failed:', err);
      // Fallback: show placeholder
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size / 2, size / 2);
      }
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: 'var(--radius-sm)',
      }}
    />
  );
}
