// A template drawn at full size and scaled into its box: to the box's width (cards), or covering it (grid tiles)
import { useLayoutEffect, useRef, useState } from 'react';
import { paint, type Texts } from './paint';
import type { Template } from './templates';

export function Art({ t, v = 0, photo = '', texts, fit = 'width', className = '' }: { t: Template; v?: number; photo?: string; texts?: Texts; fit?: 'width' | 'cover'; className?: string }) {
  const box = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const words = JSON.stringify(texts || []);
  useLayoutEffect(() => { if (art.current) paint(art.current, t, v, photo, texts); }, [t, v, photo, words]);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, []);
  let s = 0, x = 0, y = 0;
  if (size?.w) {
    s = fit === 'width' ? size.w / t.w : Math.max(size.w / t.w, size.h / t.h);
    x = (size.w - t.w * s) / 2; y = fit === 'width' ? 0 : (size.h - t.h * s) / 2;
  }
  return (
    <div ref={box} aria-hidden="true" className={`relative overflow-hidden bg-[#c6bfaf] ${className}`} style={fit === 'width' ? { aspectRatio: `${t.w} / ${t.h}` } : undefined}>
      <div ref={art} className="social-art absolute top-0 left-0 origin-top-left"
        style={{ width: t.w, height: t.h, transform: `translate(${x}px, ${y}px) scale(${s})`, visibility: s ? 'visible' : 'hidden' }} />
    </div>
  );
}

// Markup 1080 px wide and as tall as its content (the top of the profile), scaled to the box's width
export function Wide({ html }: { html: string }) {
  const box = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ s: 0, h: 0 });
  useLayoutEffect(() => {
    const measure = () => { const w = box.current!.clientWidth, s = w / 1080; setFit({ s, h: art.current!.scrollHeight * s }); };
    art.current!.innerHTML = html;
    measure();
    // Its photos load after the first measure: watch the content as well as the box
    const ro = new ResizeObserver(measure);
    ro.observe(box.current!); ro.observe(art.current!);
    return () => ro.disconnect();
  }, [html]);
  return (
    <div ref={box} aria-hidden="true" className="relative overflow-hidden bg-white" style={{ height: fit.h }}>
      <div ref={art} className="social-art absolute top-0 left-0 origin-top-left" style={{ width: 1080, transform: `scale(${fit.s})`, visibility: fit.s ? 'visible' : 'hidden' }} />
    </div>
  );
}
