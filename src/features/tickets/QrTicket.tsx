"use client";

import QRCode from "react-qr-code";

export function QrTicket({ qrValue }: { qrValue: string }) {
  const code = qrValue.split(".")[0];

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="rounded-xl bg-surface-2 p-4">
        <QRCode value={qrValue} size={180} bgColor="#1e232b" fgColor="#f4f6f8" level="M" />
      </div>
      <span className="font-mono text-sm tracking-widest text-text-dim">{code}</span>
    </div>
  );
}
