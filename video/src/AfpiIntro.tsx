import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BLUE = "#1F4E96";
const DARK = "#0F2A52";
const CYAN = "#16A1DC";
const RED = "#E2091C";
const FONT = "'Helvetica Neue', Arial, sans-serif";

const DOMAINS = [
  { label: "Maintenance", color: CYAN },
  { label: "Chaudronnerie, tuyauterie, soudage", color: RED },
  { label: "Sécurité", color: CYAN },
  { label: "Tertiaire", color: RED },
];

const Gear: React.FC<{
  size: number;
  x: number;
  y: number;
  speed: number;
  opacity?: number;
}> = ({ size, x, y, speed, opacity = 0.12 }) => {
  const frame = useCurrentFrame();
  const teeth = 12;
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-r} ${-r} ${size} ${size}`}
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        opacity,
        transform: `rotate(${frame * speed}deg)`,
      }}
    >
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={-r * 0.09}
          y={-r}
          width={r * 0.18}
          height={r * 0.2}
          fill="#fff"
          transform={`rotate(${(360 / teeth) * i})`}
        />
      ))}
      <circle r={r * 0.85} fill="none" stroke="#fff" strokeWidth={r * 0.14} />
      <circle r={r * 0.3} fill="none" stroke="#fff" strokeWidth={r * 0.06} />
    </svg>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 80;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BLUE}, ${DARK})`,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `${shift}px ${shift}px`,
        }}
      />
      <Gear size={620} x={1700} y={900} speed={0.6} />
      <Gear size={360} x={1330} y={1000} speed={-1.0} />
      <Gear size={440} x={150} y={140} speed={-0.5} />
    </AbsoluteFill>
  );
};

const fadeOut = (frame: number, duration: number, len = 12) =>
  interpolate(frame, [duration - len, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = 100;
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const barW = interpolate(frame, [10, 40], [0, 360], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sub = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        color: "#fff",
        opacity: fadeOut(frame, dur),
      }}
    >
      <div
        style={{
          fontSize: 300,
          fontWeight: 800,
          letterSpacing: 8,
          transform: `scale(${0.6 + 0.4 * pop})`,
          opacity: pop,
        }}
      >
        AFPI
      </div>
      <div style={{ height: 10, width: barW, background: RED, margin: "8px 0 28px" }} />
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 24}px)`,
        }}
      >
        Région Dunkerquoise
      </div>
      <div
        style={{
          fontSize: 34,
          marginTop: 22,
          opacity: sub * 0.85,
          color: "#CFE6F7",
        }}
      >
        La fabrique de l’avenir
      </div>
    </AbsoluteFill>
  );
};

const Domains: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = 110;
  const head = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        color: "#fff",
        padding: "120px 200px",
        opacity: fadeOut(frame, dur),
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          opacity: head,
          transform: `translateX(${(1 - head) * -60}px)`,
          marginBottom: 70,
        }}
      >
        Nos domaines de formation
      </div>
      {DOMAINS.map((d, i) => {
        const p = spring({ frame: frame - 12 - i * 10, fps, config: { damping: 15 } });
        return (
          <div
            key={d.label}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 36,
              opacity: p,
              transform: `translateX(${(1 - p) * 140}px)`,
            }}
          >
            <div
              style={{
                width: 22,
                height: 90,
                background: d.color,
                marginRight: 40,
                transform: `scaleY(${p})`,
              }}
            />
            <div style={{ fontSize: 68, fontWeight: 600 }}>{d.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 16 } });
  const text = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 36,
          borderRadius: 12,
          transform: `scale(${0.8 + 0.2 * logo})`,
          opacity: logo,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <Img src={staticFile("logo-afpi.png")} style={{ width: 760, display: "block" }} />
      </div>
      <div
        style={{
          marginTop: 60,
          textAlign: "center",
          opacity: text,
          transform: `translateY(${(1 - text) * 30}px)`,
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800 }}>www.afpi-formation.com</div>
        <div style={{ fontSize: 52, fontWeight: 600, marginTop: 14, color: "#CFE6F7" }}>
          03 28 60 80 30
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AfpiIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence durationInFrames={100} premountFor={15}>
        <Title />
      </Sequence>
      <Sequence from={100} durationInFrames={110} premountFor={15}>
        <Domains />
      </Sequence>
      <Sequence from={210} durationInFrames={90} premountFor={15}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
