import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';

export interface SignatureCanvasRef {
  clearCanvas: () => void;
  getSignatureData: () => string | null;
  isEmpty: () => boolean;
  loadImage: (imageUrl: string) => Promise<void>;
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  disabled?: boolean;
  onSignatureChange?: (isEmpty: boolean) => void;
  onDrawEnd?: () => void;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(({
  width = 400,
  height = 120,
  backgroundColor = '#FFFFFF',
  strokeColor = '#000000',
  strokeWidth = 2,
  disabled = false,
  onSignatureChange,
  onDrawEnd,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasSignature(false);
          onSignatureChange?.(false);
        }
      }
    },
    getSignatureData: () => {
      if (canvasRef.current && hasSignature) {
        return canvasRef.current.toDataURL('image/png');
      }
      return null;
    },
    isEmpty: () => !hasSignature,
    loadImage: async (imageUrl: string) => {
      if (!canvasRef.current || !imageUrl) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        // Only set crossOrigin for non-blob URLs (blob URLs don't need it and don't have CORS issues)
        // For blob URLs (which start with 'blob:'), we don't set crossOrigin
        if (!imageUrl.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          // Clear canvas first
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Fill background
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Calculate scaling to fit image within canvas while maintaining aspect ratio
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          
          // Draw image
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setHasSignature(true);
          onSignatureChange?.(true);
          resolve();
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = imageUrl;
      });
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [width, height, backgroundColor, strokeColor, strokeWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;

    if (e.type === 'mousedown') {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      x = (mouseEvent.clientX - rect.left) * scaleX;
      y = (mouseEvent.clientY - rect.top) * scaleY;
    } else {
      const touchEvent = e as React.TouchEvent<HTMLCanvasElement>;
      x = (touchEvent.touches[0].clientX - rect.left) * scaleX;
      y = (touchEvent.touches[0].clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;

    if (e.type === 'mousemove') {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      x = (mouseEvent.clientX - rect.left) * scaleX;
      y = (mouseEvent.clientY - rect.top) * scaleY;
    } else {
      const touchEvent = e as React.TouchEvent<HTMLCanvasElement>;
      x = (touchEvent.touches[0].clientX - rect.left) * scaleX;
      y = (touchEvent.touches[0].clientY - rect.top) * scaleY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
    onSignatureChange?.(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasSignature) {
      onDrawEnd?.();
    }
    setIsDrawing(false);
  };

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
      <Box
        sx={{
          border: '1px solid #E7E9EB',
          borderRadius: '4px',
          backgroundColor: backgroundColor,
          cursor: disabled ? 'default' : 'crosshair',
          opacity: disabled ? 0.7 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            width: '100%',
            height: `${height}px`,
            touchAction: 'none',
          }}
        />
        {!hasSignature && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#757775',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            Signature drawing area
          </Box>
        )}
      </Box>
    </Box>
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
