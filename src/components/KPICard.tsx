import { useEffect, useRef, useState, ElementType, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  numericValue?: number;
  sub?: string;
  icon: ElementType;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
  delay?: number;
  onClick?: () => void;
}

function useCounter(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return current;
}

export function KPICard({ label, value, numericValue, sub, icon: Icon, iconColor = "text-gold", trend, className, delay = 0, onClick }: KPICardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  // Only animate if numeric
  const animTarget = numericValue !== undefined ? numericValue : 0;
  const count = useCounter(animTarget);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 8);
    rotateY.set(x * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const displayValue = numericValue !== undefined
    ? value.replace(/\d+/, count.toString())
    : value;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "relative bg-card rounded-2xl p-5 border border-border overflow-hidden cursor-default select-none",
        "shimmer-gold transition-all duration-300",
        "hover:border-[var(--border-gold-hover)] hover:shadow-gold",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

      {/* Gold corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-gold opacity-[0.04] rounded-bl-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-gold-subtle border border-[var(--border-gold)]")}>
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        </div>

        <div className="text-2xl font-heading font-bold text-foreground mb-1 tracking-tight">
          {displayValue}
        </div>

        {sub && (
          <p className="text-xs text-muted-foreground leading-snug">{sub}</p>
        )}

        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend.value >= 0 ? "text-success" : "text-destructive"
          )}>
            <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
