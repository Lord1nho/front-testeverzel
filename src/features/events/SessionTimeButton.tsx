import Link from "next/link";

interface SessionTimeButtonProps {
  href: string;
  time: string;
  subLabel?: string;
  disabled?: boolean;
  disabledLabel?: string;
}

export function SessionTimeButton({
  href,
  time,
  subLabel,
  disabled,
  disabledLabel,
}: SessionTimeButtonProps) {
  if (disabled) {
    return (
      <span className="inline-flex h-11 w-fit min-w-[110px] items-center justify-center gap-1 rounded-[9px] border border-border bg-surface-2 px-4 text-sm font-semibold text-text-mute">
        {disabledLabel ?? time}
      </span>
    );
  }

  return (
    <Link href={href} className="session-flip h-11 min-w-[110px]">
      <span className="session-flip-face session-flip-front flex items-center justify-center gap-1 rounded-[9px] border border-border bg-surface-2 px-4 text-sm font-semibold text-foreground">
        {time}
        {subLabel && <span className="font-normal text-text-mute">· {subLabel}</span>}
      </span>
      <span className="session-flip-face session-flip-back flex items-center justify-center rounded-[9px] bg-accent-cyan px-4 text-sm font-bold text-[#05070a]">
        Comprar
      </span>
    </Link>
  );
}
