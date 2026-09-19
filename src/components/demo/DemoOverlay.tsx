import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEMO_STEPS, useDemoMode } from "@/store/useDemoMode";
import { useCadastre } from "@/store/useCadastre";

export function DemoOverlay() {
  const { active, step, playing, next, prev, goTo, exit, restart, setPlaying } = useDemoMode();
  const reduceMotion = useCadastre((s) => s.settings.reduceMotion);

  useEffect(() => {
    if (!active || !playing || reduceMotion) return;
    const id = window.setTimeout(() => next(), 6500);
    return () => window.clearTimeout(id);
  }, [active, playing, step, next, reduceMotion]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") exit();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying(!playing);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, playing, next, prev, exit, setPlaying]);

  if (!active) return null;
  const current = DEMO_STEPS[step]!;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-end">
      <div className="pointer-events-auto mx-auto mb-6 w-[min(680px,calc(100vw-2rem))]">
        <div className="glass p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-primary">
                Guided demo — step {step + 1} of {DEMO_STEPS.length}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{current.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{current.caption}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={exit} aria-label="Exit demo">
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="size-3.5" /> Back
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPlaying(!playing)}>
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={next}
              disabled={step === DEMO_STEPS.length - 1}
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={restart}>
              <RotateCcw className="size-3.5" /> Restart
            </Button>
            <div className="ml-auto flex gap-1">
              {DEMO_STEPS.map((s, i) => (
                <button
                  key={s.title}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  onClick={() => goTo(i)}
                  className={`h-1.5 w-5 rounded-full transition-colors ${
                    i === step ? "bg-primary" : "bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
