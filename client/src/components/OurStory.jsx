import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const defaultStory = [
  "Ramu and Sahasra came together through an arranged marriage, both from small villages in Telangana, India, each carrying their own dreams and perspectives about life. Their families, who shared the same values and vision, encouraged them to speak just once — and that one conversation quietly changed everything.",
  "Their first meeting happened at a temple in Dallas, where they had both been living just miles apart without knowing it. That moment felt peaceful and genuine — a soft beginning to something beautiful. Sahasra's warmth, grace, and grounded nature complemented Ramu's ambition, honesty, and quiet sincerity. From the very start, there was a comfort between them that felt natural and easy.",
  "Being in the same city turned out to be a quiet blessing. They began meeting regularly — over meals, at temples, and on long drives through Dallas — and with each meeting, their bond grew a little deeper. What could have remained a formal arrangement quickly became something they both looked forward to, filled with laughter, shared stories, and a growing sense of togetherness.",
  "Over the months that followed, they learned to understand each other's worlds — she showed him the beauty in slowing down and being present, while he shared his drive and dedication. They made adjustments for each other with open hearts, finding joy in compromise and growing closer with every passing day. What made their bond special was how willingly they came to the same page, always with respect and happiness.",
  "Today, they look back at their journey with gratitude — two people from similar roots who found each other at just the right time, built something meaningful together, and are now ready to begin the most beautiful chapter of their lives surrounded by the love and blessings of their families and friends.",
];

export default function OurStory({ paragraphs = defaultStory }) {
  const [couplePhoto, setCouplePhoto] = useState(null);

  useEffect(() => {
    fetch('/api/photos/couple')
      .then(r => r.json())
      .then(files => { if (files.length > 0) setCouplePhoto(files[0]); })
      .catch(() => {});
  }, []);

  return (
    <section className="w-full py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream-dark/50 to-cream" />
      <div className="absolute inset-0 paisley-bg" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">How It All Began</p>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl text-maroon font-bold">Our Story</h2>
          <div className="ornament"><span className="text-gold text-sm">◆</span></div>
        </motion.div>

        {/* Story card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            {/* Gold border frame */}
            <div className="absolute inset-0 rounded-2xl border-2 border-gold/20 pointer-events-none" />
            <div className="absolute inset-2 rounded-xl border border-gold/10 pointer-events-none" />

            {/* Corner ornaments */}
            <div className="absolute top-4 left-5 text-gold/30 text-xl font-heading">✦</div>
            <div className="absolute top-4 right-5 text-gold/30 text-xl font-heading">✦</div>
            <div className="absolute bottom-4 left-5 text-gold/30 text-xl font-heading">✦</div>
            <div className="absolute bottom-4 right-5 text-gold/30 text-xl font-heading">✦</div>

            {/* Content */}
            <div className="px-8 py-12 sm:px-12 sm:py-14 md:px-16 md:py-16">
              {/* Opening quote mark */}
              <div className="text-center mb-8">
                <span className="font-script text-6xl md:text-7xl text-gold/30 leading-none select-none">"</span>
              </div>

              {/* Optional couple photo */}
              {couplePhoto && (
                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <img
                      src={couplePhoto}
                      alt="Couple"
                      className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover shadow-lg border-4 border-white"
                    />
                    {/* Decorative ring around photo */}
                    <div className="absolute -inset-2 rounded-full border border-gold/20 pointer-events-none" />
                    <div className="absolute -inset-4 rounded-full border border-gold/10 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Story paragraphs */}
              <div className="space-y-6">
                {paragraphs.map((paragraph, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.6 }}
                    className="font-heading text-base md:text-lg text-gray-700 leading-relaxed md:leading-loose text-center italic"
                  >
                    {i === 0 && (
                      <span className="font-heading text-3xl md:text-4xl text-maroon not-italic float-left mr-2 -mt-1 leading-none">
                        {paragraph.charAt(0)}
                      </span>
                    )}
                    {i === 0 ? paragraph.slice(1) : paragraph}
                  </motion.p>
                ))}
              </div>

              {/* Closing heart divider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="flex items-center justify-center gap-4 mt-10"
              >
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
                <Heart className="w-5 h-5 text-maroon/40 fill-maroon/40" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
