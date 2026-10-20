// Glass surfaces. Chromium gets liquid-glass-react's refraction as a backdrop layer; Safari, Firefox, and anyone
// who asks for less transparency or motion get the same layout with a blurred translucent tint (see .glass in styles.css).
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const LiquidGlass = lazy(() => import('liquid-glass-react'));

const media = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches;
export const reducedMotion = () => media('(prefers-reduced-motion: reduce)');
// Refraction needs an SVG filter on a backdrop-filter layer: only Chromium renders it.
export const canRefract = (() => {
  if (typeof navigator === 'undefined' || typeof CSS === 'undefined') return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands || [];
  const chromium = brands.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
  return chromium && CSS.supports('backdrop-filter', 'blur(1px)') && !media('(prefers-reduced-transparency: reduce)') && !reducedMotion();
})();

const still = { x: 0, y: 0 };

interface Props {
  children?: ReactNode; className?: string; style?: CSSProperties; radius?: number;
  // Highlight cards may follow the pointer a little; bars and dialogs stay still
  lively?: boolean; strength?: 'soft' | 'strong'; as?: 'div' | 'aside' | 'header' | 'nav' | 'section';
  [k: `aria-${string}`]: string | undefined;
}
export function Glass({ children, className = '', style, radius = 24, lively = false, strength = 'soft', as: Tag = 'div', ...aria }: Props) {
  const host = useRef<HTMLElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!canRefract || !host.current) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setSize(s => (s && Math.abs(s.w - w) < 1 && Math.abs(s.h - h) < 1 ? s : { w, h }));
    });
    ro.observe(host.current);
    return () => ro.disconnect();
  }, []);
  return (
    <Tag ref={host as never} className={`glass ${canRefract ? 'is-liquid' : ''} ${className}`} style={{ ...style, borderRadius: radius }} {...aria}>
      {canRefract && size && size.w > 0 && (
        <div className="glass-refraction" aria-hidden="true" style={{ borderRadius: radius }}>
          <Suspense fallback={null}>
            <LiquidGlass
              cornerRadius={radius} padding="0" mode="standard" elasticity={lively ? 0.08 : 0}
              displacementScale={strength === 'strong' ? 64 : 36} blurAmount={strength === 'strong' ? 0.1 : 0.06} saturation={150} aberrationIntensity={1.4}
              style={{ position: 'absolute', top: '50%', left: '50%' }}
              {...(lively ? {} : { globalMousePos: still, mouseOffset: still })}
            >
              <span style={{ display: 'block', width: size.w, height: size.h }} />
            </LiquidGlass>
          </Suspense>
        </div>
      )}
      <span className="glass-tint" aria-hidden="true" style={{ borderRadius: radius }} />
      <div className="glass-body">{children}</div>
    </Tag>
  );
}
