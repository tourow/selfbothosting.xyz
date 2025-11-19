"use client";

import { cn } from "../lib/utils";
import React, { ComponentPropsWithoutRef, useEffect, useRef, useCallback } from "react";

interface ParticlesProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  quantity?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const hexInt = parseInt(hex, 16);
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255];
}

type Circle = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
};

export const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 50,
  size = 0.8,
  refresh = false,
  color = "#D4BCD2",
  vx = 0,
  vy = 0,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const rafID = useRef<number | null>(null);
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Define helper functions first
  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const pSize = Math.floor(Math.random() * 1.5) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.15 + 0.02).toFixed(2));
    const dx = (Math.random() - 0.5) * 0.05;
    const dy = (Math.random() - 0.5) * 0.05;
    return { x, y, size: pSize, alpha, targetAlpha, dx, dy };
  };

  const rgb = hexToRgb(color);

  const drawCircle = useCallback((circle: Circle, update = false) => {
    if (!context.current) return;
    const { x, y, size, alpha } = circle;
    context.current.beginPath();
    context.current.arc(x, y, size, 0, Math.PI * 2);
    context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
    context.current.fill();
    if (!update) circles.current.push(circle);
  }, [rgb]);

  const clearContext = () => {
    if (!context.current) return;
    context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const drawParticles = useCallback(() => {
    clearContext();
    for (let i = 0; i < quantity; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  const resizeCanvas = useCallback(() => {
    if (!canvasContainerRef.current || !canvasRef.current || !context.current)
      return;

    canvasSize.current.w = canvasContainerRef.current.offsetWidth;
    canvasSize.current.h = canvasContainerRef.current.offsetHeight;

    canvasRef.current.width = canvasSize.current.w * dpr;
    canvasRef.current.height = canvasSize.current.h * dpr;
    canvasRef.current.style.width = `${canvasSize.current.w}px`;
    canvasRef.current.style.height = `${canvasSize.current.h}px`;

    context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

    circles.current = [];
    drawParticles();
  }, [drawParticles, dpr]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const animate = useCallback(() => {
    clearContext();
    circles.current.forEach((circle, i) => {
      const edge = [
        circle.x - circle.size,
        canvasSize.current.w - circle.x - circle.size,
        circle.y - circle.size,
        canvasSize.current.h - circle.y - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
      );

      if (remapClosestEdge > 1) {
        circle.alpha += 0.005;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }

      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    rafID.current = window.requestAnimationFrame(animate);
  }, [vx, vy]);

  const initCanvas = useCallback(() => {
    resizeCanvas();
    drawParticles();
  }, [resizeCanvas, drawParticles]);

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();

    const handleResize = () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        initCanvas();
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (rafID.current != null) window.cancelAnimationFrame(rafID.current);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [initCanvas, animate]);

  useEffect(() => {
    initCanvas();
  }, [refresh, initCanvas]);

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
      {...props}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};
