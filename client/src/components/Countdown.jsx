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
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <section className="w-full py-16 md:py-20 bg-gradient-to-b from-cream to-cream-dark">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="section-container text-center"
      >
        <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-10">Counting Down To</p>
        <div className="flex justify-center gap-4 sm:gap-6 md:gap-10">
          {blocks.map((b) => (
            <div key={b.label} className="flex flex-col items-center">
              <div className="w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 rounded-xl bg-white border border-gold/30 shadow-lg flex items-center justify-center mb-3">
                <span className="font-heading text-3xl sm:text-4xl md:text-5xl text-maroon font-bold">
                  {String(b.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-gold-dark text-[10px] sm:text-xs md:text-sm tracking-widest uppercase font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
