"use client";

import { memo, useEffect, useRef, useMemo } from "react";
import { cn } from "../../lib/utils";
import { useSpring, useTransform, motion } from "motion/react";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    borderWidth = 1,
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const boundsRef = useRef({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    });
    const debounceRef = useRef<number>(0);
    const lastAngleRef = useRef(0);

    const angle = useSpring(0, { stiffness: 120, damping: 40, mass: 1.2 });
    const opacity = useSpring(0, { stiffness: 150, damping: 35 });

    const transformedAngle = useTransform(angle, (value) => value);
    const transformedOpacity = useTransform(opacity, (value) => value);

    const normalizeAngle = (current: number, target: number) => {
      const diff = target - current;
      const normalizedDiff = ((diff + 180) % 360) - 180;
      return current + normalizedDiff;
    };

    const updateBounds = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      boundsRef.current = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + window.scrollX + rect.width * 0.5,
        centerY: rect.top + window.scrollY + rect.height * 0.5,
      };
    };

    useEffect(() => {
      if (disabled) return;

      let rafId: number;

      const handlePointerMove = (e: PointerEvent) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
          if (rafId) cancelAnimationFrame(rafId);

          rafId = requestAnimationFrame(() => {
            const bounds = boundsRef.current;
            const mx = e.clientX + window.scrollX;
            const my = e.clientY + window.scrollY;

            const distanceFromCenter = Math.hypot(
              mx - bounds.centerX,
              my - bounds.centerY
            );
            const inactiveRadius =
              0.5 * Math.min(bounds.width, bounds.height) * inactiveZone;

            if (distanceFromCenter < inactiveRadius) {
              opacity.set(0);
              return;
            }

            const withinProximity =
              mx > bounds.left - proximity &&
              mx < bounds.left + bounds.width + proximity &&
              my > bounds.top - proximity &&
              my < bounds.top + bounds.height + proximity;

            if (withinProximity) {
              opacity.set(1);
              const rawAngle =
                (180 * Math.atan2(my - bounds.centerY, mx - bounds.centerX)) /
                  Math.PI +
                90;

              const smoothAngle = normalizeAngle(
                lastAngleRef.current,
                rawAngle
              );
              lastAngleRef.current = smoothAngle;
              angle.set(smoothAngle);
            } else {
              opacity.set(0);
            }
          });
        }, 8);
      };

      const handleResize = () => updateBounds();
      const handleScroll = () => updateBounds();

      updateBounds();

      document.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });

      const resizeObserver = new ResizeObserver(updateBounds);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        document.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
      };
    }, [disabled, inactiveZone, proximity, angle, opacity]);

    const gradientConfig = useMemo(
      () => ({
        default: `radial-gradient(circle, #D4BCD2 10%, #D4BCD200 20%),
        radial-gradient(circle at 40% 40%, #D4BCD2 5%, #D4BCD200 15%),
        radial-gradient(circle at 60% 60%, #D4BCD2 10%, #D4BCD200 20%), 
        radial-gradient(circle at 40% 60%, #D4BCD2 10%, #D4BCD200 20%),
        repeating-conic-gradient(
          from 236.84deg at 50% 50%,
          #D4BCD2 0%,
          #D4BCD2 calc(25% / 5),
          #D4BCD2 calc(50% / 5), 
          #D4BCD2 calc(75% / 5),
          #D4BCD2 calc(100% / 5)
        )`,
        white: `repeating-conic-gradient(
        from 236.84deg at 50% 50%,
        var(--black),
        var(--black) calc(25% / 5)
      )`,
      }),
      []
    );

    const cssVariables = useMemo(
      () => ({
        "--blur": `${blur}px`,
        "--spread": spread,
        "--glowingeffect-border-width": `${borderWidth}px`,
        "--gradient": gradientConfig[variant],
      }),
      [blur, spread, borderWidth, gradientConfig, variant]
    );

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
        />
        <motion.div
          ref={containerRef}
          style={
            {
              ...cssVariables,
              "--start": transformedAngle,
              "--active": transformedOpacity,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)]",
            className,
            disabled && "!hidden"
          )}
        >
          <motion.div
            className={cn(
              "glow rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-75",
              "after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </motion.div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
