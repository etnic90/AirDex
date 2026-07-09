"use client";

import { useEffect, useRef, useState } from "react";
import { AircraftModel } from "../../../types";
import Link from "next/link";

interface Target {
  id: string;
  aircraft: AircraftModel;
  callsign: string;
  // Polar coordinates: radius (0 to 1) and angle (0 to 2*PI)
  r: number;
  theta: number;
  speed: number;
  altitude: number;
  heading: number; // degrees
  intensity: number; // For radar decay
  lastUpdate: number;
}

export default function RadarTacticalConsole({ 
  aircrafts, 
  lang 
}: { 
  aircrafts: AircraftModel[]; 
  lang: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Settings states
  const [zoomRange, setZoomRange] = useState<number>(150); // NM
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [consoleTheme, setConsoleTheme] = useState<"cyan" | "amber" | "emerald">("cyan");
  const [sweepSpeed, setSweepSpeed] = useState<number>(0.025); // Radians per frame
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<Target | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);

  // Maintain persistent targets in a ref to prevent reset on re-render
  const targetsRef = useRef<Map<string, Target>>(new Map());
  const [vectorsCount, setVectorsCount] = useState<number>(0);
  const sweepAngleRef = useRef<number>(0);

  // Theme configuration
  const themes = {
    cyan: {
      primary: "rgba(6, 182, 212, 1)",
      primaryLight: "rgba(6, 182, 212, 0.4)",
      primaryFaded: "rgba(6, 182, 212, 0.1)",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      accent: "text-cyan-500",
      bgBadge: "bg-cyan-500/10",
      canvasText: "#22d3ee",
      shadow: "shadow-[0_0_20px_rgba(6, 182, 212, 0.15)]",
    },
    amber: {
      primary: "rgba(245, 158, 11, 1)",
      primaryLight: "rgba(245, 158, 11, 0.4)",
      primaryFaded: "rgba(245, 158, 11, 0.1)",
      text: "text-amber-500",
      border: "border-amber-500/20",
      accent: "text-amber-500",
      bgBadge: "bg-amber-500/10",
      canvasText: "#fbbf24",
      shadow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    },
    emerald: {
      primary: "rgba(16, 185, 129, 1)",
      primaryLight: "rgba(16, 185, 129, 0.4)",
      primaryFaded: "rgba(16, 185, 129, 0.1)",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      accent: "text-emerald-500",
      bgBadge: "bg-emerald-500/10",
      canvasText: "#34d399",
      shadow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    }
  };

  const activeTheme = themes[consoleTheme];

  // Helper sound synthesizer
  const playBeep = (freq: number, duration: number, type: OscillatorType = "sine") => {
    if (!isAudioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  };

  // Build target list from aircraft properties (seeded coordinate simulation)
  useEffect(() => {
    const nextTargets = new Map<string, Target>();
    
    aircrafts.forEach((aircraft, idx) => {
      const existing = targetsRef.current.get(aircraft.id);
      if (existing) {
        existing.aircraft = aircraft; // Update reference
        nextTargets.set(aircraft.id, existing);
      } else {
        // Generate coordinates seeded by ID character sum to keep them stable
        let hash = 0;
        for (let i = 0; i < aircraft.id.length; i++) {
          hash += aircraft.id.charCodeAt(i);
        }
        
        const seedAngle = (hash % 360) * (Math.PI / 180);
        // Distribute distance reasonably, keeping some near and some far
        const seedRadius = 0.15 + ((hash * 17) % 80) / 100; // 0.15 to 0.95
        
        // Flight numbers
        const airlines = ["AZ", "LH", "AF", "BA", "KL", "EK", "SQ", "AA", "DL", "UA"];
        const airline = airlines[hash % airlines.length];
        const flightNum = 100 + (hash % 899);
        
        const heading = (hash * 3) % 360;
        const speed = 350 + (hash % 200); // knots
        const altitude = 24000 + (hash % 17) * 1000; // FL240 to FL410
        
        nextTargets.set(aircraft.id, {
          id: aircraft.id,
          aircraft,
          callsign: `${airline}${flightNum}`,
          r: seedRadius,
          theta: seedAngle,
          speed,
          altitude,
          heading,
          intensity: 0,
          lastUpdate: Date.now()
        });
      }
    });

    targetsRef.current = nextTargets;
    setVectorsCount(nextTargets.size);
    
    // Automatically select the first target if none is selected
    if (nextTargets.size > 0 && !selectedTarget) {
      const firstTarget = Array.from(nextTargets.values())[0];
      setSelectedTarget(firstTarget);
    }
  }, [aircrafts]);

  // Main Radar Canvas Loop
  useEffect(() => {
    let animId: number;
    
    const updateAndDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 25;

      // 1. CLEAR WITH TRACE DECAY (creates vector trails)
      ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
      ctx.fillRect(0, 0, width, height);

      // 2. DRAW RADAR BACKGROUND GRID
      ctx.strokeStyle = activeTheme.primaryFaded;
      ctx.lineWidth = 1;

      // Circular ranges
      const circlesCount = 4;
      for (let i = 1; i <= circlesCount; i++) {
        const ringRadius = radius * (i / circlesCount);
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Label distance
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "8px monospace";
        const distanceLabel = Math.round((zoomRange * i) / circlesCount) + " NM";
        ctx.fillText(distanceLabel, centerX + 5, centerY - ringRadius + 3);
      }

      // Compass crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Degree Tickmarks
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      
      const headings = [
        { text: "N (360°)", x: centerX, y: centerY - radius - 8 },
        { text: "E (090°)", x: centerX + radius + 15, y: centerY + 3 },
        { text: "S (180°)", x: centerX, y: centerY + radius + 15 },
        { text: "W (270°)", x: centerX - radius - 15, y: centerY + 3 }
      ];
      headings.forEach(h => ctx.fillText(h.text, h.x, h.y));

      // 3. UPDATE TARGET POSITIONS (simulation mode)
      if (simulationActive) {
        targetsRef.current.forEach((t) => {
          // Slow flight simulation update
          const speedFactor = 0.000003 * (t.speed / 400);
          // Update polar coordinates based on heading vector
          const headingRad = (t.heading * Math.PI) / 180;
          
          // Calculate cartesian coordinates relative to center
          let cx = t.r * Math.cos(t.theta);
          let cy = t.r * Math.sin(t.theta);
          
          // Move vector
          cx += Math.cos(headingRad) * speedFactor;
          cy += Math.sin(headingRad) * speedFactor;
          
          // Warp back if target leaves radar radius bounds
          if (cx * cx + cy * cy > 0.95) {
            t.r = 0.2 + Math.random() * 0.3;
            t.theta = (t.theta + Math.PI) % (2 * Math.PI); // Warp to opposite side
          } else {
            t.r = Math.sqrt(cx * cx + cy * cy);
            t.theta = Math.atan2(cy, cx);
            if (t.theta < 0) t.theta += 2 * Math.PI;
          }
        });
      }

      // 4. DRAW ROTATING RADAR SWEEP LINE
      sweepAngleRef.current = (sweepAngleRef.current + sweepSpeed) % (2 * Math.PI);
      const sweepX = centerX + radius * Math.cos(sweepAngleRef.current);
      const sweepY = centerY + radius * Math.sin(sweepAngleRef.current);

      // Sweep gradient sweep effect
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGrad.addColorStop(0, "rgba(2, 6, 23, 0)");
      sweepGrad.addColorStop(0.9, "rgba(2, 6, 23, 0)");
      sweepGrad.addColorStop(1, activeTheme.primaryFaded);
      
      // Draw sweep line
      ctx.strokeStyle = activeTheme.primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();
      ctx.restore();

      // Draw faint sweeping area shadow
      ctx.fillStyle = `rgba(${consoleTheme === "cyan" ? "6,182,212" : consoleTheme === "amber" ? "245,158,11" : "16,185,129"}, 0.02)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngleRef.current - 0.2, sweepAngleRef.current);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // 5. DRAW TARGETS & BLIPS
      targetsRef.current.forEach((t) => {
        const tx = centerX + t.r * radius * Math.cos(t.theta);
        const ty = centerY + t.r * radius * Math.sin(t.theta);

        // Detect sweep hit to light up target & play beep
        // Check angular distance from sweep angle
        let angDiff = sweepAngleRef.current - t.theta;
        if (angDiff < 0) angDiff += 2 * Math.PI;
        
        // Hit window (sweep just passed the target angle)
        const hitWindow = 0.08;
        if (angDiff < hitWindow && Date.now() - t.lastUpdate > 1500) {
          t.intensity = 1.0;
          t.lastUpdate = Date.now();
          // Synthesize a tactical sonar ping
          playBeep(880 + (t.speed % 10) * 40, 0.12);
        } else {
          // Slow decay over time
          t.intensity = Math.max(0.18, t.intensity - 0.005);
        }

        // Draw selection/hover rings
        const isSelected = selectedTarget?.id === t.id;
        const isHovered = hoveredTarget?.id === t.id;

        if (isSelected) {
          ctx.strokeStyle = activeTheme.primary;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(tx, ty, 12, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw tactical target cursor
          ctx.strokeStyle = activeTheme.primary;
          ctx.beginPath();
          ctx.moveTo(tx - 16, ty); ctx.lineTo(tx - 8, ty);
          ctx.moveTo(tx + 8, ty); ctx.lineTo(tx + 16, ty);
          ctx.moveTo(tx, ty - 16); ctx.lineTo(tx, ty - 8);
          ctx.moveTo(tx, ty + 8); ctx.lineTo(tx, ty + 16);
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(tx, ty, 8, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Radar Blip Symbol (a vector cross or square)
        ctx.fillStyle = `rgba(${consoleTheme === "cyan" ? "34,211,238" : consoleTheme === "amber" ? "251,191,36" : "52,211,153"}, ${t.intensity})`;
        ctx.fillRect(tx - 3, ty - 3, 6, 6);
        
        // Callsign / Alt vector tag on sweep passes
        if (t.intensity > 0.3 || isSelected || isHovered) {
          ctx.fillStyle = isSelected ? activeTheme.canvasText : `rgba(255,255,255,${Math.max(t.intensity, 0.5)})`;
          ctx.font = isSelected ? "bold 8px monospace" : "8px monospace";
          ctx.textAlign = "left";
          
          const textOffset = 10;
          ctx.fillText(t.callsign, tx + textOffset, ty - 6);
          ctx.fillText(`FL${t.altitude / 100}`, tx + textOffset, ty + 2);
          ctx.fillText(`${t.speed}KT`, tx + textOffset, ty + 10);
          
          // Vector direction line
          const vecX = tx + 14 * Math.cos((t.heading * Math.PI) / 180);
          const vecY = ty + 14 * Math.sin((t.heading * Math.PI) / 180);
          ctx.strokeStyle = `rgba(${consoleTheme === "cyan" ? "34,211,238" : consoleTheme === "amber" ? "251,191,36" : "52,211,153"}, ${Math.max(t.intensity, 0.4)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(vecX, vecY);
          ctx.stroke();
        }
      });

      // Frame animation request
      animId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [consoleTheme, zoomRange, sweepSpeed, isAudioEnabled, simulationActive, selectedTarget, hoveredTarget]);

  // Click & Hover coordinates hit testing
  const handleCanvasMouse = (e: React.MouseEvent<HTMLCanvasElement>, type: "click" | "hover") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 25;

    // Find the closest target within hit radius
    let closestTarget: Target | null = null;
    let minDistance = 18; // maximum hit range in pixels

    targetsRef.current.forEach((t) => {
      const tx = centerX + t.r * radius * Math.cos(t.theta);
      const ty = centerY + t.r * radius * Math.sin(t.theta);
      
      const dist = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = t;
      }
    });

    if (type === "click") {
      if (closestTarget) {
        setSelectedTarget(closestTarget);
        playBeep(600, 0.1, "triangle");
        
        // Scroll to the card list
        const cardElement = document.getElementById(`aircraft-card-${(closestTarget as Target).aircraft.id}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } else {
      setHoveredTarget(closestTarget);
    }
  };

  // Sound enablement click-through triggers AudioContext startup correctly
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    playBeep(440, 0.08, "sine");
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md mb-8 flex flex-col xl:flex-row shadow-2xl relative">
      
      {/* HUD corner highlights */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-700/60 pointer-events-none"></div>
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-700/60 pointer-events-none"></div>
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-700/60 pointer-events-none"></div>
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-700/60 pointer-events-none"></div>
      
      {/* LEFT: The Canvas Radar Screen */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-[420px] md:min-h-[500px] flex items-center justify-center p-6 bg-slate-950/40 border-b xl:border-b-0 xl:border-r border-slate-800/80 relative"
      >
        {/* Neon scan sweep background */}
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onMouseMove={(e) => handleCanvasMouse(e, "hover")}
          onClick={(e) => handleCanvasMouse(e, "click")}
          onMouseLeave={() => setHoveredTarget(null)}
          className="max-w-full aspect-square cursor-crosshair bg-slate-950/80 rounded-full border border-slate-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
        />

        {/* Floating status stats overlay */}
        <div className="absolute top-6 left-6 font-mono text-[9px] text-slate-550 uppercase tracking-widest leading-relaxed">
          <div>SCAN AREA: <span className="text-white font-extrabold">{zoomRange} NM</span></div>
          <div>SWEEP SPEED: <span className="text-white font-extrabold">{(sweepSpeed * 60).toFixed(1)} RAD/s</span></div>
          <div>VECTORS CAPTURED: <span className={`${activeTheme.text} font-extrabold`}>{vectorsCount}</span></div>
        </div>

        {/* Floating active sound indicator */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button
            onClick={toggleAudio}
            className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1 border rounded cursor-pointer transition-all ${
              isAudioEnabled ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-slate-950 text-slate-505 border-slate-850"
            }`}
          >
            🔊 AUDIO: {isAudioEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* RIGHT: Telemetry Details Sidebar Panel */}
      <div className="w-full xl:w-[420px] p-8 flex flex-col justify-between bg-slate-900/15 relative z-10 font-sans">
        
        {/* Telemetry Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className={`font-mono text-[10px] font-black uppercase tracking-[0.2em] block ${activeTheme.text}`}>
                {"// TELEMETRIA BERSAGLIO"}
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {selectedTarget ? selectedTarget.callsign : "NESSUN CONTATTO"}
              </h3>
            </div>
            {selectedTarget && (
              <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider ${activeTheme.bgBadge} ${activeTheme.text} border ${activeTheme.border}`}>
                Intercettato
              </span>
            )}
          </div>

          {selectedTarget ? (
            <div className="space-y-5">
              {/* Aircraft Model Card Spec */}
              <div className="bg-slate-950/90 border border-slate-850 p-5 rounded-2xl space-y-4 shadow-inner">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Modello Aeromobile</span>
                  <div className="text-lg font-extrabold text-white leading-tight uppercase font-sans">
                    {selectedTarget.aircraft.model_name}
                  </div>
                  <div className="text-xs text-cyan-400 font-mono mt-1 font-bold">
                    {selectedTarget.aircraft.manufacturers?.name || "Costruttore Ignoto"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900/60 font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Motori</span>
                    <span className="text-slate-200 font-extrabold uppercase">{selectedTarget.aircraft.engines}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Rarità</span>
                    <span className="text-purple-400 font-extrabold">{selectedTarget.aircraft.rarity}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Flight Parameters */}
              <div className="grid grid-cols-2 gap-3.5 font-mono text-xs">
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 block uppercase">Quota Altitudine</span>
                  <span className="text-white font-extrabold text-sm">{selectedTarget.altitude.toLocaleString()} FT</span>
                  <span className="text-[9px] text-slate-400 block mt-1">FL{(selectedTarget.altitude / 100).toFixed(0)}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 block uppercase">Velocità stimata</span>
                  <span className="text-white font-extrabold text-sm">{selectedTarget.speed} KT</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Mach ~{(selectedTarget.speed / 667.2).toFixed(2)}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 block uppercase">Rotta (Heading)</span>
                  <span className="text-white font-extrabold text-sm">{selectedTarget.heading}°</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Direzione: {
                    selectedTarget.heading < 45 || selectedTarget.heading >= 315 ? "Nord" :
                    selectedTarget.heading >= 45 && selectedTarget.heading < 135 ? "Est" :
                    selectedTarget.heading >= 135 && selectedTarget.heading < 225 ? "Sud" : "Ovest"
                  }</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-550 block uppercase font-bold tracking-wider">Raggio d&apos;Azione</span>
                  <span className="text-white font-extrabold text-sm">
                    {selectedTarget.aircraft.range_km ? `${selectedTarget.aircraft.range_km.toLocaleString()} km` : "N/D"}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">Autonomia Serbatoi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 font-mono text-xs text-slate-500">
              <span className="text-2xl mb-2">📡</span>
              Scansiona lo schermo radar ed intercetta un bersaglio per analizzarne i vettori telemetrici.
            </div>
          )}
        </div>

        {/* Tactical Control Panels (Settings buttons) */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-4">
          
          {/* Theme Switcher */}
          <div>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Console HUD Color</span>
            <div className="flex gap-2">
              {(["cyan", "amber", "emerald"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setConsoleTheme(t)}
                  className={`flex-1 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider border cursor-pointer transition-all font-bold ${
                    consoleTheme === t 
                      ? `${themes[t].bgBadge} ${themes[t].text} ${themes[t].border}`
                      : "bg-slate-950 text-slate-550 border-slate-850 hover:text-slate-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Range controls */}
          <div className="flex justify-between items-center font-mono text-[9px]">
            <div>
              <span className="text-slate-550 uppercase tracking-widest block">Radar Zoom Range</span>
              <div className="flex gap-1.5 mt-2">
                {[50, 150, 300].map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoomRange(z)}
                    className={`px-2 py-1 border rounded cursor-pointer font-bold ${
                      zoomRange === z 
                        ? `${activeTheme.bgBadge} ${activeTheme.text} ${activeTheme.border}` 
                        : "bg-slate-950 text-slate-505 border-slate-850"
                    }`}
                  >
                    {z} NM
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-slate-550 uppercase tracking-widest block">Simulazione Voli</span>
              <button
                type="button"
                onClick={() => setSimulationActive(!simulationActive)}
                className={`mt-2 px-2.5 py-1 border rounded cursor-pointer font-bold uppercase tracking-wider ${
                  simulationActive 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}
              >
                {simulationActive ? "Attiva" : "Mantenuta"}
              </button>
            </div>
          </div>

          {selectedTarget && (
            <Link 
              href={`/${lang}/aircraft/${selectedTarget.aircraft.slug}`}
              className={`w-full mt-2 inline-flex items-center justify-center font-mono text-[10px] font-black uppercase tracking-widest py-3 border rounded-xl transition-all shadow-md cursor-pointer ${
                consoleTheme === "cyan" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" :
                consoleTheme === "amber" ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20" :
                "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              Apri Scheda Vettore &rarr;
            </Link>
          )}

        </div>

      </div>

    </div>
  );
}
