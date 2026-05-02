import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PhotoBanner() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetch('/api/photos/banner')
      .then(r => r.json())
      .then(files => setPhotos(files))
      .catch(() => {});
  }, []);

  if (photos.length === 0) return null;

  return (
    <section className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
      {/* Single banner image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0"
      >
        <img
          src={photos[0]}
          alt="Banner"
          className="w-full h-full object-cover object-top"
        />
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-cream" />

      {/* Decorative gold line at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>
    </section>
  );
}
