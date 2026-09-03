import { useRef, useState, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { 
  Eraser, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Feather, 
  FileText
} from 'lucide-react';
import { waxSealAudio } from '../utils/waxSealAudio';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface HandwrittenPageData {
  pageNumber: number;
  imageData: string;
  strokesData?: string;
  inkColor?: string;
  parchmentPaper?: string;
}

export const INK_PALETTES = [
  { id: 'iron-gall', label: 'Iron Gall Black', color: '#1A1816', preview: '#1A1816' },
  { id: 'royal-sepia', label: 'Walnut Sepia', color: '#3E2723', preview: '#3E2723' },
  { id: 'midnight-indigo', label: 'Midnight Indigo', color: '#1A2536', preview: '#1A2536' },
  { id: 'burgundy-wine', label: 'Burgundy Velvet', color: '#4A121E', preview: '#4A121E' },
  { id: 'forest-emerald', label: 'Forest Emerald', color: '#0A3828', preview: '#0A3828' },
];

export const PARCHMENT_TEXTURES = [
  { id: 'vintage-cream', label: 'Vintage Cream Vellum', bg: '#FDFBF7' },
  { id: 'lined-ledger', label: 'Ruled Ledger Sheet', bg: '#FAF6EA', isLined: true },
  { id: 'aged-vellum', label: 'Aged Antique Vellum', bg: '#F3EAD5' },
  { id: 'royal-parchment', label: 'Royal Court Stationery', bg: '#FCF7E6' },
];

export const PEN_SIZES = [
  { id: 'fine', label: 'Fine Quill', size: 2.0, icon: '🪶' },
  { id: 'medium', label: 'Standard Nib', size: 3.8, icon: '✒️' },
  { id: 'broad', label: 'Broad Feather', size: 6.5, icon: '📜' },
];

interface HandwritingCanvasProps {
  initialPages?: HandwrittenPageData[];
  onChange?: (pages: HandwrittenPageData[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1060;

export default function HandwritingCanvas({
  initialPages = [],
  onChange,
  readOnly = false,
  disabled = false,
}: HandwritingCanvasProps) {
  const [pagesStrokes, setPagesStrokes] = useState<Stroke[][]>(() => {
    if (initialPages && initialPages.length > 0) {
      return initialPages.map(p => {
        try {
          return p.strokesData ? JSON.parse(p.strokesData) : [];
        } catch {
          return [];
        }
      });
    }
    return [[]];
  });

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [activeInk, setActiveInk] = useState(INK_PALETTES[0].color);
  const [penSize, setPenSize] = useState(PEN_SIZES[1].size);
  const [eraserSize, setEraserSize] = useState(24);
  const [paperTexture, setPaperTexture] = useState(PARCHMENT_TEXTURES[0].id);

  const [redoStacks, setRedoStacks] = useState<Stroke[][]>([[]]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  useEffect(() => {
    if (initialPages && initialPages.length > 0 && pagesStrokes.every(s => s.length === 0)) {
      const loaded = initialPages.map(p => {
        try {
          return p.strokesData ? JSON.parse(p.strokesData) : [];
        } catch {
          return [];
        }
      });
      if (loaded.length > 0) {
        setPagesStrokes(loaded);
        setRedoStacks(loaded.map(() => []));
      }
    }
  }, [initialPages]);

  const renderStrokeOnCtx = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (!stroke.points || stroke.points.length === 0) return;

    ctx.save();
    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const points = stroke.points;
    if (points.length === 1) {
      const p = points[0];
      const radius = Math.max(1, (stroke.width * (p.pressure || 0.5)) / 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      const avgPressure = ((p0.pressure || 0.5) + (p1.pressure || 0.5)) / 2;
      const currentWidth = stroke.isEraser 
        ? stroke.width 
        : Math.max(1.2, stroke.width * (0.4 + avgPressure * 0.9));

      ctx.lineWidth = currentWidth;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.stroke();
    }

    ctx.restore();
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const currentPaper = PARCHMENT_TEXTURES.find(p => p.id === paperTexture) || PARCHMENT_TEXTURES[0];
    ctx.fillStyle = currentPaper.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (currentPaper.isLined) {
      ctx.save();
      ctx.strokeStyle = 'rgba(160, 130, 80, 0.22)';
      ctx.lineWidth = 1;
      const lineSpacing = 38;
      const startY = 90;
      for (let y = startY; y < CANVAS_HEIGHT - 60; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(CANVAS_WIDTH - 40, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(95, 40);
      ctx.lineTo(95, CANVAS_HEIGHT - 40);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(120, 90, 40, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36);
    ctx.restore();

    const strokes = pagesStrokes[activePageIndex] || [];
    strokes.forEach(stroke => {
      renderStrokeOnCtx(ctx, stroke);
    });

    if (currentStrokeRef.current) {
      renderStrokeOnCtx(ctx, currentStrokeRef.current);
    }
  }, [pagesStrokes, activePageIndex, paperTexture]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasPoint = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, time: Date.now() };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    let pressure = e.pressure;
    if (pressure === 0 || pressure === undefined) {
      pressure = 0.5;
    }

    return {
      x,
      y,
      pressure,
      time: Date.now()
    };
  };

  const syncToParent = (updatedPagesStrokes: Stroke[][]) => {
    if (!onChange) return;

    const exportPages: HandwrittenPageData[] = updatedPagesStrokes.map((strokes, index) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        const currentPaper = PARCHMENT_TEXTURES.find(p => p.id === paperTexture) || PARCHMENT_TEXTURES[0];
        ctx.fillStyle = currentPaper.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (currentPaper.isLined) {
          ctx.strokeStyle = 'rgba(160, 130, 80, 0.22)';
          ctx.lineWidth = 1;
          for (let y = 90; y < CANVAS_HEIGHT - 60; y += 38) {
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(CANVAS_WIDTH - 40, y);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(185, 28, 28, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(95, 40);
          ctx.lineTo(95, CANVAS_HEIGHT - 40);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(120, 90, 40, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36);

        strokes.forEach(stroke => {
          renderStrokeOnCtx(ctx, stroke);
        });
      }

      return {
        pageNumber: index + 1,
        imageData: tempCanvas.toDataURL('image/png', 0.88),
        strokesData: JSON.stringify(strokes),
        inkColor: activeInk,
        parchmentPaper: paperTexture
      };
    });

    onChange(exportPages);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (readOnly || disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);

    const newStroke: Stroke = {
      points: [pt],
      color: activeInk,
      width: activeTool === 'eraser' ? eraserSize : penSize,
      isEraser: activeTool === 'eraser'
    };

    currentStrokeRef.current = newStroke;
    redrawCanvas();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current || readOnly || disabled) return;
    const pt = getCanvasPoint(e);
    currentStrokeRef.current.points.push(pt);
    redrawCanvas();
  };

  const handlePointerUp = (_e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || readOnly || disabled) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const completedStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;

      setPagesStrokes(prev => {
        const next = prev.map((pageStrokes, idx) => {
          if (idx === activePageIndex) {
            return [...pageStrokes, completedStroke];
          }
          return pageStrokes;
        });
        syncToParent(next);
        return next;
      });

      setRedoStacks(prev => {
        const next = [...prev];
        next[activePageIndex] = [];
        return next;
      });
    } else {
      currentStrokeRef.current = null;
    }
    redrawCanvas();
  };

  const handlePointerCancel = () => {
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    redrawCanvas();
  };

  const handleUndo = () => {
    if (readOnly || disabled) return;
    const currentPageStrokes = pagesStrokes[activePageIndex] || [];
    if (currentPageStrokes.length === 0) return;

    const lastStroke = currentPageStrokes[currentPageStrokes.length - 1];
    const newStrokes = currentPageStrokes.slice(0, -1);

    setPagesStrokes(prev => {
      const next = prev.map((s, idx) => idx === activePageIndex ? newStrokes : s);
      syncToParent(next);
      return next;
    });

    setRedoStacks(prev => {
      const next = [...prev];
      next[activePageIndex] = [...(next[activePageIndex] || []), lastStroke];
      return next;
    });
  };

  const handleRedo = () => {
    if (readOnly || disabled) return;
    const currentRedoStack = redoStacks[activePageIndex] || [];
    if (currentRedoStack.length === 0) return;

    const strokeToRestore = currentRedoStack[currentRedoStack.length - 1];
    const newRedoStack = currentRedoStack.slice(0, -1);

    setPagesStrokes(prev => {
      const next = prev.map((s, idx) => idx === activePageIndex ? [...s, strokeToRestore] : s);
      syncToParent(next);
      return next;
    });

    setRedoStacks(prev => {
      const next = [...prev];
      next[activePageIndex] = newRedoStack;
      return next;
    });
  };

  const handleClearPage = () => {
    if (readOnly || disabled) return;
    if (!window.confirm('Clear all ink strokes from this parchment page?')) return;

    setPagesStrokes(prev => {
      const next = prev.map((s, idx) => idx === activePageIndex ? [] : s);
      syncToParent(next);
      return next;
    });

    setRedoStacks(prev => {
      const next = [...prev];
      next[activePageIndex] = [];
      return next;
    });
  };

  const handleAddPage = () => {
    if (readOnly || disabled || pagesStrokes.length >= 10) return;
    try {
      waxSealAudio.playParchmentUnroll();
    } catch (_) {}

    setPagesStrokes(prev => {
      const next = [...prev, []];
      syncToParent(next);
      return next;
    });

    setRedoStacks(prev => [...prev, []]);
    setActivePageIndex(pagesStrokes.length);
  };

  const handleDeletePage = () => {
    if (readOnly || disabled || pagesStrokes.length <= 1) return;
    if (!window.confirm(`Remove Page ${activePageIndex + 1}?`)) return;

    setPagesStrokes(prev => {
      const next = prev.filter((_, idx) => idx !== activePageIndex);
      syncToParent(next);
      return next;
    });

    setRedoStacks(prev => prev.filter((_, idx) => idx !== activePageIndex));
    setActivePageIndex(prev => Math.max(0, prev - 1));
  };

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setActivePageIndex(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (activePageIndex < pagesStrokes.length - 1) {
      try {
        waxSealAudio.playParchmentUnroll();
      } catch (_) {}
      setActivePageIndex(prev => prev + 1);
    }
  };

  const currentStrokesCount = (pagesStrokes[activePageIndex] || []).length;
  const currentRedoCount = (redoStacks[activePageIndex] || []).length;

  return (
    <div className="space-y-4 select-none">
      {!readOnly && (
        <div 
          className="p-3 sm:p-4 rounded-sm border shadow-lg space-y-3"
          style={{
            background: 'linear-gradient(145deg, #241D17 0%, #17130F 100%)',
            borderColor: 'rgba(212,175,55,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-amber-900/40">
            <div className="flex items-center gap-1.5 p-1 rounded-sm bg-stone-900/80 border border-amber-800/40">
              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'pen'
                    ? 'selected-glow-gold bg-amber-950 text-amber-200 shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
                title="Quill / Ink Pen"
              >
                <Feather className="w-3.5 h-3.5 text-amber-400" />
                <span>Ink Quill</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'eraser'
                    ? 'selected-glow-gold bg-amber-950 text-amber-200 shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
                title="Parchment Ink Eraser"
              >
                <Eraser className="w-3.5 h-3.5 text-amber-300" />
                <span>Eraser</span>
              </button>
            </div>

            {activeTool === 'pen' && (
              <div className="flex items-center gap-1 p-1 rounded-sm bg-stone-900/80 border border-amber-800/40">
                <span className="text-[11px] uppercase tracking-wider font-mono text-amber-300/80 px-1 font-bold">
                  Nib:
                </span>
                {PEN_SIZES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPenSize(s.size)}
                    className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all ${
                      penSize === s.size
                        ? 'selected-glow-gold bg-amber-950 text-amber-200'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                    title={s.label}
                  >
                    <span>{s.icon} {s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTool === 'eraser' && (
              <div className="flex items-center gap-1.5 p-1 rounded-sm bg-stone-900/80 border border-amber-800/40">
                <span className="text-[11px] uppercase tracking-wider font-mono text-amber-300/80 px-1 font-bold">
                  Width:
                </span>
                {[14, 24, 40].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setEraserSize(w)}
                    className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all ${
                      eraserSize === w
                        ? 'selected-glow-gold bg-amber-950 text-amber-200'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {w === 14 ? 'Fine' : w === 24 ? 'Medium' : 'Broad'}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={handleUndo}
                disabled={currentStrokesCount === 0 || disabled}
                className={`p-1.5 rounded-sm border transition-all ${
                  currentStrokesCount > 0
                    ? 'border-amber-800/60 bg-stone-900/80 text-amber-200 hover:bg-stone-800'
                    : 'border-stone-800 bg-stone-950/40 text-stone-600 cursor-not-allowed'
                }`}
                title="Undo last stroke"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={currentRedoCount === 0 || disabled}
                className={`p-1.5 rounded-sm border transition-all ${
                  currentRedoCount > 0
                    ? 'border-amber-800/60 bg-stone-900/80 text-amber-200 hover:bg-stone-800'
                    : 'border-stone-800 bg-stone-950/40 text-stone-600 cursor-not-allowed'
                }`}
                title="Redo stroke"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClearPage}
                disabled={currentStrokesCount === 0 || disabled}
                className={`p-1.5 rounded-sm border transition-all ${
                  currentStrokesCount > 0
                    ? 'border-red-900/60 bg-red-950/30 text-red-300 hover:bg-red-950/60'
                    : 'border-stone-800 bg-stone-950/40 text-stone-600 cursor-not-allowed'
                }`}
                title="Clear current parchment sheet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-amber-300/80 uppercase tracking-wider font-bold">
                Ink Formulation:
              </span>
              <div className="flex items-center gap-1.5">
                {INK_PALETTES.map(ink => (
                  <button
                    key={ink.id}
                    type="button"
                    onClick={() => {
                      setActiveInk(ink.color);
                      if (activeTool === 'eraser') setActiveTool('pen');
                    }}
                    className={`px-2.5 py-1 rounded-sm font-bold flex items-center gap-1.5 border transition-all ${
                      activeInk === ink.color && activeTool === 'pen'
                        ? 'selected-glow-gold bg-amber-950 text-amber-200 border-amber-400'
                        : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-stone-400 shadow-sm"
                      style={{ backgroundColor: ink.preview }}
                    />
                    <span className="hidden sm:inline">{ink.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-amber-300/80 uppercase tracking-wider font-bold">
                Parchment:
              </span>
              <div className="flex items-center gap-1">
                {PARCHMENT_TEXTURES.map(paper => (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setPaperTexture(paper.id)}
                    className={`px-2.5 py-1 rounded-sm font-bold border transition-all ${
                      paperTexture === paper.id
                        ? 'selected-glow-gold bg-amber-950 text-amber-200 border-amber-400'
                        : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span>{paper.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative">
        <div 
          className="w-full max-w-2xl rounded-sm p-2 sm:p-4 shadow-2xl relative border-2 border-stone-800 transition-all"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #201A14 0%, #110E0B 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.7)'
          }}
        >
          <div className="flex items-center justify-between px-2 pb-2 mb-1 text-[11px] font-mono border-b border-amber-900/30 text-amber-300/80">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Page {activePageIndex + 1} of {pagesStrokes.length}
            </span>
            <span className="italic text-stone-400">
              {readOnly ? 'Physical Freehand Letter' : '✍️ Write freely with stylus, pen, mouse, or touch'}
            </span>
          </div>

          <div className="relative w-full aspect-[800/1060] bg-stone-100 rounded-sm overflow-hidden shadow-inner cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerUp}
              className="w-full h-full block touch-none select-none"
              style={{
                touchAction: 'none',
                cursor: readOnly ? 'default' : activeTool === 'eraser' ? 'cell' : 'crosshair'
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-amber-900/30 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={activePageIndex === 0}
                className={`px-3 py-1 rounded-sm border font-serif font-bold text-xs flex items-center gap-1 transition-all ${
                  activePageIndex === 0
                    ? 'opacity-35 cursor-not-allowed border-stone-800 bg-stone-900/40 text-stone-500'
                    : 'border-amber-800 bg-stone-900 text-amber-200 hover:bg-stone-800 shadow cursor-pointer'
                }`}
                title="Turn to previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Sheet</span>
              </button>

              <span className="font-mono font-bold text-amber-200 px-2">
                Sheet {activePageIndex + 1} / {pagesStrokes.length}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={activePageIndex >= pagesStrokes.length - 1}
                className={`px-3 py-1 rounded-sm border font-serif font-bold text-xs flex items-center gap-1 transition-all ${
                  activePageIndex >= pagesStrokes.length - 1
                    ? 'opacity-35 cursor-not-allowed border-stone-800 bg-stone-900/40 text-stone-500'
                    : 'border-amber-800 bg-stone-900 text-amber-200 hover:bg-stone-800 shadow cursor-pointer'
                }`}
                title="Turn to next page"
              >
                <span>Next Sheet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-1.5">
                {pagesStrokes.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeletePage}
                    className="px-2.5 py-1 rounded-sm border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-950/80 text-xs font-bold flex items-center gap-1 transition-all shadow"
                    title="Remove this parchment sheet"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Delete Sheet</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddPage}
                  disabled={pagesStrokes.length >= 10}
                  className="px-3 py-1 rounded-sm border border-amber-600/60 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-bold flex items-center gap-1 transition-all shadow cursor-pointer"
                  title="Attach an additional parchment sheet to this missive"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Page Sheet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
