const EclipseOrb = ({ size = "lg" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: { orb: "w-[200px] h-[200px]", glow: "w-[350px] h-[350px]" },
    md: { orb: "w-[300px] h-[300px]", glow: "w-[500px] h-[500px]" },
    lg: { orb: "w-[400px] h-[400px]", glow: "w-[700px] h-[700px]" },
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`absolute ${sizes[size].glow} rounded-full animate-pulse-neon`}
        style={{
          background: "radial-gradient(circle, hsl(var(--neon-purple)) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className={`relative ${sizes[size].orb} rounded-full bg-background`}
        style={{
          boxShadow:
            "inset -20px -20px 80px hsl(var(--neon-purple) / 0.15), 0 0 50px hsl(var(--neon-blue) / 0.3)",
        }}
      />
    </div>
  );
};

export default EclipseOrb;
