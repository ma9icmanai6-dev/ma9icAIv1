import React, { useRef, useState, useEffect } from "react";
import { Paintbrush, Eraser, Square, Circle, Download, RotateCcw } from "lucide-react";
import { SystemService } from "../../services/systemService";

const COLORS = [
  "#38bdf8", // Sky blue
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#a855f7", // Purple
  "#ffffff", // White
  "#000000", // Black
];

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#38bdf8");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<"brush" | "eraser" | "rect" | "circle">("brush");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background to solid dark slate
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial greeting illustration
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "14px system-ui";
    ctx.fillText("Magic Paint Studio - Windows 11", 55, 75);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Draw freehand or ask Magic to generate diagrams.", 55, 95);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    if (tool === "brush" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    if (tool === "brush") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = lineWidth * 3;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    if (tool === "rect") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === "circle") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      const radius = Math.hypot(x - startPos.x, y - startPos.y);
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "Magic_Drawing.png";
    a.click();
    SystemService.showToast("Artwork Saved", "Saved drawing to Pictures", "success");
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Paint Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10 gap-2 text-xs">
        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool("brush")}
            className={`p-1.5 rounded transition ${
              tool === "brush" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-slate-400 hover:bg-white/5"
            }`}
            title="Brush"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-1.5 rounded transition ${
              tool === "eraser" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-slate-400 hover:bg-white/5"
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool("rect")}
            className={`p-1.5 rounded transition ${
              tool === "rect" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-slate-400 hover:bg-white/5"
            }`}
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-1.5 rounded transition ${
              tool === "circle" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-slate-400 hover:bg-white/5"
            }`}
            title="Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === "eraser") setTool("brush");
              }}
              style={{ backgroundColor: c }}
              className={`w-4 h-4 rounded-full border transition ${
                color === c && tool !== "eraser" ? "ring-2 ring-sky-400 scale-110" : "border-white/20"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            title="Clear canvas"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            title="Save PNG"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden p-2 flex items-center justify-center bg-slate-900/40">
        <canvas
          ref={canvasRef}
          width={560}
          height={340}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          className="rounded-lg shadow-xl cursor-crosshair border border-white/10"
        />
      </div>
    </div>
  );
};
