/**
 * Juicy Rush — Complete Fruit Slice Arcade Game Engine
 * Plain HTML5 Canvas & Web Audio API
 */
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8254729807539525"
     crossorigin="anonymous"></script>
'use strict';

(function () {
  // --- DOM Elements ---
  const arena = document.getElementById('arena');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const gameContainer = document.getElementById('gameContainer');

  // HUD Elements
  const scoreValEl = document.getElementById('scoreVal');
  const bestValEl = document.getElementById('bestVal');
  const timerValEl = document.getElementById('timerVal');
  const timerContainerEl = document.getElementById('timerContainer');
  const comboBanner = document.getElementById('comboBanner');
  const comboCountEl = document.getElementById('comboCount');
  const comboTextEl = document.getElementById('comboText');
  const comboBonusEl = document.getElementById('comboBonus');

  // Controls
  const soundBtn = document.getElementById('soundBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const soundOnIcon = soundBtn.querySelector('.sound-on');
  const soundOffIcon = soundBtn.querySelector('.sound-off');
  const pauseIcon = pauseBtn.querySelector('.pause-icon');
  const playIcon = pauseBtn.querySelector('.play-icon');

  // Overlays
  const overlay = document.getElementById('overlay');
  const overlayCard = document.getElementById('overlayCard');
  const overlayPill = document.getElementById('overlayPill');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');
  const primaryBtn = document.getElementById('primaryBtn');
  const primaryBtnText = document.getElementById('primaryBtnText');
  const secondaryBtn = document.getElementById('secondaryBtn');
  const gameOverStats = document.getElementById('gameOverStats');
  const statFruits = document.getElementById('statFruits');
  const statCombo = document.getElementById('statCombo');
  const statRecord = document.getElementById('statRecord');
  const statRecordPill = document.getElementById('statRecordPill');

  // --- Audio Synthesizer (Web Audio API) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.masterGain = null;
      this.initFromStorage();
    }

    initFromStorage() {
      try {
        const saved = localStorage.getItem('juicy_rush_muted');
        if (saved !== null) {
          this.muted = saved === 'true';
        }
      } catch (e) {
        this.muted = false;
      }
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      // iOS Safari silent buffer unlock on first gesture
      if (this.ctx && this.ctx.state === 'running' && !this.unlocked) {
        try {
          const buf = this.ctx.createBuffer(1, 1, 22050);
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          src.start(0);
          this.unlocked = true;
        } catch (e) {}
      }
    }

    toggleMute() {
      this.ensureContext();
      this.muted = !this.muted;
      try {
        localStorage.setItem('juicy_rush_muted', String(this.muted));
      } catch (e) {}

      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime);
      }
      return this.muted;
    }

    // Swish sound when dragging fast
    playSwish() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.08);
      filter.Q.setValueAtTime(3.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.08);
    }

    // Crisp juicy fruit slice sound
    playSlice(pitchMult = 1.0) {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // Tone 1: High crisp snap
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      const startFreq = (1600 + Math.random() * 400) * pitchMult;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.12);

      oscGain.gain.setValueAtTime(0.28, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);

      // Noise 2: Juicy squelch burst
      const bufSize = Math.floor(this.ctx.sampleRate * 0.09);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.09);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.09);
    }

    // Melodic combo chord chime
    playCombo(comboCount) {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Pentatonic scale
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const noteIdx = Math.min(comboCount - 2, notes.length - 1);
      const freq = notes[Math.max(0, noteIdx)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.setValueAtTime(freq * 1.002, t + 0.05);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    // Bomb explosion sound with deep rumble
    playBomb() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // Low frequency sine rumble
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.6);

      subGain.gain.setValueAtTime(0.65, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.65);

      // Distorted noise blast
      const bufLen = Math.floor(this.ctx.sampleRate * 0.55);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.5);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.7, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.55);
    }

    // UI Click Sound
    playClick() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.05);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    // Game Over Sound
    playGameOver() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const freqs = [440, 392, 349.23, 293.66];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    }

    // High score fanfare
    playFanfare() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + i * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + (i === 3 ? 0.6 : 0.25));

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + (i === 3 ? 0.6 : 0.25));
      });
    }
  }

  const sfx = new SoundFX();

  // --- Fruit Definitions with Canvas Vector Renderers ---
  const FRUIT_TYPES = [
    {
      id: 'watermelon',
      name: 'Watermelon',
      radius: 36,
      splashColor: '#ff3b56',
      splatColor: 'rgba(255, 59, 86, 0.32)',
      score: 10,
      drawWhole(ctx, r) {
        // Outer dark green rind
        ctx.fillStyle = '#225e2a';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Darker green wavy stripes
        ctx.strokeStyle = '#143d1a';
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        for (let a = -0.7; a <= 0.7; a += 0.45) {
          ctx.beginPath();
          ctx.ellipse(r * a * 0.65, 0, r * 0.14, r * 0.88, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner white/pale-green rind
        ctx.fillStyle = '#e5f3c5';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        ctx.fill();

        // Juicy red flesh
        ctx.fillStyle = '#ff3b56';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Subtle specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2);
        ctx.fill();

        // Teardrop seeds
        ctx.fillStyle = '#1e1a18';
        const seedAngles = [0.2, 0.8, 1.5, 2.3, 3.1, 3.9, 4.6, 5.4];
        for (const ang of seedAngles) {
          const dist = r * 0.52;
          const sx = Math.cos(ang) * dist;
          const sy = Math.sin(ang) * dist;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(ang + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, -3.5);
          ctx.quadraticCurveTo(2.5, 3, 0, 4);
          ctx.quadraticCurveTo(-2.5, 3, 0, -3.5);
          ctx.fill();
          // Seed specular speck
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-0.5, 0, 1.2, 1.2);
          ctx.fillStyle = '#1e1a18';
          ctx.restore();
        }
      },
      drawCutFace(ctx, r) {
        // Red juicy interior
        ctx.fillStyle = '#ff3b56';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Seeds
        ctx.fillStyle = '#1e1a18';
        for (let i = 0; i < 4; i++) {
          const sx = (i - 1.5) * (r * 0.35);
          const sy = -r * 0.2;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    {
      id: 'orange',
      name: 'Orange',
      radius: 32,
      splashColor: '#ff8819',
      splatColor: 'rgba(255, 136, 25, 0.32)',
      score: 10,
      drawWhole(ctx, r) {
        // Outer textured orange rind
        ctx.fillStyle = '#ff8819';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Peel pores & specular gloss
        ctx.fillStyle = '#ffa442';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.25, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.38, -r * 0.38, r * 0.25, r * 0.14, -0.6, 0, Math.PI * 2);
        ctx.fill();

        // Top green leaf and stem
        ctx.fillStyle = '#399e45';
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r * 0.95, r * 0.35, r * 0.16, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5a3d1c';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -r + 2);
        ctx.lineTo(-2, -r - 6);
        ctx.stroke();
      },
      drawCutFace(ctx, r) {
        // White inner pith
        ctx.fillStyle = '#fff4df';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // 8 juicy orange wedges
        ctx.fillStyle = '#ff8f24';
        const segments = 8;
        for (let i = 0; i < segments; i++) {
          const start = (i * Math.PI * 2) / segments + 0.05;
          const end = ((i + 1) * Math.PI * 2) / segments - 0.05;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r * 0.82, start, end);
          ctx.closePath();
          ctx.fill();
        }

        // Center star
        ctx.fillStyle = '#fff4df';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      radius: 28,
      splashColor: '#eb2547',
      splatColor: 'rgba(235, 37, 71, 0.32)',
      score: 10,
      drawWhole(ctx, r) {
        // Berry heart/conical body
        ctx.fillStyle = '#eb2547';
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.1, r * 0.2, -r * 1.1, -r * 0.7, 0, -r * 0.7);
        ctx.bezierCurveTo(r * 1.1, -r * 0.7, r * 1.1, r * 0.2, 0, r);
        ctx.fill();

        // Glossy light highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.15, r * 0.18, r * 0.35, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Golden seeds
        ctx.fillStyle = '#fce458';
        const seedCoords = [
          [-r * 0.3, -r * 0.3], [r * 0.3, -r * 0.3], [0, -r * 0.4],
          [-r * 0.45, 0], [0, -0.05], [r * 0.45, 0],
          [-r * 0.25, r * 0.35], [r * 0.25, r * 0.35], [0, r * 0.55]
        ];
        for (const [sx, sy] of seedCoords) {
          ctx.beginPath();
          ctx.ellipse(sx, sy, 1.6, 2.4, 0.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Green leafy crown
        ctx.fillStyle = '#3ca848';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(i * 7, -r * 0.72, 5, 11, (i * 0.28), 0, Math.PI * 2);
          ctx.fill();
        }

        // Little stem
        ctx.strokeStyle = '#5a7834';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7);
        ctx.lineTo(2, -r - 5);
        ctx.stroke();
      },
      drawCutFace(ctx, r) {
        // Pink strawberry interior
        ctx.fillStyle = '#ffa4b5';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Center ruby rays
        ctx.fillStyle = '#e82348';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    {
      id: 'banana',
      name: 'Banana',
      radius: 34,
      splashColor: '#ffe042',
      splatColor: 'rgba(255, 224, 66, 0.32)',
      score: 10,
      drawWhole(ctx, r) {
        ctx.save();
        ctx.rotate(-0.35);

        // Curved golden banana body
        ctx.fillStyle = '#ffd11a';
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.3);
        ctx.quadraticCurveTo(0, -r * 0.9, r * 1.1, -r * 0.1);
        ctx.quadraticCurveTo(0, r * 0.6, -r * 0.9, -r * 0.3);
        ctx.fill();

        // Highlight ridge
        ctx.strokeStyle = '#ffe96b';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.25);
        ctx.quadraticCurveTo(0, -r * 0.65, r * 0.9, -r * 0.15);
        ctx.stroke();

        // Dark blossom tip
        ctx.fillStyle = '#593f1f';
        ctx.beginPath();
        ctx.arc(r * 1.1, -r * 0.1, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Green-brown stem
        ctx.fillStyle = '#7a9e22';
        ctx.beginPath();
        ctx.rect(-r * 1.05, -r * 0.36, 6, 8);
        ctx.fill();

        ctx.restore();
      },
      drawCutFace(ctx, r) {
        // Creamy banana chunk cross-section
        ctx.fillStyle = '#fffbe3';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        ctx.fill();

        // Micro center seed spots
        ctx.fillStyle = '#755f41';
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 3, Math.sin(a) * 3, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    {
      id: 'kiwi',
      name: 'Kiwi',
      radius: 30,
      splashColor: '#78d83a',
      splatColor: 'rgba(120, 216, 58, 0.32)',
      score: 10,
      drawWhole(ctx, r) {
        // Fuzzy brown skin
        ctx.fillStyle = '#8a5c32';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Speckled fuzzy texture dots
        ctx.fillStyle = '#654120';
        for (let i = 0; i < 14; i++) {
          const a = (i * 0.45);
          const dist = (i % 3 === 0) ? r * 0.75 : r * 0.45;
          ctx.fillRect(Math.cos(a) * dist, Math.sin(a) * dist, 1.8, 1.8);
        }

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(-r * 0.28, -r * 0.28, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      },
      drawCutFace(ctx, r) {
        // Vibrant emerald green kiwi interior
        ctx.fillStyle = '#6edb37';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        ctx.fill();

        // Creamy center oval
        ctx.fillStyle = '#e8f9b8';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.3, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ring of black seeds
        ctx.fillStyle = '#1c1c1c';
        const numSeeds = 14;
        for (let i = 0; i < numSeeds; i++) {
          const ang = (i * Math.PI * 2) / numSeeds;
          const dist = r * 0.52;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  ];

  // --- Game Engine Variables ---
  let canvasW = 900;
  let canvasH = 560;
  let dpr = 1;

  let state = 'start'; // 'start', 'playing', 'paused', 'gameover'
  let score = 0;
  let bestScore = 0;
  const ROUND_DURATION = 60.0;
  let timeLeft = ROUND_DURATION;
  let elapsed = 0;

  // Stats for game-over modal
  let fruitsSlicedCount = 0;
  let maxComboCount = 0;
  let newRecordAchieved = false;

  // Active game entities
  let objects = [];       // flying fruits and bombs
  let slicedHalves = [];  // split halves falling with gravity
  let particles = [];     // juice droplets and spark sparks
  let splats = [];        // background wall splashes
  let scorePops = [];     // floating score text indicators

  // Combo system
  let combo = 0;
  let lastSliceTime = -100;
  let comboBannerTimer = 0;

  // Blade Swipe Trail
  let bladePoints = [];
  let isPointerDown = false;
  let lastSwishTime = 0;

  // Spawner timing
  let spawnTimer = 0.5;

  // Animation frame loop
  let lastFrameTime = 0;
  let animFrameId = null;

  // --- Local Storage Initialization ---
  try {
    const saved = localStorage.getItem('juicy_rush_best_score');
    if (saved !== null) {
      bestScore = Math.max(0, parseInt(saved, 10) || 0);
    }
  } catch (e) {
    bestScore = 0;
  }
  bestValEl.textContent = String(bestScore).padStart(4, '0');

  // --- Canvas Resize & Resolution Management ---
  function handleResize() {
    const rect = arena.getBoundingClientRect();
    canvasW = rect.width || 800;
    canvasH = rect.height || 500;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', handleResize);
  // Initial size setup
  handleResize();

  // --- Sound Control Toggle Sync ---
  function updateSoundUI() {
    if (sfx.muted) {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      soundBtn.setAttribute('aria-label', 'Unmute sound');
      soundBtn.setAttribute('title', 'Unmute sound (Key: M)');
    } else {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      soundBtn.setAttribute('aria-label', 'Mute sound');
      soundBtn.setAttribute('title', 'Mute sound (Key: M)');
    }
  }
  updateSoundUI();

  soundBtn.addEventListener('click', () => {
    sfx.toggleMute();
    updateSoundUI();
    if (!sfx.muted) sfx.playClick();
  });

  // --- HUD Updates ---
  function updateHud() {
    scoreValEl.textContent = String(score).padStart(4, '0');
    bestValEl.textContent = String(bestScore).padStart(4, '0');

    const displaySecs = Math.max(0, Math.ceil(timeLeft));
    timerValEl.innerHTML = `${displaySecs}<span class="unit">s</span>`;

    // Urgent pulse styling when time is low
    if (timeLeft <= 10.0 && timeLeft > 0 && state === 'playing') {
      timerContainerEl.classList.add('timer-urgent');
    } else {
      timerContainerEl.classList.remove('timer-urgent');
    }
  }

  // --- Trigger Screen Shake ---
  function triggerScreenShake() {
    gameContainer.classList.remove('screen-shake');
    // Force reflow
    void gameContainer.offsetWidth;
    gameContainer.classList.add('screen-shake');
    setTimeout(() => {
      gameContainer.classList.remove('screen-shake');
    }, 450);
  }

  // --- Bomb Vector Drawing ---
  function drawBomb(ctx, r, time) {
    // Menacing dark sphere
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#535c69');
    grad.addColorStop(0.6, '#262c35');
    grad.addColorStop(1, '#11151b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Metallic collar
    ctx.fillStyle = '#7a8591';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-r * 0.28, -r - 4, r * 0.56, 7, 2);
    } else {
      ctx.rect(-r * 0.28, -r - 4, r * 0.56, 7);
    }
    ctx.fill();

    // Curving rope fuse
    ctx.strokeStyle = '#9c794a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r - 3);
    ctx.quadraticCurveTo(r * 0.45, -r - 18, r * 0.65, -r - 12);
    ctx.stroke();

    // Crackling animated fuse spark
    const sparkX = r * 0.65;
    const sparkY = -r - 12;

    const flicker = Math.sin(time * 30) * 2;
    ctx.fillStyle = '#ffec43';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 4.5 + flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 7 + flicker * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing skull or warning sign on body
    ctx.fillStyle = '#ff4d4d';
    ctx.font = `900 ${Math.round(r * 1.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', 0, 1);
  }

  // --- Spawning Logic & Wave Scaling ---
  function spawnWave() {
    // Bomb probability scales with elapsed time (0% in first 8s, up to 28% in late game)
    let bombChance = 0;
    if (elapsed > 8) {
      bombChance = Math.min(0.28, 0.12 + (elapsed - 8) * 0.0035);
    }

    // Determine count of items launched in this wave
    let waveCount = 1;
    const r = Math.random();
    if (elapsed < 10) {
      waveCount = r < 0.65 ? 1 : 2;
    } else if (elapsed < 25) {
      waveCount = r < 0.4 ? 1 : (r < 0.85 ? 2 : 3);
    } else if (elapsed < 45) {
      waveCount = r < 0.25 ? 2 : (r < 0.75 ? 3 : 4);
    } else {
      // Final rush frenzy!
      waveCount = r < 0.2 ? 2 : (r < 0.6 ? 3 : (r < 0.9 ? 4 : 5));
    }

    let bombSpawnedInWave = false;

    for (let i = 0; i < waveCount; i++) {
      const isBomb = !bombSpawnedInWave && Math.random() < bombChance;
      if (isBomb) bombSpawnedInWave = true;

      const fruitType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
      const radius = isBomb ? 32 : fruitType.radius;

      // Spawn x positioned inside safe margin
      const margin = 55;
      const x = margin + Math.random() * (canvasW - margin * 2);
      const y = canvasH + radius + 10 + i * 22; // slight stagger

      // Calculate initial vertical velocity so fruit apex reaches 18% - 50% of arena height
      const targetApexY = canvasH * (0.18 + Math.random() * 0.34);
      const gravity = 780; // px/s^2
      const deltaY = y - targetApexY;
      const vy = -Math.sqrt(2 * gravity * deltaY);

      // Horizontal velocity aimed generally toward play area center
      const centerOffset = (canvasW * 0.5 - x) / (canvasW * 0.5);
      const vx = centerOffset * (60 + Math.random() * 110) + (Math.random() - 0.5) * 80;

      objects.push({
        x,
        y,
        vx,
        vy,
        radius,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 4.2,
        isBomb,
        fruitType,
        dead: false
      });
    }

    // Schedule next spawn delay
    const baseDelay = Math.max(0.65, 1.45 - elapsed * 0.012);
    spawnTimer = baseDelay + Math.random() * 0.45;
  }

  // --- Slicing & Splitting Halves ---
  function splitFruitIntoHalves(obj, sliceAngle) {
    const perpAngle = sliceAngle + Math.PI / 2;
    const nx = Math.cos(perpAngle);
    const ny = Math.sin(perpAngle);
    const pushSpeed = 160 + Math.random() * 60;

    // Half A (flies left/perpendicular)
    slicedHalves.push({
      x: obj.x + nx * 10,
      y: obj.y + ny * 10,
      vx: obj.vx + nx * pushSpeed + (Math.random() - 0.5) * 40,
      vy: obj.vy + ny * pushSpeed * 0.5 - 60,
      radius: obj.radius,
      rotation: sliceAngle,
      spin: -(2.5 + Math.random() * 3.5),
      fruitType: obj.fruitType,
      life: 1.8
    });

    // Half B (flies right/opposite)
    slicedHalves.push({
      x: obj.x - nx * 10,
      y: obj.y - ny * 10,
      vx: obj.vx - nx * pushSpeed + (Math.random() - 0.5) * 40,
      vy: obj.vy - ny * pushSpeed * 0.5 - 60,
      radius: obj.radius,
      rotation: sliceAngle + Math.PI,
      spin: +(2.5 + Math.random() * 3.5),
      fruitType: obj.fruitType,
      life: 1.8
    });
  }

  // --- Particle & Splash Generator ---
  function createJuiceExplosion(x, y, fruitType, count = 22) {
    // 1. Colorful juice droplets
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 260;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        radius: 2.2 + Math.random() * 4.2,
        color: fruitType.splashColor,
        life: 0.65 + Math.random() * 0.4,
        maxLife: 1.05,
        type: 'juice'
      });
    }

    // 2. Wall background juice splat
    const blobs = [];
    const blobCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < blobCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 8 + Math.random() * 28;
      blobs.push({
        dx: Math.cos(a) * d,
        dy: Math.sin(a) * d,
        r: 5 + Math.random() * 11
      });
    }

    splats.push({
      x,
      y,
      radius: 20 + Math.random() * 12,
      color: fruitType.splatColor,
      blobs,
      alpha: 0.38,
      life: 4.0
    });

    // Prune splats if too many
    if (splats.length > 25) {
      splats.shift();
    }
  }

  // Bomb detonation particle explosion
  function createBombExplosion(x, y) {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 420;
      const isFire = Math.random() < 0.65;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        radius: isFire ? (3 + Math.random() * 5) : (2 + Math.random() * 3),
        color: isFire ? (Math.random() < 0.5 ? '#ff5722' : '#ffeb3b') : '#374151',
        life: 0.7 + Math.random() * 0.6,
        maxLife: 1.3,
        type: 'spark'
      });
    }
  }

  // Score floating indicator popup
  function addScorePopup(x, y, text, color = '#248a3d') {
    scorePops.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      scale: 1.35,
      life: 0.8
    });
  }

  // --- Slice Action Handler ---
  function sliceObject(obj, sliceAngle = 0) {
    if (obj.dead || state !== 'playing') return;
    obj.dead = true;

    if (obj.isBomb) {
      // Detonate bomb
      createBombExplosion(obj.x, obj.y);
      triggerScreenShake();
      sfx.playBomb();
      endGame(true); // Game over via bomb
      return;
    }

    // Fruit sliced!
    fruitsSlicedCount++;
    const now = elapsed;

    // Check combo: consecutive slices within 0.85s build combo
    if (now - lastSliceTime < 0.85) {
      combo++;
    } else {
      combo = 1;
    }
    lastSliceTime = now;

    if (combo > maxComboCount) {
      maxComboCount = combo;
    }

    // Points calculation: 10 base + combo bonus
    const bonus = combo > 1 ? Math.min(combo - 1, 10) * 10 : 0;
    const earnedPoints = obj.fruitType.score + bonus;
    score += earnedPoints;

    // High score check
    if (score > bestScore) {
      bestScore = score;
      newRecordAchieved = true;
      try {
        localStorage.setItem('juicy_rush_best_score', String(bestScore));
      } catch (e) {}
    }

    // Audio & Visual Effects
    sfx.playSlice(1 + Math.min(combo * 0.05, 0.4));
    if (combo >= 2) {
      sfx.playCombo(combo);
      showComboBanner(combo, earnedPoints);
    }

    createJuiceExplosion(obj.x, obj.y, obj.fruitType);
    splitFruitIntoHalves(obj, sliceAngle);

    const popupText = combo > 1 ? `+${earnedPoints} (${combo}×)` : `+${earnedPoints}`;
    addScorePopup(obj.x, obj.y, popupText, combo > 1 ? '#ff5b45' : '#285842');

    updateHud();
  }

  // Combo UI Banner display
  function showComboBanner(comboVal, pts) {
    comboCountEl.textContent = `${comboVal}×`;
    comboBonusEl.textContent = `+${pts} PTS`;

    if (comboVal >= 5) {
      comboTextEl.textContent = 'JUICY FRENZY!';
    } else if (comboVal >= 4) {
      comboTextEl.textContent = 'MEGA COMBO!';
    } else if (comboVal >= 3) {
      comboTextEl.textContent = 'SUPER COMBO!';
    } else {
      comboTextEl.textContent = 'COMBO!';
    }

    comboBanner.classList.add('visible');
    comboBannerTimer = 0.95;
  }

  // --- Line Segment to Circle Collision Math ---
  function testSegmentCircleHit(p1x, p1y, p2x, p2y, obj) {
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const lenSq = dx * dx + dy * dy;

    // Clamp projection parameter t to segment [0, 1]
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((obj.x - p1x) * dx + (obj.y - p1y) * dy) / lenSq));
    const closestX = p1x + t * dx;
    const closestY = p1y + t * dy;

    const distSq = (closestX - obj.x) ** 2 + (closestY - obj.y) ** 2;
    const hitRadius = obj.radius + 12; // generous blade hitbox
    return distSq <= hitRadius * hitRadius;
  }

  // --- Input & Gesture Handling ---
  function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      time: performance.now()
    };
  }

  let activePointerId = null;

  function handlePointerDown(e) {
    if (state !== 'playing') return;
    // Multi-touch guard: ignore secondary touches to prevent teleporting cut lines
    if (activePointerId !== null && activePointerId !== e.pointerId) return;

    activePointerId = e.pointerId;
    isPointerDown = true;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    const pt = getCanvasCoords(e);
    bladePoints = [pt];

    // Tap directly on fruit
    for (const obj of objects) {
      if (!obj.dead) {
        const dSq = (obj.x - pt.x) ** 2 + (obj.y - pt.y) ** 2;
        if (dSq <= (obj.radius + 10) ** 2) {
          sliceObject(obj, 0);
          break;
        }
      }
    }
  }

  function handlePointerMove(e) {
    if (state !== 'playing' || !isPointerDown) return;
    if (activePointerId !== null && activePointerId !== e.pointerId) return;

    // Guard against mouse moved without button held down
    if (e.pointerType === 'mouse' && e.buttons !== 1) {
      isPointerDown = false;
      activePointerId = null;
      return;
    }

    const pt = getCanvasCoords(e);
    bladePoints.push(pt);

    // Limit trail history length
    if (bladePoints.length > 20) {
      bladePoints.shift();
    }

    // Slice collision check between last two pointer coordinates
    if (bladePoints.length >= 2) {
      const p1 = bladePoints[bladePoints.length - 2];
      const p2 = bladePoints[bladePoints.length - 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);

      // Swish sound when moving fast
      const now = performance.now();
      if (dist > 35 && now - lastSwishTime > 140) {
        sfx.playSwish();
        lastSwishTime = now;
      }

      const sliceAngle = Math.atan2(dy, dx);

      for (const obj of objects) {
        if (!obj.dead) {
          if (testSegmentCircleHit(p1.x, p1.y, p2.x, p2.y, obj)) {
            sliceObject(obj, sliceAngle);
          }
        }
      }
    }
  }

  function handlePointerUp(e) {
    if (activePointerId === null || activePointerId === e.pointerId) {
      isPointerDown = false;
      activePointerId = null;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }
  }

  // Pointer listeners on canvas & window
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('lostpointercapture', () => {
    isPointerDown = false;
    activePointerId = null;
  });
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);

  // Prevent accidental touch scrolling strictly inside the canvas
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // --- Game State Transitions ---
  function startGame() {
    sfx.ensureContext();
    sfx.playClick();

    objects = [];
    slicedHalves = [];
    particles = [];
    scorePops = [];
    bladePoints = [];
    splats = [];

    score = 0;
    timeLeft = ROUND_DURATION;
    elapsed = 0;
    combo = 0;
    lastSliceTime = -100;
    fruitsSlicedCount = 0;
    maxComboCount = 0;
    newRecordAchieved = false;
    spawnTimer = 0.4;
    isPointerDown = false;
    activePointerId = null;

    state = 'playing';
    pauseBtn.disabled = false;
    pauseIcon.classList.remove('hidden');
    playIcon.classList.add('hidden');
    pauseBtn.setAttribute('aria-label', 'Pause game');

    comboBanner.classList.remove('visible');
    secondaryBtn.classList.add('hidden');
    gameOverStats.classList.add('hidden');
    overlay.classList.add('hidden');

    updateHud();
    lastFrameTime = 0;
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    sfx.playClick();

    pauseIcon.classList.add('hidden');
    playIcon.classList.remove('hidden');
    pauseBtn.setAttribute('aria-label', 'Resume game');

    overlayPill.textContent = 'GAME PAUSED';
    overlayTitle.innerHTML = 'Take a <em>Breather.</em>';
    overlayDesc.textContent = 'Your fruits are suspended in mid-air. Jump back in anytime to slice your way to victory.';
    primaryBtnText.textContent = 'RESUME GAME';
    secondaryBtn.classList.remove('hidden');
    gameOverStats.classList.add('hidden');
    overlay.classList.remove('hidden');
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    sfx.playClick();

    pauseIcon.classList.remove('hidden');
    playIcon.classList.add('hidden');
    pauseBtn.setAttribute('aria-label', 'Pause game');

    overlay.classList.add('hidden');
    secondaryBtn.classList.add('hidden');
    lastFrameTime = 0;
  }

  function togglePause() {
    if (state === 'playing') {
      pauseGame();
    } else if (state === 'paused') {
      resumeGame();
    }
  }

  function endGame(hitBomb = false) {
    state = 'gameover';
    pauseBtn.disabled = true;
    comboBanner.classList.remove('visible');

    // High score update
    if (score > bestScore) {
      bestScore = score;
      newRecordAchieved = true;
      try {
        localStorage.setItem('juicy_rush_best_score', String(bestScore));
      } catch (e) {}
    }
    updateHud();

    // Sound effect
    if (hitBomb) {
      // Bomb sound already played
    } else if (newRecordAchieved && score > 0) {
      sfx.playFanfare();
    } else {
      sfx.playGameOver();
    }

    // Modal texts
    overlayPill.textContent = hitBomb ? 'BOMB DETONATED!' : "TIME'S UP!";
    overlayTitle.innerHTML = hitBomb ? 'Boom! <em>Game Over.</em>' : 'Sweet Run! <em>Well Done.</em>';
    overlayDesc.textContent = hitBomb
      ? `You struck a hazardous bomb! You managed to slice ${fruitsSlicedCount} fruits for ${score} points.`
      : `The 60-second timer reached zero. You scored ${score} points with a max combo of ${maxComboCount}×!`;

    // Populate post-game stats
    statFruits.textContent = String(fruitsSlicedCount);
    statCombo.textContent = `${maxComboCount}×`;

    if (newRecordAchieved && score > 0) {
      statRecord.textContent = 'NEW BEST! 🏆';
      statRecordPill.classList.add('highlight-pill');
    } else {
      statRecord.textContent = `${bestScore} PTS`;
      statRecordPill.classList.remove('highlight-pill');
    }

    gameOverStats.classList.remove('hidden');
    primaryBtnText.textContent = 'PLAY AGAIN';
    secondaryBtn.classList.add('hidden');
    overlay.classList.remove('hidden');
  }

  // --- Button Listeners ---
  primaryBtn.addEventListener('click', () => {
    if (state === 'paused') {
      resumeGame();
    } else {
      startGame();
    }
  });

  secondaryBtn.addEventListener('click', () => {
    startGame();
  });

  pauseBtn.addEventListener('click', togglePause);

  restartBtn.addEventListener('click', () => {
    sfx.playClick();
    startGame();
  });

  // --- Keyboard Controls ---
  document.addEventListener('keydown', (e) => {
    // Avoid interfering with inputs if any
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;

    if (e.code === 'Space' || e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      startGame();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      sfx.toggleMute();
      updateSoundUI();
      if (!sfx.muted) sfx.playClick();
    } else if (e.code === 'Enter') {
      if (state === 'start' || state === 'gameover') {
        e.preventDefault();
        startGame();
      } else if (state === 'paused') {
        e.preventDefault();
        resumeGame();
      }
    }
  });

  // --- Tab Visibility Change Handling ---
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') {
      pauseGame();
    }
  });

  // --- Main Drawing & Render Routine ---
  function render(time) {
    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw Background Juice Splats
    for (const splat of splats) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, splat.alpha);
      ctx.fillStyle = splat.color;

      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
      ctx.fill();

      for (const b of splat.blobs) {
        ctx.beginPath();
        ctx.arc(splat.x + b.dx, splat.y + b.dy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Sliced Fruit Halves
    for (const half of slicedHalves) {
      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);
      ctx.globalAlpha = Math.min(1, half.life * 1.5);

      // Clip half region strictly above the cut diameter line (y <= 0)
      ctx.beginPath();
      ctx.rect(-half.radius * 1.6, -half.radius * 1.6, half.radius * 3.2, half.radius * 1.6);
      ctx.clip();

      // Render fruit rind and outer structure
      half.fruitType.drawWhole(ctx, half.radius);

      // Render inner cut face details strictly inside this half
      half.fruitType.drawCutFace(ctx, half.radius);

      ctx.restore();

      // Draw clean cut edge line along the diameter cut (y = 0)
      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);
      ctx.globalAlpha = Math.min(1, half.life * 1.5);
      ctx.strokeStyle = half.fruitType.splashColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-half.radius, 0);
      ctx.lineTo(half.radius, 0);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Active Whole Fruits & Bombs
    for (const obj of objects) {
      if (obj.dead) continue;
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);

      if (obj.isBomb) {
        drawBomb(ctx, obj.radius, time * 0.001);
      } else {
        // Shadow underneath
        ctx.shadowColor = 'rgba(35, 60, 48, 0.18)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 8;
        obj.fruitType.drawWhole(ctx, obj.radius);
      }
      ctx.restore();
    }

    // 4. Draw Juice Droplets & Bomb Spark Particles
    for (const p of particles) {
      ctx.save();
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'juice') {
        // Motion-stretched droplet
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
        ctx.stroke();
      } else {
        // Star/circle spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Draw Blade Swipe Trail
    if (bladePoints.length > 1) {
      const now = performance.now();
      // Outer neon glow stroke
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < bladePoints.length; i++) {
        const p1 = bladePoints[i - 1];
        const p2 = bladePoints[i];
        const age = (now - p2.time) / 1000;
        const alpha = Math.max(0, 1 - age / 0.18);
        const width = 2 + (i / bladePoints.length) * 8;

        // Glowing blade outer
        ctx.strokeStyle = `rgba(255, 91, 69, ${alpha * 0.75})`;
        ctx.lineWidth = width * 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // White hot inner core
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = Math.max(1.5, width * 0.55);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Draw Floating Score Text Popups
    for (const pop of scorePops) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.font = `900 ${Math.round(20 * pop.scale)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(pop.text, pop.x, pop.y);

      // Fill
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }
  }

  // --- Frame-Rate Independent Physics Update Loop ---
  function update(dt) {
    if (state !== 'playing') return;

    elapsed += dt;
    timeLeft = Math.max(0, ROUND_DURATION - elapsed);

    // Spawner countdown
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnWave();
    }

    // Gravity constant
    const GRAVITY = 780; // px/s^2

    // Update active fruits & bombs
    for (const obj of objects) {
      obj.vy += GRAVITY * dt;
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.rotation += obj.spin * dt;
    }

    // Remove objects that have fallen well below bottom or drifted off sides
    objects = objects.filter(o => !o.dead && o.y < canvasH + o.radius + 100 && o.x > -100 && o.x < canvasW + 100);

    // Update sliced halves
    for (const half of slicedHalves) {
      half.vy += GRAVITY * 0.95 * dt;
      half.x += half.vx * dt;
      half.y += half.vy * dt;
      half.rotation += half.spin * dt;
      half.life -= dt;
    }
    slicedHalves = slicedHalves.filter(h => h.life > 0 && h.y < canvasH + 150);

    // Update particles
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * 0.65 * dt;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);

    // Update background splats
    for (const s of splats) {
      s.life -= dt;
      s.alpha -= dt * 0.085;
    }
    splats = splats.filter(s => s.life > 0 && s.alpha > 0);

    // Update score popups
    for (const pop of scorePops) {
      pop.y -= 55 * dt;
      pop.life -= dt;
      pop.alpha = Math.max(0, pop.life / 0.8);
      pop.scale = Math.max(1.0, pop.scale - dt * 0.5);
    }
    scorePops = scorePops.filter(p => p.life > 0);

    // Prune stale blade trail points
    const now = performance.now();
    bladePoints = bladePoints.filter(p => (now - p.time) / 1000 <= 0.18);

    // Combo banner timeout
    if (comboBannerTimer > 0) {
      comboBannerTimer -= dt;
      if (comboBannerTimer <= 0) {
        comboBanner.classList.remove('visible');
      }
    }

    updateHud();

    // Check time limit
    if (timeLeft <= 0) {
      endGame(false);
    }
  }

  // --- Main Animation Frame Loop ---
  function gameLoop(timestamp) {
    if (!lastFrameTime || timestamp < lastFrameTime) {
      lastFrameTime = timestamp;
    }
    const dt = Math.max(0, Math.min((timestamp - lastFrameTime) / 1000, 0.05));
    lastFrameTime = timestamp;

    update(dt);
    render(timestamp);

    animFrameId = requestAnimationFrame(gameLoop);
  }

  // Start the render loop
  animFrameId = requestAnimationFrame(gameLoop);

})();
