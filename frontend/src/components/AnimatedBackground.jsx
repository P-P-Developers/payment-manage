import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground
 * ─────────────────────────────────────────────
 * Ek reusable component jo 3D grid + sweeping
 * light animation render karta hai canvas pe.
 *
 * Usage (kisi bhi page mein):
 *
 *   import AnimatedBackground from '@/components/AnimatedBackground';
 *
 *   // Option 1: isDark manually pass karo
 *   <AnimatedBackground isDark={isDark} />
 *
 *   // Option 2: auto detect (Tailwind dark class se)
 *   <AnimatedBackground />
 *
 * Parent element mein `position: relative` ya
 * `relative` class honi chahiye, aur ek fixed
 * height/min-height honi chahiye.
 *
 * Props:
 *   isDark   (boolean)  — dark mode on/off. Default: auto-detect from <html class="dark">
 *   opacity  (number)   — canvas opacity override. Default: auto (0.55 light / 0.70 dark)
 *   speed    (number)   — sweep speed multiplier. Default: 1
 *   color    (string)   — 'indigo' | 'blue' | 'teal' | 'navy'. Default: 'navy'
 */

const PALETTES = {
    navy: {
        light: { grid: 'rgba(10,37,64,0.09)', sweep: 'rgba(10,37,64,0.35)', node: 'rgba(10,37,64,0.22)', activeNode: 'rgba(10,37,64,0.7)', sweepLine: 'rgba(10,37,64,{a})' },
        dark: { grid: 'rgba(99,102,241,0.14)', sweep: 'rgba(56,189,248,0.5)', node: 'rgba(56,189,248,0.35)', activeNode: 'rgba(56,189,248,0.9)', sweepLine: 'rgba(56,189,248,{a})' },
    },
    indigo: {
        light: { grid: 'rgba(79,70,229,0.1)', sweep: 'rgba(79,70,229,0.4)', node: 'rgba(79,70,229,0.22)', activeNode: 'rgba(79,70,229,0.75)', sweepLine: 'rgba(79,70,229,{a})' },
        dark: { grid: 'rgba(99,102,241,0.16)', sweep: 'rgba(99,102,241,0.55)', node: 'rgba(99,102,241,0.35)', activeNode: 'rgba(165,180,252,0.9)', sweepLine: 'rgba(165,180,252,{a})' },
    },
    blue: {
        light: { grid: 'rgba(29,78,216,0.09)', sweep: 'rgba(29,78,216,0.38)', node: 'rgba(29,78,216,0.2)', activeNode: 'rgba(29,78,216,0.72)', sweepLine: 'rgba(29,78,216,{a})' },
        dark: { grid: 'rgba(96,165,250,0.14)', sweep: 'rgba(96,165,250,0.52)', node: 'rgba(96,165,250,0.32)', activeNode: 'rgba(147,197,253,0.9)', sweepLine: 'rgba(147,197,253,{a})' },
    },
    teal: {
        light: { grid: 'rgba(13,148,136,0.09)', sweep: 'rgba(13,148,136,0.38)', node: 'rgba(13,148,136,0.2)', activeNode: 'rgba(13,148,136,0.72)', sweepLine: 'rgba(13,148,136,{a})' },
        dark: { grid: 'rgba(45,212,191,0.14)', sweep: 'rgba(45,212,191,0.52)', node: 'rgba(45,212,191,0.32)', activeNode: 'rgba(153,246,228,0.9)', sweepLine: 'rgba(153,246,228,{a})' },
    },
};

export default function AnimatedBackground({
    isDark: isDarkProp,
    opacity,
    speed = 1,
    color = 'navy',
}) {
    const canvasRef = useRef(null);

    // Auto-detect dark mode from <html class="dark"> if prop not passed
    const isDark = isDarkProp !== undefined
        ? isDarkProp
        : document.documentElement.classList.contains('dark');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf;
        let W = (canvas.width = canvas.offsetWidth);
        let H = (canvas.height = canvas.offsetHeight);

        const onResize = () => {
            W = canvas.width = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', onResize);

        // ── Camera / grid constants ──
        const FOV = 400;
        const Z_OFFSET = 600;
        const GRID_SZ = 750;
        const STEP = 70;
        const TILT = 0.32;
        const cosT = Math.cos(TILT);
        const sinT = Math.sin(TILT);

        let sweepZ = -GRID_SZ;
        let time = 0;
        const sweepSpeed = 3.2 * speed;

        // ── Palette ──
        const palette = (PALETTES[color] || PALETTES.navy)[isDark ? 'dark' : 'light'];
        const alpha = (tpl, a) => tpl.replace('{a}', a.toFixed(3));

        // ── Project 3D → 2D ──
        const project = (x, y, z) => {
            const ry = y * cosT - z * sinT;
            const rz = z * cosT + y * sinT + Z_OFFSET;
            const s = FOV / Math.max(8, rz);
            return {
                x: W / 2 + x * s,
                y: H / 2.35 + ry * s,
                s,
                op: Math.max(0, 1 - (rz - 150) / 950),
            };
        };

        // ── Wave Y ──
        const waveY = (x, z) =>
            Math.sin(x * 0.005 + time * 0.7) * 13 * Math.cos(z * 0.005 + time * 0.5);

        const render = () => {
            ctx.clearRect(0, 0, W, H);

            sweepZ += sweepSpeed;
            if (sweepZ > GRID_SZ) sweepZ = -GRID_SZ;

            // ── Z-lines (along X axis) ──
            for (let z = -GRID_SZ; z <= GRID_SZ; z += STEP) {
                const dist = Math.abs(z - sweepZ);
                const sf = Math.max(0, 1 - dist / 175);

                ctx.beginPath();
                let first = true;
                for (let x = -GRID_SZ; x <= GRID_SZ; x += 32) {
                    const p = project(x, waveY(x, z), z);
                    if (p.op > 0.04) {
                        first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
                        first = false;
                    }
                }
                ctx.lineWidth = sf > 0 ? 1.7 : 0.9;
                ctx.strokeStyle = sf > 0
                    ? alpha(palette.sweepLine, sf * 0.55 + 0.1)
                    : palette.grid;
                ctx.stroke();
            }

            // ── X-lines (along Z axis) ──
            for (let x = -GRID_SZ; x <= GRID_SZ; x += STEP) {
                ctx.beginPath();
                let first = true;
                for (let z = -GRID_SZ; z <= GRID_SZ; z += 32) {
                    const p = project(x, waveY(x, z), z);
                    if (p.op > 0.04) {
                        first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
                        first = false;
                    }
                }
                ctx.lineWidth = 0.85;
                ctx.strokeStyle = palette.grid;
                ctx.stroke();
            }

            // ── Intersection nodes ──
            for (let x = -GRID_SZ; x <= GRID_SZ; x += STEP) {
                for (let z = -GRID_SZ; z <= GRID_SZ; z += STEP) {
                    const p = project(x, waveY(x, z), z);
                    if (p.op < 0.08) continue;

                    const dist = Math.abs(z - sweepZ);
                    const sf = Math.max(0, 1 - dist / 140);
                    const r = Math.max(1.5, p.s * 0.95 * (sf > 0 ? 1.9 : 1));

                    // Glow halo
                    if (sf > 0.2) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, r * 3.8, 0, Math.PI * 2);
                        ctx.fillStyle = alpha(palette.sweepLine, sf * p.op * 0.3);
                        ctx.fill();
                    }

                    // Node dot
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = sf > 0.2 ? palette.activeNode : palette.node;
                    ctx.fill();
                }
            }

            time += 0.018;
            raf = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(raf);
        };
    }, [isDark, speed, color]); // re-init when these change

    const finalOpacity = opacity !== undefined
        ? opacity
        : isDark ? 0.70 : 0.55;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                display: 'block',
                opacity: finalOpacity,
                transition: 'opacity 0.4s ease',
            }}
        />
    );
}
