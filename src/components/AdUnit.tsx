'use client';

import React, { useEffect } from 'react';

interface AdUnitProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' },
}) => {
  const adRef = React.useRef<boolean>(false);
  const insRef = React.useRef<HTMLModElement>(null);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev || !slot || !insRef.current || adRef.current) {
      return;
    }

    const initAd = () => {
      if (adRef.current) return;
      
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = window.adsbygoogle || [];
          adsbygoogle.push({});
          adRef.current = true;
        }
      } catch (err) {
        console.error('AdSense initialization error:', err);
      }
    };

    // Usar ResizeObserver para garantir que o container tenha largura antes de inicializar
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          initAd();
          observer.disconnect();
        }
      }
    });

    observer.observe(insRef.current);

    return () => {
      observer.disconnect();
    };
  }, [slot]);

  // Em desenvolvimento, mostramos um placeholder visual
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className={`ad-container my-8 w-full overflow-hidden flex justify-center ${className}`}>
      {isDev || !slot ? (
        <div 
          className="w-full max-w-[728px] h-[90px] md:h-[250px] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-xl"
          style={{ minHeight: style.minHeight || '90px' }}
        >
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Google AdSense Placeholder</p>
            {slot ? (
              <p className="text-[8px] text-gray-300 mt-1">Slot: {slot}</p>
            ) : (
              <p className="text-[8px] text-gray-300 mt-1 italic">Nenhum slot configurado</p>
            )}
          </div>
        </div>
      ) : (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={style}
          data-ad-client="ca-pub-6348382549206741"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
};
