import { useEffect, useState, useRef } from "react";

interface StatValueProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  durationMs?: number;
  id?: string;
}

// Module-level cache so switching tabs preserves the last computed value
// instead of re-rolling from 0 on every tab mount.
const prevValueCache = new Map<string, number>();

export function StatValue({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
  durationMs = 600,
  id,
}: StatValueProps) {
  // Guard against non-finite or missing numbers
  const isValidNumber = typeof value === "number" && Number.isFinite(value);

  // Derive cache key for this stat metric
  const cacheKey = id ?? `${prefix}_${suffix}_${decimals}`;

  // Start from cached value if available, otherwise from 0 on first appearance
  const initialValue = isValidNumber
    ? (prevValueCache.get(cacheKey) ?? 0)
    : 0;

  const [displayValue, setDisplayValue] = useState(initialValue);
  const startValueRef = useRef(initialValue);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isValidNumber) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || durationMs <= 0) {
      setDisplayValue(value);
      startValueRef.current = value;
      prevValueCache.set(cacheKey, value);
      return;
    }

    const startVal = startValueRef.current;
    const endVal = value;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      prevValueCache.set(cacheKey, endVal);
      return;
    }

    startTimeRef.current = null;

    // Exponential ease-out for luxurious odometer deceleration
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutExpo(progress);

      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
        startValueRef.current = endVal;
        prevValueCache.set(cacheKey, endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, durationMs, isValidNumber, cacheKey]);

  if (!isValidNumber) {
    return (
      <span className={`numeral ${className}`}>
        {prefix}—{suffix}
      </span>
    );
  }

  return (
    <span className={`numeral ${className}`}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
