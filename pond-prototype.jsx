/**
 * REFERENCE ONLY — do not import this file into the app.
 *
 * Animation sketch for the pond (session 2). Styling here is inline on
 * purpose so it cannot leak into the token system. Size = neglect
 * (days since acted_at), capped at 90 days / 1.2×. Max 40 fish.
 * prefers-reduced-motion: no drift, no bob.
 */
import { useEffect, useRef } from "react";

const MAX_FISH = 40;
const MAX_DAYS = 90;
const MAX_SCALE = 1.2;

export function PondPrototype({
  notes,
  reducedMotion,
}) {
  const layerRef = useRef(null);
  const nodesRef = useRef([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const sample = notes.slice(0, MAX_FISH);
    const now = Date.now();
    nodesRef.current = sample.map((note, index) => {
      const days = Math.min(
        MAX_DAYS,
        Math.max(0, (now - Date.parse(note.acted_at)) / 86_400_000),
      );
      const scale = 1 + (days / MAX_DAYS) * (MAX_SCALE - 1);
      const depth = index % 3;
      return {
        el: null,
        x: (index * 47) % 100,
        y: (index * 29) % 100,
        vx: depth === 0 ? 0.008 : depth === 1 ? 0.014 : 0.022,
        vy: depth === 0 ? 0.004 : depth === 1 ? 0.007 : 0.011,
        scale,
        opacity: depth === 0 ? 0.45 : depth === 1 ? 0.75 : 1,
        blur: depth === 0 ? 2 : depth === 1 ? 0.6 : 0,
        bob: 0,
      };
    });
  }, [notes]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const imgs = layer.querySelectorAll("[data-fish]");
    imgs.forEach((el, i) => {
      if (nodesRef.current[i]) nodesRef.current[i].el = el;
    });

    if (reducedMotion) {
      nodesRef.current.forEach((node) => {
        if (!node.el) return;
        node.el.style.transform = `translate3d(${node.x}%, ${node.y}%, 0) scale(${node.scale})`;
        node.el.style.opacity = String(node.opacity);
        node.el.style.filter = node.blur ? `blur(${node.blur}px)` : "none";
      });
      return;
    }

    const tick = () => {
      for (const node of nodesRef.current) {
        if (!node.el) continue;
        node.x += node.vx;
        node.y += node.vy;
        if (node.x > 92 || node.x < 2) node.vx *= -1;
        if (node.y > 88 || node.y < 4) node.vy *= -1;
        node.bob += 0.02;
        const y = node.y + Math.sin(node.bob) * 0.6;
        node.el.style.transform = `translate3d(${node.x}%, ${y}%, 0) scale(${node.scale})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [notes, reducedMotion]);

  return <div ref={layerRef} />;
}
