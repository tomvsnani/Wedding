import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Countdown({ targetDate, targetTime }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const parseTime = (t) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return { h: 10, m: 0 };
      let h = parseInt(match[1]);
      const min = parseInt(match[2]);
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return { h, m: min };
    };

    const { h, m } = parseTime(targetTime);
    const target = new Date(targetDate + 'T00:00:00');
    target.setHours(h, m, 0, 0);

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  const blocks = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINS', value: timeLeft.minutes },
    { label: 'SECS', value: timeLeft.seconds },
  ];

  return (
    <section className="w-full">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-maroon py-10 md:py-14"
      >
        <p className="text-center text-white/70 tracking-[0.3em] uppercase text-xs md:text-sm mb-8 font-body">
          Counting Down to the Celebration
        </p>
        <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6 px-4">
          {blocks.map((b, i) => (
            <div key={b.label} className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <span className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold leading-none">
                  {String(b.value).padStart(2, '0')}
                </span>
                <span className="text-white/50 text-[10px] sm:text-xs tracking-[0.2em] mt-2 font-body">{b.label}</span>
              </div>
              {i < blocks.length - 1 && (
                <span className="text-gold-light text-2xl md:text-3xl font-bold mb-4">:</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
