"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAlarmSolution,
  channelColorClass,
  type ResolutionChannel,
} from "@/lib/alarm-solutions";
import type { AlarmDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

function alarmTypeLabel(type: AlarmDoc["type"]) {
  switch (type) {
    case "DEVICE_OFFLINE":
      return "Dispositivo offline";
    case "FREQUENCY_OUT_OF_RANGE":
      return "Frecuencia fuera de rango";
    case "VOLTAGE_OUT_OF_RANGE":
      return "Voltaje fuera de rango";
    case "LOW_GENERATION":
      return "Baja generación";
    default:
      return type;
  }
}

function ChannelGlyph({ channel }: { channel: ResolutionChannel }) {
  const cls = "size-4 shrink-0";
  switch (channel) {
    case "remote":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "call_client":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "send_technician":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
  }
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export type AlarmSolutionModalProps = {
  alarm: AlarmDoc | null;
  plantName?: string;
  onClose: () => void;
};

export function AlarmSolutionModal({
  alarm,
  plantName,
  onClose,
}: AlarmSolutionModalProps) {
  if (!alarm) return null;

  const solution = getAlarmSolution(alarm);

  return (
    <Dialog open={Boolean(alarm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-lg">
            {solution.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {alarmTypeLabel(alarm.type)}
            {plantName ? ` · ${plantName}` : ""}
            {alarm.device_id ? ` · ${alarm.device_id}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                channelColorClass(solution.channel)
              )}
            >
              <ChannelGlyph channel={solution.channel} />
              {solution.channelLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockGlyph className="size-3.5 shrink-0" />
              {solution.estimatedTime}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">
            {solution.description}
          </p>

          {(alarm.details?.reading_value != null ||
            alarm.details?.threshold_value != null) && (
            <div className="rounded-lg border border-border bg-muted px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Datos de la lectura
              </p>
              <div className="mt-1 flex flex-wrap gap-4 text-sm">
                {alarm.details?.reading_value != null && (
                  <span>
                    Valor leído:{" "}
                    <strong className="text-foreground">
                      {alarm.details.reading_value}
                    </strong>
                  </span>
                )}
                {alarm.details?.threshold_value != null && (
                  <span>
                    Umbral:{" "}
                    <strong className="text-foreground">
                      {alarm.details.threshold_value}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
              Pasos sugeridos
            </p>
            <ol className="space-y-2">
              {solution.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-bold tabular-nums text-foreground ring-1 ring-border">
                    {i + 1}
                  </span>
                  <span className="leading-snug text-foreground/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
