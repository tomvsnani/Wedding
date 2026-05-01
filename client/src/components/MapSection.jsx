import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

export default function MapSection({ event }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_name + ' ' + event.venue_address)}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(event.venue_lng) - 0.01}%2C${Number(event.venue_lat) - 0.008}%2C${Number(event.venue_lng) + 0.01}%2C${Number(event.venue_lat) + 0.008}&layer=mapnik&marker=${event.venue_lat}%2C${event.venue_lng}`;

  return (
    <section id="map" className="w-full py-20 md:py-28 bg-gradient-to-b from-cream to-cream-dark">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">Find Your Way</p>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl text-maroon font-bold">Venue Location</h2>
          <div className="ornament"><span className="text-gold">✦</span></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gold/20 max-w-5xl mx-auto"
        >
          <div className="aspect-video md:aspect-[21/9]">
            <iframe
              title="Venue Location"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-center sm:text-left">
              <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0 hidden sm:block" />
              <div>
                <p className="font-heading text-lg md:text-xl text-maroon font-semibold">{event.venue_name}</p>
                <p className="text-sm text-gray-500 mt-1">{event.venue_address}</p>
              </div>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-dark to-gold text-white font-medium text-sm tracking-wide shadow hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 shrink-0"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
