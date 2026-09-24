"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignaturePad({ sessionId }: { sessionId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    hasDrawn.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  }

  async function submit() {
    if (!hasDrawn.current) {
      setError("Veuillez signer avant de valider.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const res = await fetch("/api/emargement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, signature: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">Signez ci-dessous avec le doigt ou la souris :</p>
      <canvas
        ref={canvasRef}
        width={480}
        height={180}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full touch-none rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50"
      />
      {error && <p className="text-sm text-afpi-red-dark mt-2">{error}</p>}
      <div className="flex gap-2.5 justify-end mt-4">
        <button
          onClick={clear}
          type="button"
          className="text-sm font-bold rounded-lg border border-slate-200 text-slate-600 px-5 py-2.5 hover:bg-slate-50 transition-colors"
        >
          Effacer
        </button>
        <button
          onClick={submit}
          type="button"
          disabled={submitting}
          className="text-sm font-bold rounded-lg bg-afpi-red hover:bg-afpi-red-dark disabled:opacity-60 text-white px-6 py-2.5 transition-colors"
        >
          {submitting ? "Enregistrement..." : "Valider ma présence"}
        </button>
      </div>
    </div>
  );
}
