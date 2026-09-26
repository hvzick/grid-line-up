import { cn } from "@/lib/utils";

export function PlayerLabel({ name, lines, active, badge }: { name: string; lines: number; active: boolean; badge?: string }) {
  return (
    <div className="flex w-full max-w-sm items-center justify-between">
      <span className={cn("font-display text-2xl tracking-wide", active && "text-accent")}>
        {name}{" "}
        {badge && (
          <span className="ml-1 rounded bg-secondary px-2 py-0.5 align-middle font-sans text-xs font-semibold uppercase text-secondary-foreground">
            {badge}
          </span>
        )}{" "}
        {active && "●"}
      </span>
      <span className="flex gap-1">
        {"BINGO".split("").map((l, i) => (
          <span
            key={l}
            className={cn(
              "grid h-8 w-8 place-items-center rounded font-display text-xl",
              i < lines ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}

export function BoardView({
  grid,
  called,
  lines,
  onCell,
  interactive = true,
}: {
  grid: (number | null)[];
  called: Set<number>;
  lines: number[][];
  onCell?: (i: number) => void;
  interactive?: boolean;
}) {
  const lineCells = new Set(lines.flat());
  return (
    <div className="grid w-full max-w-sm grid-cols-5 gap-2 rounded-2xl bg-card p-3">
      {grid.map((n, i) => {
        const isCalled = n !== null && called.has(n);
        const inLine = lineCells.has(i);
        return (
          <button
            key={i}
            disabled={!onCell || !interactive || isCalled}
            onClick={() => onCell?.(i)}
            className={cn(
              "aspect-square rounded-lg font-display text-3xl transition",
              n === null && "border-2 border-dashed border-border bg-transparent",
              n !== null && !isCalled && "animate-pop bg-tile text-tile-foreground",
              isCalled && !inLine && "bg-primary text-primary-foreground line-through",
              inLine && "bg-accent text-accent-foreground",
              onCell && interactive && !isCalled && "hover:scale-105 cursor-pointer",
            )}
          >
            {n ?? ""}
          </button>
        );
      })}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-5 py-2.5 font-semibold transition disabled:opacity-40",
        variant === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
