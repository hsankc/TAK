'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const W = 480;
const H = 320;
const PLANE_X = 90;
const PLANE_W = 48;
const PLANE_H = 24;
const GRAVITY = 0.38;
const FLAP = -7.2;
const GAP = 130;         // gap between top & bottom pillars
const PILLAR_W = 52;
const PILLAR_SPEED_INIT = 2.6;
const SPEED_INC = 0.0004; // per frame

type State = 'idle' | 'playing' | 'dead';

interface Pillar {
    x: number;
    topH: number; // height of top pillar
}

function createPillar(x: number): Pillar {
    const topH = 40 + Math.random() * (H - GAP - 80);
    return { x, topH };
}

/* ─── DRAW HELPERS ───────────────────────────────────────────── */
function drawSky(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#020817');
    grad.addColorStop(1, '#0a1628');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
}

function drawStars(ctx: CanvasRenderingContext2D, offset: number) {
    // deterministic but "random" stars using sine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5 + offset * 0.3) % W);
        const sy = (i * 53.7) % (H * 0.6);
        ctx.fillRect(sx, sy, i % 3 === 0 ? 1.5 : 1, i % 3 === 0 ? 1.5 : 1);
    }
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
    // rolling hills silhouette at bottom
    ctx.fillStyle = '#0f2027';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
        const y = H - 22 - Math.sin((x + offset * 0.5) * 0.025) * 10 - Math.sin((x + offset * 0.3) * 0.055) * 6;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
        const y = H - 10 - Math.sin((x + offset * 0.7) * 0.04) * 5;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
}

function drawPillar(ctx: CanvasRenderingContext2D, p: Pillar) {
    const botY = p.topH + GAP;
    const botH = H - botY - 20; // leave a tiny margin for ground

    // Glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    // Top pillar
    const gTop = ctx.createLinearGradient(p.x, 0, p.x + PILLAR_W, 0);
    gTop.addColorStop(0, '#0ea5e9');
    gTop.addColorStop(1, '#0369a1');
    ctx.fillStyle = gTop;
    ctx.beginPath();
    ctx.roundRect(p.x, 0, PILLAR_W, p.topH, [0, 0, 8, 8]);
    ctx.fill();

    // Neon edge
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 1, 0, PILLAR_W - 2, p.topH);

    // Cap
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(p.x - 4, p.topH - 10, PILLAR_W + 8, 10, 4);
    ctx.fill();

    // Bottom pillar
    const gBot = ctx.createLinearGradient(p.x, 0, p.x + PILLAR_W, 0);
    gBot.addColorStop(0, '#0ea5e9');
    gBot.addColorStop(1, '#0369a1');
    ctx.fillStyle = gBot;
    ctx.beginPath();
    ctx.roundRect(p.x, botY, PILLAR_W, botH, [8, 8, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.strokeRect(p.x + 1, botY, PILLAR_W - 2, botH);

    // Bottom cap
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(p.x - 4, botY, PILLAR_W + 8, 10, 4);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawPlane(ctx: CanvasRenderingContext2D, y: number, vy: number) {
    const angle = Math.max(-0.45, Math.min(0.55, vy * 0.055));
    ctx.save();
    ctx.translate(PLANE_X + PLANE_W / 2, y + PLANE_H / 2);
    ctx.rotate(angle);

    // Engine glow
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 18;

    // Fuselage
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(0, 0, PLANE_W / 2, PLANE_H / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(22, -3);
    ctx.lineTo(34, 0);
    ctx.lineTo(22, 3);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(2, 14);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();

    // Tail fin
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-20, -2);
    ctx.lineTo(-12, -2);
    ctx.lineTo(-12, -10);
    ctx.closePath();
    ctx.fill();

    // Engine flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(-26, 2, 6 + Math.random() * 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-26, 2, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, speed: number) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 120, 36, 8);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PUAN', 20, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(String(score).padStart(5, '0'), 20, 40);

    // Speed bar
    const speedFrac = Math.min((speed - PILLAR_SPEED_INIT) / 4, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(W - 130, 10, 120, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('HIZ', W - 120, 26);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(W - 120, 30, 100, 6, 3);
    ctx.fill();
    const hg = ctx.createLinearGradient(W - 120, 0, W - 20, 0);
    hg.addColorStop(0, '#22d3ee');
    hg.addColorStop(1, '#f97316');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.roundRect(W - 120, 30, 100 * speedFrac, 6, 3);
    ctx.fill();
}

/* ─── GAME PAGE ──────────────────────────────────────────────── */
export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<State>('idle');
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);

    const gameRef = useRef({
        state: 'idle' as State,
        planeY: H / 2 - PLANE_H / 2,
        vy: 0,
        pillars: [] as Pillar[],
        speed: PILLAR_SPEED_INIT,
        offset: 0,        // parallax offset
        score: 0,
        frame: 0,
        best: 0,
        raf: 0,
        flap: false,
    });

    const startGame = useCallback(() => {
        const g = gameRef.current;
        g.state = 'playing';
        g.planeY = H / 2 - PLANE_H / 2;
        g.vy = 0;
        g.pillars = [createPillar(W + 60), createPillar(W + 60 + W / 2 + 40)];
        g.speed = PILLAR_SPEED_INIT;
        g.offset = 0;
        g.score = 0;
        g.frame = 0;
        setGameState('playing');
        setScore(0);
    }, []);

    const flap = useCallback(() => {
        const g = gameRef.current;
        if (g.state === 'idle') { startGame(); return; }
        if (g.state === 'playing') { g.vy = FLAP; }
        if (g.state === 'dead') { startGame(); }
    }, [startGame]);

    // keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [flap]);

    // game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        // high-dpi
        const ratio = window.devicePixelRatio || 1;
        canvas.width = W * ratio;
        canvas.height = H * ratio;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(ratio, ratio);

        function loop() {
            const g = gameRef.current;

            // draw
            drawSky(ctx);
            drawStars(ctx, g.offset);

            if (g.state === 'playing' || g.state === 'dead') {
                // physics
                if (g.state === 'playing') {
                    g.vy += GRAVITY;
                    g.planeY += g.vy;
                    g.speed += SPEED_INC;
                    g.offset += g.speed;
                    g.frame++;

                    // score every frame
                    if (g.frame % 6 === 0) {
                        g.score++;
                        setScore(g.score);
                    }

                    // move pillars
                    for (const p of g.pillars) p.x -= g.speed;

                    // recycle pillar
                    const leftmost = g.pillars.reduce((a, b) => a.x < b.x ? a : b);
                    if (leftmost.x + PILLAR_W < -10) {
                        const rightmost = g.pillars.reduce((a, b) => a.x > b.x ? a : b);
                        Object.assign(leftmost, createPillar(rightmost.x + W / 2 + 40 + Math.random() * 40));
                    }

                    // collision: ceiling & ground
                    if (g.planeY < 0 || g.planeY + PLANE_H > H - 22) {
                        g.state = 'dead';
                        if (g.score > g.best) { g.best = g.score; setBest(g.score); }
                        setGameState('dead');
                    }

                    // collision: pillars
                    for (const p of g.pillars) {
                        if (
                            PLANE_X + PLANE_W - 8 > p.x + 4 &&
                            PLANE_X + 8 < p.x + PILLAR_W - 4 &&
                            (g.planeY + 4 < p.topH || g.planeY + PLANE_H - 4 > p.topH + GAP)
                        ) {
                            g.state = 'dead';
                            if (g.score > g.best) { g.best = g.score; setBest(g.score); }
                            setGameState('dead');
                        }
                    }
                }

                for (const p of g.pillars) drawPillar(ctx, p);
                drawGround(ctx, g.offset);
                drawPlane(ctx, g.planeY, g.vy);
                drawHUD(ctx, g.score, g.speed);
            } else {
                // idle
                // animate plane gently
                g.planeY = H / 2 - PLANE_H / 2 + Math.sin(Date.now() / 700) * 10;
                drawGround(ctx, g.offset);
                drawPlane(ctx, g.planeY, 0);
            }

            // overlay text
            if (g.state === 'idle') {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, W, H);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 28px system-ui';
                ctx.fillText('✈  GÖKYÜZÜ MACERASI', W / 2, H / 2 - 24);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '14px system-ui';
                ctx.fillText('SPACE · TIKla · DOKUN  →  uç!', W / 2, H / 2 + 8);
                ctx.fillStyle = '#475569';
                ctx.font = '11px system-ui';
                ctx.fillText('Engellere değme, ne kadar uzağa gidebilirsin?', W / 2, H / 2 + 32);
                ctx.textAlign = 'left';
            }

            if (g.state === 'dead') {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, 0, W, H);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 26px system-ui';
                ctx.fillText('💥 ÇAKTIN!', W / 2, H / 2 - 30);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 18px system-ui';
                ctx.fillText(`Puan: ${g.score}`, W / 2, H / 2 + 2);
                ctx.fillStyle = '#fbbf24';
                ctx.font = '14px system-ui';
                ctx.fillText(`En İyi: ${g.best}`, W / 2, H / 2 + 24);
                ctx.fillStyle = '#64748b';
                ctx.font = '12px system-ui';
                ctx.fillText('Tekrar oynamak için tıkla / SPACE', W / 2, H / 2 + 50);
                ctx.textAlign = 'left';
            }

            g.raf = requestAnimationFrame(loop);
        }

        loop();
        return () => cancelAnimationFrame(gameRef.current.raf);
    }, []);

    return (
        <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-4 relative">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f1b3a_0%,#020817_70%)]" />
            </div>

            {/* Back link */}
            <div className="relative z-10 w-full max-w-[480px] flex items-center gap-2 mb-4">
                <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-slate-500 text-xs font-mono">EN İYİ</span>
                    <span className="text-amber-400 font-bold font-mono text-sm">{String(best).padStart(5, '0')}</span>
                </div>
            </div>

            {/* Canvas */}
            <div
                className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_-20px_rgba(56,189,248,0.3)] cursor-pointer select-none"
                onClick={flap}
                onTouchStart={(e) => { e.preventDefault(); flap(); }}
                style={{ touchAction: 'none' }}
            >
                <canvas ref={canvasRef} />
            </div>

            {/* Instructions */}
            <p className="relative z-10 mt-5 text-slate-600 text-xs font-mono tracking-widest text-center">
                SPACE · TIKLA · DOKUN — UÇMAK İÇİN
            </p>
        </div>
    );
}
