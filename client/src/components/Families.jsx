import { motion } from 'framer-motion';

export default function Families() {
  return (
    <section className="w-full py-12 md:py-16 bg-cream-dark/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="section-container text-center"
      >
        <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-8 font-body">
          Blessed by
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-20 max-w-3xl mx-auto">
          {/* Groom's family */}
          <div className="flex-1">
            <h3 className="text-gold-dark tracking-[0.2em] uppercase text-xs font-bold mb-3 font-body">
              Pinninti Family
            </h3>
            <p className="font-heading text-lg text-maroon/80">Mr. VeeraRao Pinninti</p>
            <p className="font-heading text-lg text-maroon/80">& Mrs. Vijaya Pinninti</p>
          </div>

          {/* Bride's family */}
          <div className="flex-1">
            <h3 className="text-gold-dark tracking-[0.2em] uppercase text-xs font-bold mb-3 font-body">
              Mattapelly Family
            </h3>
            <p className="font-heading text-lg text-maroon/80">Mr. Gopal Rao Mattapelly</p>
            <p className="font-heading text-lg text-maroon/80">& Mrs. Shoba Rani Mattapelly</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
