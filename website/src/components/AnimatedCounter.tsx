import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startRef = useRef<number>(0);
  const targetRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = value;
    const startValue = displayValue;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve: 1 - pow(1 - x, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={`animated-counter-value ${className}`}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};
