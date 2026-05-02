import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from './components/Hero';
import EventDetails from './components/EventDetails';
import Countdown from './components/Countdown';
import OurStory from './components/OurStory';
import Gallery from './components/Gallery';
import RsvpForm from './components/RsvpForm';
import MapSection from './components/MapSection';
import Footer from './components/Footer';
import FallingPetals from './components/FallingPetals';
import Families from './components/Families';

const API = '/api';

export default function App() {
  const [event, setEvent] = useState(null);
  const [invite, setInvite] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetch(`${API}/event`).then(r => r.json()).then(setEvent);
    const inviteId = searchParams.get('invite');
    if (inviteId) {
      fetch(`${API}/invite/${inviteId}`).then(r => {
        if (r.ok) return r.json();
        return null;
      }).then(setInvite);
    }
  }, [searchParams]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <FallingPetals count={15} />
      <Hero event={event} />
      <Families />
      <Countdown targetDate={event.wedding_date} targetTime={event.wedding_time} />
      <EventDetails event={event} />
      <OurStory />
      <Gallery />
      <RsvpForm event={event} invite={invite} />
      <MapSection event={event} />
      <Footer event={event} />
    </div>
  );
}
