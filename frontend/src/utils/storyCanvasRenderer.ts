// ========================================================
// ROYAL POSTAL GUILD - SOCIAL STORY TEASER CANVAS ENGINE
// 9:16 High-Resolution Canvas Renderer (1080 x 1920)
// ========================================================

export interface StoryTeaserConfig {
  theme: 'midnight' | 'candlelight' | 'burgundy' | 'ocean' | 'emerald';
  recipientName: string;
  senderName: string;
  mysteryClue: string;
  targetDate: Date | string | number;
  sealColor: string; // Hex color code
  sealIcon: string; // 'fleur' | 'crown' | 'quill' | 'eagle' | 'hourglass' | 'heart' | 'sword'
  includeQr: boolean;
  qrDataUrl?: string;
  appWatermark: string;
  soundEnabled: boolean;
  isAnonymousSender?: boolean;
  isAnonymousRecipient?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
  color: string;
}

// Generate realistic particle systems for background
export function createStoryParticles(count: number = 45): Particle[] {
  const particles: Particle[] = [];
  const colors = [
    'rgba(63, 169, 122, ', // Emerald
    'rgba(168, 230, 200, ', // Pale mint
    'rgba(255, 255, 255, ', // Starlight
    'rgba(52, 160, 110, ', // Deep emerald
    'rgba(92, 191, 143, '   // Mid emerald
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * 1080,
      y: Math.random() * 1920,
      size: 1.5 + Math.random() * 3.5,
      speedY: -0.3 - Math.random() * 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: 0.2 + Math.random() * 0.7,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  return particles;
}

// Update particle positions
export function updateStoryParticles(particles: Particle[], width: number = 1080, height: number = 1920) {
  for (const p of particles) {
    p.y += p.speedY;
    p.x += p.speedX;
    p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

    if (p.opacity < 0.1) p.opacity = 0.1;
    if (p.opacity > 0.9) p.opacity = 0.9;

    if (p.y < -10) {
      p.y = height + 10;
      p.x = Math.random() * width;
    }
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
  }
}

// Calculate remaining countdown time accurately with (diff % 3600000) / 60000
export function calculateStoryCountdown(targetDate: Date | string | number, currentTime: number = Date.now()) {
  const target = typeof targetDate === 'number' ? targetDate : new Date(targetDate).getTime();
  const diff = Math.max(0, target - currentTime);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    isUnlocked: diff <= 0,
    totalSeconds: Math.floor(diff / 1000)
  };
}

// Convert Date object/timestamp to local datetime input string (YYYY-MM-DDTHH:mm) without UTC skew
export function formatLocalDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Main Render Function for 1080 x 1920 Story Canvas
export function renderStoryFrame(
  ctx: CanvasRenderingContext2D,
  config: StoryTeaserConfig,
  particles: Particle[],
  frameTime: number = Date.now(),
  qrImageElement?: HTMLImageElement | null
) {
  const W = 1080;
  const H = 1920;

  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 1. Draw Background Theme
  drawStoryBackground(ctx, config.theme, W, H, frameTime);

  // 2. Draw Ambient Particle Dust
  drawStoryParticles(ctx, particles);

  // 3. Draw Royal Ornate Corner Filigrees & Gilded Borders
  drawRoyalBorder(ctx, W, H, frameTime);

  // 4. Header: Royal Postal Guild & Decree Crest
  drawHeaderBanner(ctx, W, H, frameTime);

  // 5. Missive Recipient & Sender Announcement
  drawMissiveHeaderInfo(ctx, config, W, H);

  // 6. 3D Sealed Parchment Envelope & Wax Seal with Light Glint
  drawSealedEnvelope(ctx, config, W, H, frameTime);

  // 7. Live Medieval Countdown Clock
  drawCountdownTimer(ctx, config.targetDate, W, H, frameTime);

  // 8. Mystery Clue Box (if provided)
  if (config.mysteryClue && config.mysteryClue.trim().length > 0) {
    drawMysteryClue(ctx, config.mysteryClue, W, H);
  }

  // 9. QR Code Sticker & Tracking Pill
  if (config.includeQr && qrImageElement) {
    drawQrSticker(ctx, qrImageElement, W, H);
  }

  // 10. Footer Guild Seal / Watermark
  drawFooterWatermark(ctx, config.appWatermark, W, H);

  ctx.restore();
}

// ----------------------------------------------------
// THEME BACKGROUNDS
// ----------------------------------------------------
function drawStoryBackground(
  ctx: CanvasRenderingContext2D,
  theme: StoryTeaserConfig['theme'],
  W: number,
  H: number,
  frameTime: number
) {
  const timeSec = frameTime * 0.001;

  if (theme === 'midnight') {
    // Dark deep celestial navy/obsidian
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, 1100);
    grad.addColorStop(0, '#1a1f38');
    grad.addColorStop(0.4, '#0d1124');
    grad.addColorStop(0.8, '#060813');
    grad.addColorStop(1, '#020308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle celestial stars
    drawTwinklingStars(ctx, timeSec);
  } else if (theme === 'candlelight') {
    // Warm chamber amber / mahogany
    const grad = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H / 2, 1000);
    grad.addColorStop(0, '#3d1d0c');
    grad.addColorStop(0.45, '#241006');
    grad.addColorStop(0.8, '#140803');
    grad.addColorStop(1, '#080301');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Warm candlelight pulse
    const flicker = Math.sin(timeSec * 4) * 0.03 + Math.cos(timeSec * 7) * 0.02;
    const lightGlow = ctx.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.42, 550);
    lightGlow.addColorStop(0, `rgba(255, 170, 50, ${0.18 + flicker})`);
    lightGlow.addColorStop(0.5, `rgba(33, 133, 90, ${0.08 + flicker})`);
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, W, H);
  } else if (theme === 'burgundy') {
    // Imperial royal crimson & wine velvet
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, 1100);
    grad.addColorStop(0, '#380a14');
    grad.addColorStop(0.45, '#22040b');
    grad.addColorStop(0.85, '#120206');
    grad.addColorStop(1, '#060002');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (theme === 'ocean') {
    // Deep nautical abyssal sapphire
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, 1100);
    grad.addColorStop(0, '#0f2b46');
    grad.addColorStop(0.45, '#081726');
    grad.addColorStop(0.85, '#040b13');
    grad.addColorStop(1, '#020508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Oceanic shimmer
    drawOceanicShimmer(ctx, W, H, timeSec);
  } else if (theme === 'emerald') {
    // Ancient elven emerald & obsidian
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, 1100);
    grad.addColorStop(0, '#0b2918');
    grad.addColorStop(0.45, '#05170d');
    grad.addColorStop(0.85, '#020d07');
    grad.addColorStop(1, '#010502');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Vignette overlay for rich contrast
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.45, W / 2, H / 2, W * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function drawTwinklingStars(ctx: CanvasRenderingContext2D, timeSec: number) {
  const seedStars = [
    { x: 150, y: 220, s: 2, phase: 0 },
    { x: 920, y: 180, s: 2.5, phase: 1.2 },
    { x: 280, y: 450, s: 1.5, phase: 2.5 },
    { x: 830, y: 520, s: 2, phase: 3.1 },
    { x: 120, y: 1400, s: 2, phase: 4.0 },
    { x: 940, y: 1460, s: 2.5, phase: 1.8 },
    { x: 220, y: 1720, s: 1.8, phase: 2.9 },
    { x: 880, y: 1680, s: 2.2, phase: 0.5 },
  ];

  for (const s of seedStars) {
    const twinkle = Math.sin(timeSec * 3 + s.phase) * 0.4 + 0.6;
    ctx.save();
    ctx.fillStyle = `rgba(255, 230, 160, ${twinkle * 0.8})`;
    ctx.shadowColor = '#3FA97A';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
    ctx.fill();

    // Cross sparkle
    if (twinkle > 0.8) {
      ctx.strokeStyle = `rgba(255, 240, 190, ${twinkle * 0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 6, s.y);
      ctx.lineTo(s.x + 6, s.y);
      ctx.moveTo(s.x, s.y - 6);
      ctx.lineTo(s.x, s.y + 6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawOceanicShimmer(ctx: CanvasRenderingContext2D, W: number, H: number, timeSec: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
  ctx.lineWidth = 2;
  for (let y = 150; y < H; y += 300) {
    ctx.beginPath();
    for (let x = 0; x < W; x += 20) {
      const wave = Math.sin(x * 0.015 + timeSec * 1.5 + y) * 15;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ----------------------------------------------------
// PARTICLES
// ----------------------------------------------------
function drawStoryParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    ctx.fillStyle = `${p.color}${p.opacity})`;
    ctx.shadowColor = '#4FD1A0';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------
// GILDED BORDERS & CORNER FILIGREES
// ----------------------------------------------------
function drawRoyalBorder(ctx: CanvasRenderingContext2D, W: number, H: number, _frameTime: number) {
  const margin = 50;
  const innerMargin = 64;

  ctx.save();
  // Outer fine gold border
  ctx.strokeStyle = 'rgba(63, 169, 122, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);

  // Inner decorative border
  ctx.strokeStyle = 'rgba(63, 169, 122, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2);

  // Corner Ornaments
  const corners = [
    { x: innerMargin, y: innerMargin, rot: 0 },
    { x: W - innerMargin, y: innerMargin, rot: 90 },
    { x: W - innerMargin, y: H - innerMargin, rot: 180 },
    { x: innerMargin, y: H - innerMargin, rot: 270 }
  ];

  for (const c of corners) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((c.rot * Math.PI) / 180);

    // Gilded corner bracket
    ctx.strokeStyle = '#3FA97A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.lineTo(0, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    // Corner dot
    ctx.fillStyle = '#A8E6C8';
    ctx.beginPath();
    ctx.arc(14, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

// ----------------------------------------------------
// HEADER BANNER
// ----------------------------------------------------
function drawHeaderBanner(ctx: CanvasRenderingContext2D, W: number, _H: number, _frameTime: number) {
  ctx.save();

  // Guild Crest Emblem Top
  const crestY = 160;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glowing crown icon
  ctx.font = '40px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.shadowColor = '#3FA97A';
  ctx.shadowBlur = 15;
  ctx.fillText('👑', W / 2, crestY - 20);

  // Main Header Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#3FA97A';
  ctx.font = '600 24px "Cinzel", Georgia, serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('THE ROYAL POSTAL GUILD', W / 2, crestY + 32);

  // Subtitle Ribbon
  ctx.fillStyle = 'rgba(245, 235, 215, 0.7)';
  ctx.font = 'italic 18px "Fondamento", "Cinzel", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('— OFFICIAL SEALED DECREE & MISSIVE —', W / 2, crestY + 68);

  // Gold divider line with center diamond
  const lineY = crestY + 95;
  const lineW = 320;
  const gradLine = ctx.createLinearGradient(W / 2 - lineW / 2, lineY, W / 2 + lineW / 2, lineY);
  gradLine.addColorStop(0, 'rgba(63, 169, 122, 0)');
  gradLine.addColorStop(0.5, 'rgba(63, 169, 122, 0.9)');
  gradLine.addColorStop(1, 'rgba(63, 169, 122, 0)');
  ctx.strokeStyle = gradLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lineW / 2, lineY);
  ctx.lineTo(W / 2 + lineW / 2, lineY);
  ctx.stroke();

  // Diamond
  ctx.fillStyle = '#A8E6C8';
  ctx.beginPath();
  ctx.moveTo(W / 2, lineY - 4);
  ctx.lineTo(W / 2 + 4, lineY);
  ctx.lineTo(W / 2, lineY + 4);
  ctx.lineTo(W / 2 - 4, lineY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ----------------------------------------------------
// MISSIVE INFO: RECIPIENT & SENDER
// ----------------------------------------------------
function drawMissiveHeaderInfo(ctx: CanvasRenderingContext2D, config: StoryTeaserConfig, W: number, _H: number) {
  ctx.save();
  ctx.textAlign = 'center';
  const startY = 320;

  // "FOR THE EYES OF"
  ctx.fillStyle = '#C5A059';
  ctx.font = '600 16px "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('A MISSIVE CHARTERED FOR', W / 2, startY);

  // Recipient Name
  const recipient = config.isAnonymousRecipient || !config.recipientName.trim()
    ? 'Someone Special'
    : config.recipientName.trim();

  ctx.fillStyle = '#FFF8E7';
  ctx.font = 'bold 36px "Cinzel Decorative", "Cinzel", Georgia, serif';
  ctx.shadowColor = '#3FA97A';
  ctx.shadowBlur = 12;
  ctx.letterSpacing = '2px';
  ctx.fillText(recipient, W / 2, startY + 48);

  // Sender / Postman Attribution (Delivered By)
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#A8E6C8';
  ctx.font = 'italic 26px "Great Vibes", "Alex Brush", "Dancing Script", cursive, serif';
  ctx.letterSpacing = '1px';

  const sender = config.isAnonymousSender || !config.senderName.trim()
    ? 'An Anonymous Scribe'
    : config.senderName.trim();
  ctx.fillText(`Dispatched & Delivered by: ${sender}`, W / 2, startY + 96);

  ctx.restore();
}

// ----------------------------------------------------
// 3D SEALED ENVELOPE WITH REALISTIC WAX SEAL
// ----------------------------------------------------
function drawSealedEnvelope(
  ctx: CanvasRenderingContext2D,
  config: StoryTeaserConfig,
  W: number,
  _H: number,
  frameTime: number
) {
  ctx.save();

  const envW = 620;
  const envH = 390;
  const envX = (W - envW) / 2;
  const envY = 480;
  const flapH = 200;

  // Envelope Drop Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 20;

  // Main Envelope Body (Parchment Paper)
  const envGrad = ctx.createLinearGradient(envX, envY, envX, envY + envH);
  envGrad.addColorStop(0, '#E8D3B3');
  envGrad.addColorStop(0.5, '#DEC09A');
  envGrad.addColorStop(1, '#CDB087');
  ctx.fillStyle = envGrad;

  // Rounded Envelope Rect
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(envX + r, envY);
  ctx.lineTo(envX + envW - r, envY);
  ctx.quadraticCurveTo(envX + envW, envY, envX + envW, envY + r);
  ctx.lineTo(envX + envW, envY + envH - r);
  ctx.quadraticCurveTo(envX + envW, envY + envH, envX + envW - r, envY + envH);
  ctx.lineTo(envX + r, envY + envH);
  ctx.quadraticCurveTo(envX, envY + envH, envX, envY + envH - r);
  ctx.lineTo(envX, envY + r);
  ctx.quadraticCurveTo(envX, envY, envX + r, envY);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtle paper texture / noise line grain
  ctx.strokeStyle = 'rgba(120, 80, 40, 0.1)';
  ctx.lineWidth = 1;
  for (let i = envY + 25; i < envY + envH; i += 22) {
    ctx.beginPath();
    ctx.moveTo(envX + 15, i);
    ctx.lineTo(envX + envW - 15, i);
    ctx.stroke();
  }

  // Envelope Crease Lines (Diagonal Side Flaps)
  ctx.strokeStyle = 'rgba(100, 60, 20, 0.25)';
  ctx.lineWidth = 1.5;

  // Left fold
  ctx.beginPath();
  ctx.moveTo(envX, envY + envH);
  ctx.lineTo(envX + envW / 2 - 20, envY + envH / 2 + 30);
  ctx.stroke();

  // Right fold
  ctx.beginPath();
  ctx.moveTo(envX + envW, envY + envH);
  ctx.lineTo(envX + envW / 2 + 20, envY + envH / 2 + 30);
  ctx.stroke();

  // Bottom Fold
  ctx.beginPath();
  ctx.moveTo(envX + 40, envY + envH);
  ctx.lineTo(envX + envW / 2, envY + envH / 2 + 65);
  ctx.lineTo(envX + envW - 40, envY + envH);
  ctx.stroke();

  // TOP TRIANGULAR FLAP (Folded Down)
  const flapGrad = ctx.createLinearGradient(envX, envY, envX, envY + flapH);
  flapGrad.addColorStop(0, '#EFE0C9');
  flapGrad.addColorStop(0.7, '#DFCAA7');
  flapGrad.addColorStop(1, '#CEB38B');

  // Flap drop shadow onto lower envelope
  ctx.save();
  ctx.shadowColor = 'rgba(40, 20, 5, 0.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = flapGrad;

  ctx.beginPath();
  ctx.moveTo(envX + r, envY);
  ctx.lineTo(envX + envW - r, envY);
  ctx.lineTo(envX + envW / 2, envY + flapH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Flap Gold Filigree Border
  ctx.strokeStyle = 'rgba(63, 169, 122, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(envX + 25, envY + 6);
  ctx.lineTo(envX + envW - 25, envY + 6);
  ctx.lineTo(envX + envW / 2, envY + flapH - 12);
  ctx.closePath();
  ctx.stroke();

  // Golden Postage Ribbon / Cord Wrap
  ctx.save();
  const ribbonY = envY + flapH - 20;
  const ribbonGrad = ctx.createLinearGradient(envX, ribbonY, envX + envW, ribbonY);
  ribbonGrad.addColorStop(0, 'rgba(63, 169, 122, 0.2)');
  ribbonGrad.addColorStop(0.5, 'rgba(63, 169, 122, 0.85)');
  ribbonGrad.addColorStop(1, 'rgba(63, 169, 122, 0.2)');
  ctx.strokeStyle = ribbonGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(envX + 10, ribbonY);
  ctx.lineTo(envX + envW - 10, ribbonY);
  ctx.stroke();
  ctx.restore();

  // --------------------------------------------
  // OPULENT 3D WAX SEAL STAMP
  // --------------------------------------------
  const sealCenterX = envX + envW / 2;
  const sealCenterY = envY + flapH - 10;
  const sealRadius = 56;

  draw3DWaxSeal(ctx, sealCenterX, sealCenterY, sealRadius, config.sealColor, config.sealIcon, frameTime);

  ctx.restore();
}

function draw3DWaxSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  baseColor: string,
  icon: string,
  frameTime: number
) {
  ctx.save();
  const timeSec = frameTime * 0.001;

  // Seal shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;

  // Irregular Organic Wax Edge
  ctx.beginPath();
  const bumps = 18;
  for (let i = 0; i <= bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2;
    // Organic wobble
    const offset = Math.sin(angle * 5) * 3 + Math.cos(angle * 7) * 2;
    const currR = r + offset;
    const px = x + Math.cos(angle) * currR;
    const py = y + Math.sin(angle) * currR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Wax base gradient
  const waxGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 5, x, y, r * 1.2);
  waxGrad.addColorStop(0, lightenHex(baseColor, 40));
  waxGrad.addColorStop(0.3, baseColor);
  waxGrad.addColorStop(0.8, darkenHex(baseColor, 35));
  waxGrad.addColorStop(1, darkenHex(baseColor, 60));
  ctx.fillStyle = waxGrad;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Inner Stamp Bevel / Rim
  ctx.beginPath();
  ctx.arc(x, y, r * 0.76, 0, Math.PI * 2);
  ctx.strokeStyle = darkenHex(baseColor, 45);
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = lightenHex(baseColor, 30);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner Concave Field
  const innerGrad = ctx.createRadialGradient(x + r * 0.2, y + r * 0.2, 2, x, y, r * 0.75);
  innerGrad.addColorStop(0, darkenHex(baseColor, 30));
  innerGrad.addColorStop(1, darkenHex(baseColor, 10));
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Stamped Emblem in Relief
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = lightenHex(baseColor, 50);
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = -1;

  ctx.font = 'bold 36px "Apple Color Emoji", "Segoe UI Emoji", serif';
  ctx.fillStyle = lightenHex(baseColor, 60);

  const iconEmoji = getSealIconEmoji(icon);
  ctx.fillText(iconEmoji, x, y + 2);
  ctx.restore();

  // Dynamic Shimmering Light Glint across seal (moves every few seconds)
  const glintPos = (timeSec * 0.6) % 3; // cycles 0 -> 3
  if (glintPos < 1.2) {
    const glintX = x - r + glintPos * (r * 2);
    const glintGrad = ctx.createLinearGradient(glintX - 25, y - r, glintX + 25, y + r);
    glintGrad.addColorStop(0, 'rgba(255,255,255,0)');
    glintGrad.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    glintGrad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = glintGrad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  ctx.restore();
}

function getSealIconEmoji(icon: string): string {
  switch (icon) {
    case 'fleur': return '⚜️';
    case 'crown': return '👑';
    case 'quill': return '🪶';
    case 'eagle': return '🦅';
    case 'hourglass': return '⌛';
    case 'heart': return '💌';
    case 'sword': return '⚔️';
    default: return '⚜️';
  }
}

// ----------------------------------------------------
// LIVE MEDIEVAL COUNTDOWN CLOCK
// ----------------------------------------------------
function drawCountdownTimer(
  ctx: CanvasRenderingContext2D,
  targetDate: Date | string | number,
  W: number,
  _H: number,
  frameTime: number
) {
  ctx.save();
  const countdown = calculateStoryCountdown(targetDate, frameTime);
  const startY = 960;

  // Title: "CONFIDENTIAL MISSIVE UNLOCKS IN"
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3FA97A';
  ctx.font = '600 20px "Cinzel", serif';
  ctx.letterSpacing = '6px';
  ctx.fillText(countdown.isUnlocked ? 'MISSIVE UNLOCKED & READY' : 'MISSIVE UNLOCKS / ARRIVES IN', W / 2, startY);

  // Time Units Row
  const units = [
    { value: countdown.days, label: 'DAYS' },
    { value: countdown.hours, label: 'HOURS' },
    { value: countdown.minutes, label: 'MINUTES' },
    { value: countdown.seconds, label: 'SECONDS' }
  ];

  const boxW = 160;
  const boxH = 150;
  const gap = 24;
  const totalW = units.length * boxW + (units.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const boxY = startY + 36;

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const curX = startX + i * (boxW + gap);

    // Box Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Glowing Box Background
    const boxGrad = ctx.createLinearGradient(curX, boxY, curX, boxY + boxH);
    boxGrad.addColorStop(0, 'rgba(38, 25, 14, 0.88)');
    boxGrad.addColorStop(0.5, 'rgba(20, 12, 6, 0.94)');
    boxGrad.addColorStop(1, 'rgba(10, 5, 2, 0.98)');
    ctx.fillStyle = boxGrad;

    // Rounded Box
    const br = 14;
    ctx.beginPath();
    ctx.moveTo(curX + br, boxY);
    ctx.lineTo(curX + boxW - br, boxY);
    ctx.quadraticCurveTo(curX + boxW, boxY, curX + boxW, boxY + br);
    ctx.lineTo(curX + boxW, boxY + boxH - br);
    ctx.quadraticCurveTo(curX + boxW, boxY + boxH, curX + boxW - br, boxY + boxH);
    ctx.lineTo(curX + br, boxY + boxH);
    ctx.quadraticCurveTo(curX, boxY + boxH, curX, boxY + boxH - br);
    ctx.lineTo(curX, boxY + br);
    ctx.quadraticCurveTo(curX, boxY, curX + br, boxY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Gold Beveled Border
    ctx.strokeStyle = 'rgba(63, 169, 122, 0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center horizontal flip divider line
    ctx.strokeStyle = 'rgba(63, 169, 122, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curX + 6, boxY + boxH / 2 - 10);
    ctx.lineTo(curX + boxW - 6, boxY + boxH / 2 - 10);
    ctx.stroke();

    // Numerical Digit
    ctx.fillStyle = '#FFF8E7';
    ctx.font = 'bold 56px "Cinzel Decorative", "Cinzel", "Special Elite", monospace';
    ctx.shadowColor = '#3FA97A';
    ctx.shadowBlur = 8;
    ctx.fillText(u.value, curX + boxW / 2, boxY + 68);

    // Unit Sublabel
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(63, 169, 122, 0.85)';
    ctx.font = '600 13px "Cinzel", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(u.label, curX + boxW / 2, boxY + 124);

    // Colon Separator between boxes (except last)
    if (i < units.length - 1) {
      ctx.fillStyle = 'rgba(63, 169, 122, 0.7)';
      ctx.font = 'bold 36px "Cinzel", serif';
      ctx.fillText(':', curX + boxW + gap / 2, boxY + 64);
    }
  }

  ctx.restore();
}

// ----------------------------------------------------
// MYSTERY TEASER CLUE
// ----------------------------------------------------
function drawMysteryClue(ctx: CanvasRenderingContext2D, clue: string, W: number, _H: number) {
  ctx.save();
  const clueY = 1200;
  const clueW = 760;
  const clueX = (W - clueW) / 2;

  // Clue Scroll Box
  ctx.fillStyle = 'rgba(26, 17, 9, 0.75)';
  ctx.strokeStyle = 'rgba(63, 169, 122, 0.4)';
  ctx.lineWidth = 1.5;

  const cr = 12;
  ctx.beginPath();
  ctx.moveTo(clueX + cr, clueY);
  ctx.lineTo(clueX + clueW - cr, clueY);
  ctx.quadraticCurveTo(clueX + clueW, clueY, clueX + clueW, clueY + cr);
  ctx.lineTo(clueX + clueW, clueY + 95 - cr);
  ctx.quadraticCurveTo(clueX + clueW, clueY + 95, clueX + clueW - cr, clueY + 95);
  ctx.lineTo(clueX + cr, clueY + 95);
  ctx.quadraticCurveTo(clueX, clueY + 95, clueX, clueY + 95 - cr);
  ctx.lineTo(clueX, clueY + cr);
  ctx.quadraticCurveTo(clueX, clueY, clueX + cr, clueY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scroll Icon & Label
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3FA97A';
  ctx.font = '600 14px "Cinzel", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('📜 SEALED CLUE / HINT', W / 2, clueY + 28);

  // Clue Text
  ctx.fillStyle = '#FFF8E7';
  ctx.font = 'italic 21px "Marck Script", "Dancing Script", "Caveat", cursive, serif';
  ctx.letterSpacing = '1px';

  // Truncate if too long
  const maxChars = 65;
  const displayText = clue.length > maxChars ? clue.slice(0, maxChars) + '...' : clue;
  ctx.fillText(`“${displayText}”`, W / 2, clueY + 65);

  ctx.restore();
}

// ----------------------------------------------------
// QR CODE STICKER & TRACKING PILL
// ----------------------------------------------------
function drawQrSticker(
  ctx: CanvasRenderingContext2D,
  qrImage: HTMLImageElement,
  W: number,
  _H: number
) {
  ctx.save();
  const stickerY = 1360;
  const size = 180;
  const qrX = (W - size) / 2;

  // Glowing white/gold backing card for QR
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#FAF0E6';
  ctx.strokeStyle = '#3FA97A';
  ctx.lineWidth = 3;

  const r = 16;
  ctx.beginPath();
  ctx.moveTo(qrX - 16 + r, stickerY - 16);
  ctx.lineTo(qrX + size + 16 - r, stickerY - 16);
  ctx.quadraticCurveTo(qrX + size + 16, stickerY - 16, qrX + size + 16, stickerY - 16 + r);
  ctx.lineTo(qrX + size + 16, stickerY + size + 16 - r);
  ctx.quadraticCurveTo(qrX + size + 16, stickerY + size + 16, qrX + size + 16 - r, stickerY + size + 16);
  ctx.lineTo(qrX - 16 + r, stickerY + size + 16);
  ctx.quadraticCurveTo(qrX - 16, stickerY + size + 16, qrX - 16, stickerY + size + 16 - r);
  ctx.lineTo(qrX - 16, stickerY - 16 + r);
  ctx.quadraticCurveTo(qrX - 16, stickerY - 16, qrX - 16 + r, stickerY - 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw QR Image
  try {
    ctx.drawImage(qrImage, qrX, stickerY, size, size);
  } catch (e) {
    // Fallback if image not ready
  }

  // Tracking Pill Below QR
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A8E6C8';
  ctx.font = '600 15px "Cinzel", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('📷 SCAN TO UNLOCK & TRACK COURIER', W / 2, stickerY + size + 52);

  ctx.restore();
}

// ----------------------------------------------------
// FOOTER WATERMARK & GUILD SEAL
// ----------------------------------------------------
function drawFooterWatermark(ctx: CanvasRenderingContext2D, watermark: string, W: number, _H: number) {
  ctx.save();
  const footerY = 1780;
  ctx.textAlign = 'center';

  // Royal Story Interactive Prompt
  ctx.fillStyle = 'rgba(255, 240, 200, 0.7)';
  ctx.font = 'italic 16px "Fondamento", serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('✨ Repost to Story • Tag thy Postman • Keep the Mystery ✨', W / 2, footerY - 24);

  // App Link / Brand
  ctx.fillStyle = '#3FA97A';
  ctx.font = '600 18px "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText(watermark.toUpperCase(), W / 2, footerY + 12);

  ctx.restore();
}

// ----------------------------------------------------
// COLOR UTILITIES
// ----------------------------------------------------
function lightenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `rgb(${R}, ${G}, ${B})`;
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `rgb(${R}, ${G}, ${B})`;
}
