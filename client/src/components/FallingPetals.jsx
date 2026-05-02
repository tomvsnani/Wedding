import { useMemo } from 'react';

const petalColors = ['#C4706F', '#B5635A', '#C98A6E', '#B8860B', '#A8624A', '#9E5B4A'];

export default function FallingPetals({ count = 18 }) {
  const petals = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 14 + Math.random() * 14,
      fallDuration: 10 + Math.random() * 15,
      swayDuration: 3 + Math.random() * 5,
      delay: Math.random() * 2,
      color: petalColors[i % petalColors.length],
      rotation: Math.random() * 360,
      opacity: 0.7 + Math.random() * 0.3,
    })), [count]
  );

  return (
    <div className="petal-container">
      {petals.map(p => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.fallDuration}s, ${p.swayDuration}s`,
            animationDelay: `${p.delay}s, ${p.delay + 0.5}s`,
          }}
        >
          <svg
            width={p.size}
            height={p.size}
            viewBox="0 0 20 20"
            style={{ opacity: p.opacity, transform: `rotate(${p.rotation}deg)` }}
          >
            <ellipse cx="10" cy="8" rx="5" ry="8" fill={p.color} />
            <ellipse cx="8" cy="10" rx="8" ry="4" fill={p.color} opacity="0.7" />
          </svg>
        </div>
      ))}
    </div>
  );
}
