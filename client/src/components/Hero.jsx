import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.2, duration: 0.8, ease: 'easeOut' } }),
};

export default function Hero({ event }) {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center paisley-bg">
      {/* Gold double border frame */}
      <div className="absolute inset-3 sm:inset-5 md:inset-8 lg:inset-12 gold-border-outer rounded pointer-events-none" />
      <div className="absolute inset-5 sm:inset-7 md:inset-11 lg:inset-15 gold-border-inner rounded pointer-events-none" />

      {/* Corner gold dots */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-7 md:top-11 md:left-11 w-2 h-2 rounded-full bg-gold pointer-events-none" />
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 md:top-11 md:right-11 w-2 h-2 rounded-full bg-gold pointer-events-none" />
      <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 md:bottom-11 md:left-11 w-2 h-2 rounded-full bg-gold pointer-events-none" />
      <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 md:bottom-11 md:right-11 w-2 h-2 rounded-full bg-gold pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-6 py-16">
        {/* Om symbol */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} className="mb-2">
          <span className="text-maroon text-4xl md:text-5xl font-heading" style={{ fontFamily: 'serif' }}>ॐ</span>
        </motion.div>

        {/* Shubh Vivah */}
        <motion.p custom={0.5} initial="hidden" animate="visible" variants={fadeUp}
          className="text-gold-dark tracking-[0.2em] uppercase text-xs md:text-sm mb-6 text-center font-heading">
          Shubh Vivah · శుభ వివాహం
        </motion.p>

        {/* Ganesha */}
      <img src="data:image/jpeg;base64,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"/>

        {/* Together line */}
        <motion.p custom={1.5} initial="hidden" animate="visible" variants={fadeUp}
          className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm font-body mb-6 text-center">
          Together with their families
        </motion.p>

        {/* Couple Names */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-4 w-full">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-maroon font-bold leading-tight">
            {event.groom_name}
          </h1>
          <p className="font-script text-3xl md:text-4xl text-gold my-2">&</p>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-maroon font-bold leading-tight">
            Sahasra Mattapelli
          </h1>
        </motion.div>

        {/* Telugu names */}
        <motion.div custom={2.5} initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-6">
          <p className="font-heading text-lg md:text-xl text-gold-dark italic">
            రాము పిన్నింటి & సహస్ర మట్టపల్లి
          </p>
        </motion.div>

        <div className="ornament">
          <span className="text-gold text-sm">◆</span>
        </div>

        {/* Invitation message */}
        <motion.p custom={3} initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl text-center font-heading text-lg md:text-xl text-maroon/70 italic leading-relaxed">
          {event.invitation_message}
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 text-gold/50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </motion.div>
    </section>
  );
}
