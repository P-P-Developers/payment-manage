import { useEffect, useRef } from 'react';

export default function InteractiveBackground({ isDark = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Camera Settings
    const fov = 400;
    const cameraRotationX = 0.35; // Tilt angle
    const cosRotX = Math.cos(cameraRotationX);
    const sinRotX = Math.sin(cameraRotationX);
    const zOffset = 600; // Camera distance

    // Layer 1: technology grid parameters
    const gridSize = 800; // Grid bounding box size
    const gridStep = 80;  // Space between lines
    let sweepProgress = -gridSize; // Progress of the light sweep
    const sweepSpeed = 3.5;

    // Layer 2: Floating glassmorphism spheres
    const spheres = [
      {
        baseX: -450, baseY: -120, baseZ: 100,
        x: 0, y: 0, z: 0,
        r: 130, phase: 0, speed: 0.4
      },
      {
        baseX: 500, baseY: 180, baseZ: -50,
        x: 0, y: 0, z: 0,
        r: 190, phase: Math.PI / 3, speed: 0.3
      },
      {
        baseX: -200, baseY: 220, baseZ: 300,
        x: 0, y: 0, z: 0,
        r: 95, phase: Math.PI / 1.5, speed: 0.5
      },
      {
        baseX: 350, baseY: -240, baseZ: 150,
        x: 0, y: 0, z: 0,
        r: 150, phase: Math.PI, speed: 0.35
      }
    ];

    let time = 0;

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2.3;

      // Increment light sweep
      sweepProgress += sweepSpeed;
      if (sweepProgress > gridSize) {
        sweepProgress = -gridSize;
      }

      // Define theme colors - significantly increased opacity for high visibility
      const gridColor = isDark ? 'rgba(77, 110, 227, 0.22)' : 'rgba(83, 74, 183, 0.18)';
      const sweepsLineColor = isDark ? 'rgba(56, 189, 248, 0.75)' : 'rgba(83, 74, 183, 0.65)';
      const nodeColor = isDark ? 'rgba(56, 189, 248, 0.48)' : 'rgba(83, 74, 183, 0.38)';
      const activeNodeColor = isDark ? 'rgba(56, 189, 248, 0.95)' : 'rgba(77, 110, 227, 0.9)';

      // ── LAYER 1: FUTURISTIC TECHNOLOGY GRID ──
      // Helper function to project 3D coordinates
      const project = (x3d, y3d, z3d) => {
        const rotY = y3d * cosRotX - z3d * sinRotX;
        const rotZ = z3d * cosRotX + y3d * sinRotX;
        const finalZ = rotZ + zOffset;
        const scale = fov / Math.max(10, finalZ);
        return {
          x: centerX + x3d * scale,
          y: centerY + rotY * scale,
          scale,
          opacity: Math.max(0, Math.min(1, 1 - (finalZ - 200) / 1000))
        };
      };

      // Draw grid lines along X axis
      for (let z3d = -gridSize; z3d <= gridSize; z3d += gridStep) {
        ctx.beginPath();
        let first = true;
        const zDistToSweep = Math.abs(z3d - sweepProgress);
        const sweepFactor = Math.max(0, 1 - zDistToSweep / 180); // Glow multiplier

        for (let x3d = -gridSize; x3d <= gridSize; x3d += 40) {
          // Add a tiny wave ripple to the grid
          const distFromCenter = Math.sqrt(x3d*x3d + z3d*z3d);
          const y3d = Math.sin(x3d * 0.005 + time * 0.8) * 15 * Math.cos(z3d * 0.005 + time * 0.6);

          const pt = project(x3d, y3d, z3d);

          if (pt.opacity > 0.05) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        
        ctx.lineWidth = sweepFactor > 0 ? 1.8 : 1.0;
        ctx.strokeStyle = sweepFactor > 0 
          ? (isDark ? `rgba(56, 189, 248, ${sweepFactor * 0.55 + 0.2})` : `rgba(83, 74, 183, ${sweepFactor * 0.45 + 0.15})`)
          : gridColor;
        ctx.stroke();
      }

      // Draw grid lines along Z axis
      for (let x3d = -gridSize; x3d <= gridSize; x3d += gridStep) {
        ctx.beginPath();
        let first = true;

        for (let z3d = -gridSize; z3d <= gridSize; z3d += 40) {
          const distFromCenter = Math.sqrt(x3d*x3d + z3d*z3d);
          const y3d = Math.sin(x3d * 0.005 + time * 0.8) * 15 * Math.cos(z3d * 0.005 + time * 0.6);
          const pt = project(x3d, y3d, z3d);

          if (pt.opacity > 0.05) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = gridColor;
        ctx.stroke();
      }

      // Draw glowing intersections (nodes)
      for (let x3d = -gridSize; x3d <= gridSize; x3d += gridStep) {
        for (let z3d = -gridSize; z3d <= gridSize; z3d += gridStep) {
          // Node height calculation
          const y3d = Math.sin(x3d * 0.005 + time * 0.8) * 15 * Math.cos(z3d * 0.005 + time * 0.6);
          const pt = project(x3d, y3d, z3d);

          if (pt.opacity > 0.1) {
            const zDistToSweep = Math.abs(z3d - sweepProgress);
            const sweepFactor = Math.max(0, 1 - zDistToSweep / 140);
            
            const radius = Math.max(1.8, (pt.scale * 1.0) * (sweepFactor > 0 ? 2.0 : 1.0));
            
            // Draw node glow
            if (sweepFactor > 0.2) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, radius * 4.0, 0, Math.PI * 2);
              ctx.fillStyle = isDark 
                ? `rgba(56, 189, 248, ${sweepFactor * pt.opacity * 0.4})`
                : `rgba(83, 74, 183, ${sweepFactor * pt.opacity * 0.3})`;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = sweepFactor > 0.2 
              ? activeNodeColor 
              : nodeColor;
            ctx.fill();
          }
        }
      }

      // ── LAYER 2: FLOATING GLASSMORPHISM SPHERES ──
      // Update and project spheres
      const projectedSpheres = spheres.map(sphere => {
        // Organic drifting translation
        sphere.x = sphere.baseX + Math.sin(time * 0.3 * sphere.speed + sphere.phase) * 60;
        sphere.y = sphere.baseY + Math.cos(time * 0.22 * sphere.speed + sphere.phase) * 45;
        sphere.z = sphere.baseZ + Math.sin(time * 0.18 * sphere.speed + sphere.phase) * 60;

        // Perspective projection
        const rotY = sphere.y * cosRotX - sphere.z * sinRotX;
        const rotZ = sphere.z * cosRotX + sphere.y * sinRotX;
        const finalZ = rotZ + zOffset;
        const scale = fov / Math.max(10, finalZ);

        return {
          px: centerX + sphere.x * scale,
          py: centerY + rotY * scale,
          pr: sphere.r * scale,
          opacity: Math.max(0, Math.min(1, 1 - (finalZ - 100) / 1100)),
          zOrder: finalZ
        };
      });

      // Sort spheres from back to front
      projectedSpheres.sort((a, b) => b.zOrder - a.zOrder);

      // Render spheres
      projectedSpheres.forEach(s => {
        if (s.opacity > 0.05 && s.pr > 5) {
          ctx.save();
          
          // A. Draw ambient blur background glow
          const ambientRadius = s.pr * 2.2;
          const ambientGrad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, ambientRadius);
          if (isDark) {
            ambientGrad.addColorStop(0, `rgba(124, 111, 212, ${s.opacity * 0.35})`); // Purple ambient
            ambientGrad.addColorStop(0.4, `rgba(77, 110, 227, ${s.opacity * 0.2})`); // Blue ambient
            ambientGrad.addColorStop(1, 'rgba(77, 110, 227, 0)');
          } else {
            ambientGrad.addColorStop(0, `rgba(124, 111, 212, ${s.opacity * 0.22})`);
            ambientGrad.addColorStop(0.5, `rgba(77, 110, 227, ${s.opacity * 0.12})`);
            ambientGrad.addColorStop(1, 'rgba(77, 110, 227, 0)');
          }
          ctx.beginPath();
          ctx.arc(s.px, s.py, ambientRadius, 0, Math.PI * 2);
          ctx.fillStyle = ambientGrad;
          ctx.fill();

          // B. Draw glassmorphism sphere body (radial gradient representing frosted glass)
          const glassGrad = ctx.createRadialGradient(
            s.px - s.pr * 0.2, s.py - s.pr * 0.2, s.pr * 0.1,
            s.px, s.py, s.pr
          );
          if (isDark) {
            glassGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity * 0.3})`); // Frosted light flare
            glassGrad.addColorStop(0.3, `rgba(22, 22, 42, ${s.opacity * 0.65})`);   // Dark semi-transparent core
            glassGrad.addColorStop(0.85, `rgba(77, 110, 227, ${s.opacity * 0.22})`); // Refracted blue
            glassGrad.addColorStop(1, `rgba(124, 111, 212, ${s.opacity * 0.45})`);   // Glowing rim
          } else {
            glassGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity * 0.85})`);
            glassGrad.addColorStop(0.4, `rgba(240, 242, 247, ${s.opacity * 0.48})`);
            glassGrad.addColorStop(0.85, `rgba(83, 74, 183, ${s.opacity * 0.15})`);
            glassGrad.addColorStop(1, `rgba(83, 74, 183, ${s.opacity * 0.28})`);
          }

          ctx.beginPath();
          ctx.arc(s.px, s.py, s.pr, 0, Math.PI * 2);
          ctx.fillStyle = glassGrad;
          ctx.fill();

          // C. Draw glass rim stroke (thin bright highlight edge)
          ctx.beginPath();
          ctx.arc(s.px, s.py, s.pr, 0, Math.PI * 2);
          ctx.lineWidth = 1.4;
          if (isDark) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity * 0.28})`;
          } else {
            ctx.strokeStyle = `rgba(83, 74, 183, ${s.opacity * 0.42})`;
          }
          ctx.stroke();

          // D. Draw top-left highlight crescent for realistic glass reflection
          ctx.beginPath();
          ctx.arc(s.px, s.py, s.pr * 0.96, Math.PI * 1.05, Math.PI * 1.6);
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = isDark 
            ? `rgba(255, 255, 255, ${s.opacity * 0.4})` 
            : `rgba(255, 255, 255, ${s.opacity * 0.85})`;
          ctx.stroke();

          ctx.restore();
        }
      });

      time += 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-50 w-full h-full pointer-events-none block"
      style={{
        opacity: isDark ? 0.75 : 0.65, // Significantly higher wrapper opacity for clear highlight
      }}
    />
  );
}
