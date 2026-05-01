import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function EventDetails({ event }) {
  const items = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Date',
      detail: new Date(event.wedding_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Time',
      detail: event.wedding_time,
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Venue',
      detail: event.venue_name,
      sub: event.venue_address,
    },
  ];

  return (
    <section id="details" className="w-full py-20 md:py-28">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-16"
        >
          <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">Celebration Details</p>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl text-maroon font-bold">Wedding Ceremony</h2>
          <div className="ornament"><span className="text-gold">✦</span></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-8 md:p-10 text-center shadow-md border border-gold/10 hover:shadow-xl hover:border-gold/30 transition-all duration-300 corner-decor"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-cream flex items-center justify-center text-gold">
                {item.icon}
              </div>
              <h3 className="font-heading text-sm md:text-base text-gold-dark font-semibold tracking-[0.2em] uppercase mb-3">{item.title}</h3>
              <p className="font-heading text-xl md:text-2xl text-maroon font-semibold leading-snug">{item.detail}</p>
              {item.sub && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.sub}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
