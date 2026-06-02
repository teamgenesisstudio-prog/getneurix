import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { V3Section, DistillationDemo } from "./neurix-v3/V3Demos";

/* ---------- fonts ---------- */
const FontLoader = () => {
  useEffect(() => {
    const id = "neurix-dm-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ---------- tokens ---------- */
const C = {
  bg: "#080808",
  surface: "#0e0e0e",
  surface2: "#141414",
  border: "#242424",
  border2: "#2e2e2e",
  text: "#f5f5f5",
  muted: "#999999",
  subtle: "#555555",
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
};
const sans = { fontFamily: "'DM Sans', system-ui, sans-serif" };
const mono = { fontFamily: "'DM Mono', ui-monospace, monospace" };

/* ---------- reveal on scroll ---------- */
const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
};

const Reveal = ({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: any;
}) => {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <As
      ref={ref as any}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </As>
  );
};

/* ---------- count up ---------- */
const CountUp = ({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1500,
  color,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  color?: string;
}) => {
  const [v, setV] = useState(0);
  const { ref, shown } = useReveal<HTMLSpanElement>();
  useEffect(() => {
    if (!shown) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, to, duration]);
  return (
    <span ref={ref} style={{ color, ...mono }}>
      {prefix}
      {v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

/* ---------- nav ---------- */
const Nav = ({ onCTA }: { onCTA: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 50,
        backgroundColor: scrolled ? "rgba(8,8,8,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "background-color .3s ease, border-color .3s ease, backdrop-filter .3s ease",
        ...sans,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: C.text,
        }}
      >
        <div style={{ fontWeight: 700, letterSpacing: 0.5, fontSize: 16 }}>
          NEUR<span style={{ color: C.blue }}>IX</span>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 13, color: C.muted }} className="hidden md:flex">
          {["Platform", "Features", "Docs", "Pricing"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={{ color: "inherit", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {l}
            </a>
          ))}
        </div>
        <button
          onClick={onCTA}
          style={{
            background: C.blue,
            color: "#fff",
            border: "none",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            ...sans,
          }}
        >
          Start Free Beta
        </button>
      </div>
    </nav>
  );
};

/* ---------- pulsing dot ---------- */
const Pulse = ({ color = C.green, size = 8 }: { color?: string; size?: number }) => (
  <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
    <span
      style={{
        position: "absolute",
        inset: 0,
        background: color,
        borderRadius: "50%",
        animation: "neurixPing 1.6s ease-out infinite",
        opacity: 0.6,
      }}
    />
    <span
      style={{
        position: "absolute",
        inset: 0,
        background: color,
        borderRadius: "50%",
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  </span>
);

/* ---------- hero card ---------- */
const HeroCard = () => {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        padding: 1,
        background:
          "conic-gradient(from var(--angle,0deg), rgba(59,130,246,0.6), rgba(59,130,246,0) 30%, rgba(59,130,246,0) 70%, rgba(59,130,246,0.6))",
        animation: "neurixRotate 6s linear infinite",
      }}
    >
      <div
        style={{
          borderRadius: 15,
          background: C.surface,
          padding: 24,
          ...sans,
          color: C.text,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 240,
            height: 240,
            background: "radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            fontSize: 12,
            color: C.muted,
            ...mono,
          }}
        >
          <span>neurix / command-center</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.green }}>
            <Pulse /> All systems operational
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Reliability Score", val: <CountUp to={98.4} decimals={1} suffix="%" color={C.green} /> },
            { label: "Outputs Caught", val: <CountUp to={1247} color={C.blue} /> },
            { label: "Attacks Blocked", val: <CountUp to={84} color={C.text} /> },
            { label: "Token Savings", val: <CountUp to={312} prefix="$" color={C.green} /> },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "14px 14px",
              }}
            >
              <div style={{ fontSize: 10, color: C.muted, ...mono, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{m.val}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 10, color: C.muted, ...mono, marginBottom: 8 }}>
            Reliability score — 30d
          </div>
          <Sparkline />
        </div>
      </div>
    </div>
  );
};

const Sparkline = () => {
  const { ref, shown } = useReveal<any>();
  const points = [
    [0, 38], [25, 30], [50, 34], [75, 26], [100, 28], [125, 22], [150, 24],
    [175, 18], [200, 20], [225, 26], [250, 14], [275, 18], [300, 12], [325, 18],
    [350, 10], [375, 14], [400, 8], [425, 10], [450, 6], [475, 10], [500, 5],
  ];
  const d = points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const fillD = `${d} L500,60 L0,60 Z`;
  const anomaly = points[5];
  return (
    <svg ref={ref} viewBox="0 0 500 60" width="100%" height="80" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={fillD}
        fill="url(#sparkFill)"
        style={{
          opacity: shown ? 1 : 0,
          transition: "opacity 1s ease 1s",
        }}
      />
      <path
        d={d}
        fill="none"
        stroke={C.blue}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: shown ? 0 : 1200,
          transition: "stroke-dashoffset 1.5s ease",
        }}
      />
      <circle
        cx={anomaly[0]}
        cy={anomaly[1]}
        r={3}
        fill={C.red}
        style={{ opacity: shown ? 1 : 0, transition: "opacity .4s ease 1.4s" }}
      />
      <text
        x={anomaly[0] + 6}
        y={anomaly[1] - 4}
        fill={C.red}
        fontSize={7}
        style={{ ...mono, opacity: shown ? 1 : 0, transition: "opacity .4s ease 1.5s" }}
      >
        anomaly
      </text>
    </svg>
  );
};

/* ---------- hero ---------- */
const Hero = ({ onCTA }: { onCTA: () => void }) => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const f = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 80px",
        overflow: "hidden",
        color: C.text,
      }}
    >
      {/* grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          pointerEvents: "none",
        }}
      />
      {/* blue glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(59,130,246,0.22), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 980,
          transform: `translateY(${scrollY * 0.18}px)`,
          willChange: "transform",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${C.border}`,
            fontSize: 12,
            color: C.muted,
            marginBottom: 28,
            ...mono,
          }}
        >
          <Pulse /> V3.5 — Now in free beta
        </div>
        <h1
          style={{
            ...sans,
            fontSize: "clamp(44px, 7vw, 88px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            margin: 0,
          }}
        >
          <RevealWord delay={0}>Production AI</RevealWord>
          <br />
          <RevealWord delay={300}>breaks </RevealWord>
          <RevealWord delay={700} color={C.muted}>silently.</RevealWord>
        </h1>
        <p
          style={{
            marginTop: 24,
            color: C.muted,
            fontSize: 18,
            lineHeight: 1.55,
            maxWidth: 620,
            marginLeft: "auto",
            marginRight: "auto",
            ...sans,
          }}
        >
          Neurix stress-tests, validates, repairs, and monitors AI systems before failures reach users.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <button
            onClick={onCTA}
            style={{
              background: C.blue,
              color: "#fff",
              border: "none",
              padding: "12px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              ...sans,
            }}
          >
            Start Free Beta
          </button>
          <a
            href="#platform"
            style={{
              border: `1px solid ${C.border2}`,
              color: C.text,
              padding: "12px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              ...sans,
            }}
          >
            View Demo →
          </a>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 64, width: "100%", maxWidth: 980 }}>
        <Reveal delay={400}>
          <HeroCard />
        </Reveal>
      </div>
    </section>
  );
};

const RevealWord = ({
  children,
  delay = 0,
  color,
}: {
  children: ReactNode;
  delay?: number;
  color?: string;
}) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay + 150);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
      <span
        style={{
          display: "inline-block",
          color,
          transform: shown ? "translateY(0)" : "translateY(110%)",
          opacity: shown ? 1 : 0,
          transition: `transform .9s cubic-bezier(.2,.7,.1,1), opacity .9s ease`,
        }}
      >
        {children}
      </span>
    </span>
  );
};

/* ---------- section helpers ---------- */
const SectionTitle = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) => (
  <div style={{ textAlign: "center", marginBottom: 64 }}>
    {eyebrow && (
      <Reveal>
        <div style={{ ...mono, color: C.blue, fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>
          {eyebrow}
        </div>
      </Reveal>
    )}
    <Reveal delay={80}>
      <h2
        style={{
          ...sans,
          fontSize: "clamp(32px, 4.5vw, 56px)",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          margin: 0,
          color: C.text,
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
    </Reveal>
    {subtitle && (
      <Reveal delay={160}>
        <p style={{ ...sans, color: C.muted, fontSize: 18, marginTop: 16, maxWidth: 640, marginInline: "auto" }}>
          {subtitle}
        </p>
      </Reveal>
    )}
  </div>
);

const Card = ({
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => {
        setHover(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setHover(false);
        onMouseLeave?.();
      }}
      style={{
        background: C.surface,
        border: `1px solid ${hover ? "#3a3a3a" : C.border}`,
        borderRadius: 14,
        padding: 24,
        color: C.text,
        cursor: onClick ? "pointer" : "default",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 18px 50px rgba(0,0,0,0.55)" : "0 0 0 rgba(0,0,0,0)",
        transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
        ...sans,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- version selector ---------- */
const VersionCards = ({ onEnter }: { onEnter: (v: "v1" | "v2" | "v35") => void }) => {
  const versions = [
    {
      id: "v1" as const,
      badge: "V1",
      name: "Pre-Deployment",
      desc: "Upload your model. Stress-test everything. Ship with confidence.",
      count: "9 features",
      highlight: false,
    },
    {
      id: "v2" as const,
      badge: "V2",
      name: "Model Intelligence",
      desc: "Label, validate, distill, and understand your AI at depth.",
      count: "17 features",
      highlight: false,
    },
    {
      id: "v35" as const,
      badge: "V3.5",
      name: "Production Runtime",
      desc: "The reliability layer between your app and the AI model.",
      count: "5 core systems",
      highlight: true,
    },
  ];
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {versions.map((v, i) => (
          <Reveal key={v.id} delay={i * 120}>
            <Card
              onClick={() => onEnter(v.id)}
              style={{
                padding: 28,
                minHeight: 280,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                ...(v.highlight ? { borderColor: "rgba(59,130,246,0.4)" } : {}),
              }}
            >
              {v.highlight && (
                <div
                  style={{
                    position: "absolute",
                    inset: -1,
                    borderRadius: 14,
                    pointerEvents: "none",
                    boxShadow: "inset 0 0 60px rgba(59,130,246,0.08)",
                  }}
                />
              )}
              <div
                style={{
                  ...mono,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: v.highlight ? C.blue : C.muted,
                  marginBottom: 16,
                }}
              >
                {v.badge}
              </div>
              <h3
                style={{
                  ...sans,
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                {v.name}
              </h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.55, margin: 0, flex: 1 }}>{v.desc}</p>
              <div style={{ ...mono, color: C.subtle, fontSize: 11, marginTop: 20, marginBottom: 20 }}>
                {v.count}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter(v.id);
                }}
                style={{
                  background: v.highlight ? C.blue : "transparent",
                  color: v.highlight ? "#fff" : C.text,
                  border: v.highlight ? "none" : `1px solid ${C.border2}`,
                  padding: "10px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  ...sans,
                  alignSelf: "flex-start",
                }}
              >
                → Enter {v.badge}
              </button>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* timeline */}
      <Reveal delay={400}>
        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            maxWidth: 600,
            marginInline: "auto",
          }}
        >
          {["V1", "V2", "V3.5"].map((label, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: label === "V3.5" ? C.blue : C.border2,
                    boxShadow: label === "V3.5" ? `0 0 12px ${C.blue}` : "none",
                  }}
                />
                <div style={{ ...mono, fontSize: 10, color: label === "V3.5" ? C.blue : C.muted }}>
                  {label}
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: C.border, margin: "0 8px" }} />}
            </div>
          ))}
        </div>
      </Reveal>
    </>
  );
};

/* ---------- problem grid ---------- */
const ProblemGrid = () => {
  const items = [
    { t: "Malformed JSON", d: "Your parser breaks. Workflow stops. No alert fired." },
    { t: "Prompt Injection", d: "User input overrides your system prompt. Nothing catches it." },
    { t: "Hallucinated Outputs", d: "Confident wrong answers pass every validation check." },
    { t: "Reliability Drift", d: "Latency up 40%. Nobody noticed for 11 days." },
    { t: "Retry Explosions", d: "Failed output retries 4 times. Token bill climbs." },
    { t: "PII Exposure", d: "Your LLM sees data it shouldn't. Nobody audited it." },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((it, i) => (
        <Reveal key={it.t} delay={i * 80}>
          <Card style={{ minHeight: 140 }}>
            <div style={{ ...mono, fontSize: 11, color: C.amber, marginBottom: 10 }}>0{i + 1}</div>
            <h3 style={{ ...sans, fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 8 }}>{it.t}</h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{it.d}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
};

/* ---------- how it works ---------- */
const HowItWorks = () => {
  const steps = [
    { n: "01", t: "Connect", d: "Connect via API or SDK in one line." },
    { n: "02", t: "Test and Protect", d: "Run stress tests, validate outputs, activate runtime protection." },
    { n: "03", t: "Monitor and Repair", d: "Detect failures, repair automatically, monitor continuously." },
  ];
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 22,
          left: "8%",
          right: "8%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.border2}, transparent)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 28,
        }}
      >
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 140}>
            <div style={{ textAlign: "center", padding: "0 12px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: C.surface,
                  border: `1px solid ${C.border2}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...mono,
                  fontSize: 12,
                  color: C.blue,
                  marginBottom: 20,
                }}
              >
                {s.n}
              </div>
              <h3 style={{ ...sans, fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8, color: C.text }}>
                {s.t}
              </h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

/* ---------- use cases ---------- */
const UseCases = () => {
  const cases = [
    {
      t: "Use Case 01",
      d: "A team detects a prompt injection vulnerability on day one of stress testing. Fixed before a single user is impacted.",
      o: "Zero users affected",
    },
    {
      t: "Use Case 02",
      d: "An engineer catches JSON schema drift before it breaks a downstream pipeline. Repaired automatically in under 2ms.",
      o: "Pipeline stays stable",
    },
    {
      t: "Use Case 03",
      d: "A startup reduces retry costs after enabling output validation. Token waste eliminated.",
      o: "Token waste eliminated",
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
      {cases.map((c, i) => (
        <Reveal key={c.t} delay={i * 120}>
          <Card style={{ borderLeft: `2px solid ${C.blue}`, minHeight: 200 }}>
            <div style={{ ...mono, fontSize: 11, color: C.blue, marginBottom: 12 }}>{c.t.toUpperCase()}</div>
            <p style={{ color: C.text, fontSize: 15, lineHeight: 1.55, margin: 0, marginBottom: 20 }}>{c.d}</p>
            <div
              style={{
                ...mono,
                fontSize: 11,
                color: C.green,
                paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              OUTCOME — {c.o}
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
};

/* ---------- providers ---------- */
const Providers = () => {
  const items = [
    { n: "OpenAI", d: "GPT-4o, GPT-4 Turbo, GPT-3.5" },
    { n: "Gemini", d: "1.5 Pro, 1.5 Flash" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 720, marginInline: "auto" }}>
      {items.map((p, i) => (
        <Reveal key={p.n} delay={i * 120}>
          <Card style={{ textAlign: "center", padding: 32 }}>
            <h3 style={{ ...sans, fontSize: 22, fontWeight: 600, margin: 0, marginBottom: 8 }}>{p.n}</h3>
            <div style={{ ...mono, color: C.muted, fontSize: 12 }}>{p.d}</div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
};

/* ---------- trust ---------- */
const Trust = () => {
  const items = [
    { t: "API-First Architecture", d: "Built as infrastructure. Designed to be wrapped around any model call." },
    { t: "Encrypted Logs", d: "All telemetry and event logs encrypted in transit and at rest." },
    { t: "Production-Safe Workflows", d: "Fail-open guarantees. Your app keeps shipping even if Neurix is unreachable." },
    { t: "Runtime Protection Layer", d: "Inline middleware between your app and the model. Sub-millisecond overhead." },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {items.map((it, i) => (
        <Reveal key={it.t} delay={i * 100}>
          <Card style={{ minHeight: 160 }}>
            <h3 style={{ ...sans, fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 8 }}>{it.t}</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>{it.d}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
};

/* ---------- V1 view ---------- */
const v1Features = [
  { t: "Model Upload", d: "CSV, JSON, or Python pickle. Any model format accepted." },
  { t: "127+ Stress Tests", d: "Edge cases, boundary conditions, and failure scenarios run automatically." },
  { t: "Adversarial Attack Simulation", d: "Injection attacks, jailbreak attempts, and adversarial prompts tested." },
  { t: "Drift Detection", d: "Detect behavior and performance drift before deployment." },
  { t: "Auto-Fix and Redeploy", d: "Synthetic data generated, model retrained, deployed automatically." },
  { t: "Logic Fortress v1.5", d: "Deterministic middleware layer wrapped around every AI request." },
  { t: "PII Tokenization", d: "Email, SSN, phone, cards, API keys, JWT, IP replaced with tokens before egress." },
  { t: "Self-Healing JSON Loop", d: "Malformed JSON triggers one-shot repair call automatically." },
  { t: "Compute Guard", d: "Per-request cost cap. Auto-pivot to efficiency tier on budget breach." },
];

const v2Features = [
  { t: "Zero-Shot Auto-Labeling", d: "Gemini labels your dataset automatically. No manual annotation needed." },
  { t: "Synthetic Gap-Filler", d: "Generates missing training examples to fill dataset coverage gaps." },
  { t: "Dataset Distillation", d: "Compresses large datasets into high-signal subsets intelligently." },
  { t: "Human Review Queue", d: "Route edge cases to human reviewers with full context attached." },
  { t: "Conflict Resolution", d: "AI Judge resolves label conflicts and disagreements automatically." },
  { t: "DNA Fingerprint", d: "6-dimension model identity scoring. Safety, accuracy, robustness, fairness, speed, coverage." },
  { t: "Compliance Scanner", d: "Scan your model against real regulatory frameworks automatically." },
  { t: "ROI Calculator", d: "Track money saved, hours saved, failures prevented, downtime avoided." },
  { t: "Offline Queue", d: "Queue all tests offline. Auto-sync when connection restored." },
  { t: "Knowledge Distillation", d: "Capture prompt/response pairs and fine-tune cheaper specialist models." },
  { t: "Active Learning Loop", d: "Surface the exact rows that move the model most when labeled." },
  { t: "Edge-Case Radar", d: "Continuously surface the weirdest inputs your model hasn't handled." },
  { t: "Chain of Thought Capture", d: "Record reasoning traces alongside labels for next-gen training." },
  { t: "RLHF Sandboxes", d: "Rank responses live. Reward model updates as humans rate." },
  { t: "Regulatory Reports", d: "One-click PDF audit trails for SEC, EU AI Act, HIPAA, GDPR." },
  { t: "Multi-Cloud Bridge", d: "AWS, Azure, GCP, Snowflake. Data never leaves your cloud." },
  { t: "Labeler Reputation", d: "Accuracy-ranked leaderboard for human reviewers." },
];

const VersionView = ({
  badge,
  title,
  subtitle,
  features,
  onBack,
  extra,
}: {
  badge: string;
  title: string;
  subtitle: string;
  features: { t: string; d: string }[];
  onBack: () => void;
  extra?: ReactNode;
}) => (
  <div style={{ background: C.bg, minHeight: "100vh", color: C.text, ...sans }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 120px" }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: `1px solid ${C.border2}`,
          color: C.text,
          padding: "8px 14px",
          borderRadius: 8,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 48,
          ...sans,
        }}
      >
        ← Platform
      </button>
      <Reveal>
        <div style={{ ...mono, color: C.blue, fontSize: 12, letterSpacing: 2, marginBottom: 14 }}>
          NEURIX {badge}
        </div>
      </Reveal>
      <Reveal delay={80}>
        <h1
          style={{
            ...sans,
            fontSize: "clamp(36px,5.5vw,64px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
            marginBottom: 16,
          }}
        >
          {title}
        </h1>
      </Reveal>
      <Reveal delay={160}>
        <p style={{ color: C.muted, fontSize: 18, maxWidth: 720, margin: 0, marginBottom: 64 }}>{subtitle}</p>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {features.map((f, i) => (
          <Reveal key={f.t} delay={Math.min(i, 8) * 60}>
            <Card style={{ minHeight: 150 }}>
              <div style={{ ...mono, fontSize: 11, color: C.blue, marginBottom: 12 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 style={{ ...sans, fontSize: 17, fontWeight: 600, margin: 0, marginBottom: 8 }}>{f.t}</h3>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>{f.d}</p>
            </Card>
          </Reveal>
        ))}
      </div>
      {extra}
    </div>
  </div>
);

/* ---------- V3.5 Sticky showcase ---------- */
const v35Features = [
  {
    n: "01",
    t: "AI Firewall",
    sub: "The firewall between your app and the AI model.",
    bullets: [
      "Prompt injection detection",
      "Jailbreak blocking",
      "Unsafe output filtering",
      "Malformed response blocking",
      "Runtime protection layer",
    ],
    code: `{
  "event": "BLOCKED",
  "type": "prompt_injection",
  "severity": "critical",
  "action": "blocked + logged",
  "latency_added": "1.2ms"
}`,
  },
  {
    n: "02",
    t: "Prompt Regression Testing",
    sub: "Unit testing for LLM behavior.",
    bullets: [
      "Compare old vs new prompts",
      "Detect hallucination drift",
      "Formatting regression detection",
      "Reliability scoring",
      "Deployment risk warnings",
    ],
    code: `BEFORE v2.1 → reliability: 94.2%
AFTER  v2.2 → reliability: 87.1% ↓
null_rate:    0.3% → 8.1% ↑
risk:         LOW  → HIGH ⚠`,
  },
  {
    n: "03",
    t: "Self-Healing Structured Outputs",
    sub: "Structured outputs that don't break production.",
    bullets: [
      "JSON validation and schema enforcement",
      "Malformed output auto-repair",
      "Retry optimization",
      "Parser-safe formatting",
    ],
    code: `MALFORMED: {"user":"alex","score":null,"tags":[1,2,}
REPAIRED:  {"user":"alex","score":0,"tags":[1,2]}
repair_time: 1.8ms / confidence: 99.1%`,
  },
  {
    n: "04",
    t: "Live Failure Observability",
    sub: "Datadog for AI reliability.",
    bullets: [
      "Hallucination monitoring",
      "Schema failure tracking",
      "Latency monitoring",
      "Anomaly detection",
      "Email and Discord alerts",
    ],
    code: `reliability_score: 91.2% ↓ (-6.4)
schema_failures:   312% spike
alert_sent:        discord + email
detected:          before user report`,
  },
  {
    n: "05",
    t: "Automated Red Team Testing",
    sub: "Red-team your AI before attackers do.",
    bullets: [
      "Jailbreak simulations",
      "Prompt injection attacks",
      "Extraction attempt testing",
      "Adversarial prompt generation",
      "Vulnerability severity scoring",
    ],
    code: `jailbreak_attempt:  VULNERABLE ← critical
prompt_injection:   VULNERABLE ← critical
extraction_attack:  BLOCKED    ✓
overall_risk:       HIGH — patch before deploy`,
  },
];

const V35View = ({ onBack }: { onBack: () => void }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), total);
      const ratio = total > 0 ? passed / total : 0;
      const idx = Math.min(v35Features.length - 1, Math.floor(ratio * v35Features.length));
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const f = v35Features[active];

  return (
    <div style={{ background: C.bg, color: C.text, ...sans }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 48px" }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: `1px solid ${C.border2}`,
            color: C.text,
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 48,
            ...sans,
          }}
        >
          ← Platform
        </button>
        <Reveal>
          <div style={{ ...mono, color: C.blue, fontSize: 12, letterSpacing: 2, marginBottom: 14 }}>NEURIX V3.5</div>
        </Reveal>
        <Reveal delay={80}>
          <h1
            style={{
              ...sans,
              fontSize: "clamp(36px,5.5vw,64px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: 0,
              marginBottom: 16,
            }}
          >
            Production Runtime Infrastructure
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p style={{ color: C.muted, fontSize: 18, maxWidth: 720, margin: 0 }}>
            The reliability layer between your app and the AI model.
          </p>
        </Reveal>
      </div>

      <div
        ref={sectionRef}
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: `${v35Features.length * 90}vh`,
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 100,
            display: "grid",
            gridTemplateColumns: "minmax(220px, 320px) 1fr",
            gap: 48,
            alignItems: "start",
            paddingBottom: 80,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {v35Features.map((feat, i) => (
              <button
                key={feat.n}
                onClick={() => {
                  if (!sectionRef.current) return;
                  const rect = sectionRef.current.getBoundingClientRect();
                  const total = rect.height - window.innerHeight;
                  const target = window.scrollY + rect.top + (total * i) / v35Features.length;
                  window.scrollTo({ top: target + 2, behavior: "smooth" });
                }}
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "16px 18px",
                  borderLeft: `2px solid ${i === active ? C.blue : C.border}`,
                  color: i === active ? C.text : C.muted,
                  ...sans,
                  transition: "color .3s ease, border-color .3s ease",
                }}
              >
                <div style={{ ...mono, fontSize: 10, color: i === active ? C.blue : C.subtle, marginBottom: 4 }}>
                  {feat.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{feat.t}</div>
              </button>
            ))}
          </div>

          <div
            key={active}
            style={{
              animation: "neurixFadeIn .5s ease",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 32,
              minHeight: 460,
            }}
          >
            <div style={{ ...mono, color: C.blue, fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>
              FEATURE {f.n}
            </div>
            <h3 style={{ ...sans, fontSize: 32, fontWeight: 600, margin: 0, marginBottom: 10, letterSpacing: "-0.02em" }}>
              {f.t}
            </h3>
            <p style={{ color: C.muted, fontSize: 16, margin: 0, marginBottom: 24 }}>{f.sub}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 28 }}>
              {f.bullets.map((b) => (
                <li
                  key={b}
                  style={{
                    color: C.text,
                    fontSize: 14,
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.blue }} /> {b}
                </li>
              ))}
            </ul>
            <pre
              style={{
                ...mono,
                background: "#050505",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 18,
                fontSize: 12,
                color: "#cfd8e3",
                margin: 0,
                overflow: "auto",
                lineHeight: 1.6,
              }}
            >
              {f.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- transition wrapper ---------- */
const PageTransition = ({ k, children }: { k: string; children: ReactNode }) => (
  <div key={k} style={{ animation: "neurixPageIn .6s cubic-bezier(.2,.7,.1,1)" }}>
    {children}
  </div>
);

/* ---------- main ---------- */
type View = "home" | "v1" | "v2" | "v35";

const NeurixLanding = ({ onEnterApp }: { onEnterApp: () => void }) => {
  const [view, setView] = useState<View>("home");

  const goTo = useCallback((v: View) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setView(v);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, ...sans }}>
      <FontLoader />
      <style>{`
        @keyframes neurixPing {
          0% { transform: scale(1); opacity: .6; }
          75%,100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes neurixRotate {
          to { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes neurixFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes neurixPageIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::selection { background: ${C.blue}; color: white; }
      `}</style>

      <Nav onCTA={onEnterApp} />

      {view === "home" && (
        <PageTransition k="home">
          <Hero onCTA={onEnterApp} />

          {/* SECTION 2 — VERSION ENTRY */}
          <section id="platform" style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <SectionTitle eyebrow="THE PLATFORM" title="Three layers." subtitle="Full lifecycle protection for AI systems." />
            <VersionCards onEnter={goTo} />
          </section>

          {/* SECTION 3 — PROBLEM */}
          <section style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <SectionTitle title="AI systems fail silently." subtitle="By the time you notice, users already did." />
            <ProblemGrid />
          </section>

          {/* SECTION 3.5 — V3 INTERACTIVE */}
          <V3Section />

          {/* SECTION 4 — HOW IT WORKS */}
          <section id="features" style={{ padding: "120px 24px", maxWidth: 1100, margin: "0 auto" }}>
            <SectionTitle title="Simple to integrate. Serious in production." />
            <HowItWorks />
          </section>

          {/* SECTION 5 — USE CASES */}
          <section style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <SectionTitle title="Built for teams shipping production AI." />
            <UseCases />
          </section>

          {/* SECTION 6 — PROVIDERS */}
          <section style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <SectionTitle title="Works with the models you already use." />
            <Providers />
          </section>

          {/* SECTION 7 — TRUST */}
          <section id="docs" style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <SectionTitle title="Built for production." />
            <Trust />
          </section>

          {/* SECTION 8 — FINAL CTA */}
          <section
            id="pricing"
            style={{
              position: "relative",
              padding: "140px 24px",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at center, rgba(59,130,246,0.18), transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
              <Reveal>
                <h2
                  style={{
                    ...sans,
                    fontSize: "clamp(36px,5vw,60px)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Ship reliable AI systems.
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p style={{ color: C.muted, fontSize: 18, margin: 0, marginBottom: 32 }}>
                  Detect failures before your users do.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={onEnterApp}
                    style={{
                      background: C.blue,
                      color: "#fff",
                      border: "none",
                      padding: "12px 22px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      ...sans,
                    }}
                  >
                    Start Free Beta
                  </button>
                  <button
                    onClick={() => goTo("v1")}
                    style={{
                      background: "transparent",
                      color: C.text,
                      border: `1px solid ${C.border2}`,
                      padding: "12px 22px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      ...sans,
                    }}
                  >
                    Run Stress Test →
                  </button>
                </div>
              </Reveal>
            </div>
          </section>

          {/* footer */}
          <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 24px", color: C.muted }}>
            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <div style={{ ...sans, color: C.text, fontWeight: 700, letterSpacing: 0.5 }}>
                NEUR<span style={{ color: C.blue }}>IX</span>
              </div>
              <div style={{ display: "flex", gap: 24, ...sans }}>
                <span>Product</span>
                <span>Docs</span>
                <span>Blog</span>
                <span>Twitter</span>
              </div>
              <div style={{ ...mono, fontSize: 11 }}>© 2025 Neurix. All rights reserved.</div>
            </div>
          </footer>
        </PageTransition>
      )}

      {view === "v1" && (
        <PageTransition k="v1">
          <VersionView
            badge="V1"
            title="Pre-Deployment Testing"
            subtitle="Upload your AI model. Stress-test everything. Fix it. Ship it."
            features={v1Features}
            onBack={() => goTo("home")}
          />
        </PageTransition>
      )}

      {view === "v2" && (
        <PageTransition k="v2">
          <VersionView
            badge="V2"
            title="Model Intelligence"
            subtitle="17 Gemini-powered features. Understand your AI at depth."
            features={v2Features}
            onBack={() => goTo("home")}
            extra={
              <div style={{ marginTop: 64 }}>
                <div style={{ fontFamily: "'DM Mono', ui-monospace, monospace", fontSize: 12, color: "#3b82f6", letterSpacing: 2, marginBottom: 14 }}>
                  INTERACTIVE
                </div>
                <h2 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, marginBottom: 8, color: "#f5f5f5" }}>
                  Knowledge Distillation
                </h2>
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "#999999", margin: 0, marginBottom: 24, maxWidth: 640 }}>
                  Compress AI knowledge without losing reliability. Run a live distillation check below.
                </p>
                <DistillationDemo />
              </div>
            }
          />
        </PageTransition>
      )}

      {view === "v35" && (
        <PageTransition k="v35">
          <V35View onBack={() => goTo("home")} />
        </PageTransition>
      )}
    </div>
  );
};

export default NeurixLanding;
