import { useEffect, useRef, useState } from 'react';

/** A small intersection-based reveal that keeps content readable without motion. */
export function Reveal({ as = 'div', className = '', delay = 0, children, ...props }) {
  const elementRef = useRef(null);
  const Component = as;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      element.classList.add('reveal-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('reveal-visible');
        observer.disconnect();
      }
    }, { threshold: 0.01, rootMargin: '0px 0px -12px 0px' });

    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('reveal-pending');
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return <Component ref={elementRef} className={`reveal ${className}`.trim()} {...props}>{children}</Component>;
}

/** Animates a static, supplied figure once on entry; the final value is unchanged. */
export function CountUp({ value, className = '' }) {
  const elementRef = useRef(null);
  const [display, setDisplay] = useState(null);
  const source = String(value);
  const numericValue = Number(source.replaceAll(',', ''));
  const decimals = source.includes('.') ? source.split('.')[1].length : 0;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !Number.isFinite(numericValue) || !('IntersectionObserver' in window)) return undefined;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    let frame = 0;
    let startedAt;
    const duration = 720;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const animate = (now) => {
        startedAt ??= now;
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = numericValue * eased;
        setDisplay(new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(progress === 1 ? numericValue : current));
        if (progress < 1) frame = window.requestAnimationFrame(animate);
      };
      frame = window.requestAnimationFrame(animate);
    }, { threshold: 0.35 });

    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [decimals, numericValue]);

  return <span ref={elementRef} className={className} aria-hidden="true">{display ?? source}</span>;
}

