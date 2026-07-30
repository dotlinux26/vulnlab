import { useMemo } from "react";

const ShootingStars = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 80}%`,
        right: `${Math.random() * 80}%`,
        delay: `${i * 0.5 + Math.random()}s`,
        duration: `${2.5 + Math.random()}s`,
      })),
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute h-[2px] rounded-full opacity-0"
          style={{
            top: s.top,
            right: s.right,
            background:
              "linear-gradient(45deg, hsl(var(--neon-purple) / 0.8), hsl(var(--neon-blue) / 0.2), transparent)",
            filter: "drop-shadow(0 0 6px hsl(var(--neon-purple) / 0.5))",
            animation: `shooting-star ${s.duration} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default ShootingStars;
