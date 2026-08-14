"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

interface QrCodeScannerProps {
  onDetect: (code: string) => void;
  paused?: boolean;
}

export function QrCodeScanner({ onDetect, paused = false }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  // Sempre chama a versão mais recente de onDetect sem precisar recriar o
  // loop de leitura a cada render (evita reiniciar a câmera por causa de
  // uma função nova vinda do componente pai).
  const onDetectRef = useRef(onDetect);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const request = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      : Promise.reject(new Error("Câmera não suportada neste navegador."));

    request
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Não foi possível acessar a câmera (permissão negada ou indisponível). Use a digitação manual.",
          );
        }
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!cameraReady || paused) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    function tick() {
      if (video!.readyState === video!.HAVE_ENOUGH_DATA) {
        canvas!.width = video!.videoWidth;
        canvas!.height = video!.videoHeight;
        context!.drawImage(video!, 0, 0, canvas!.width, canvas!.height);
        const imageData = context!.getImageData(0, 0, canvas!.width, canvas!.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) {
          onDetectRef.current(result.data);
          return; // pausa o loop até o pai liberar de novo via `paused`
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [cameraReady, paused]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2 text-sm text-text-dim">
            Solicitando acesso à câmera...
          </div>
        )}

        {cameraReady && (
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-accent-lime/70" />
        )}
      </div>
      <p className="mt-4 text-center text-xs text-text-mute">
        Aponte a câmera para o QR Code do ingresso.
      </p>
    </div>
  );
}
