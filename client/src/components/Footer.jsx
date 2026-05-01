import { Heart, Share2 } from 'lucide-react';

export default function Footer({ event }) {
  const whatsappText = encodeURIComponent(
    `You're invited to ${event.groom_name} & ${event.bride_name}'s wedding! 🎉\n${new Date(event.wedding_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${event.wedding_time}\n📍 ${event.venue_name}\n\nRSVP: ${window.location.origin}`
  );

  return (
    <footer className="w-full py-14 md:py-16 bg-maroon text-white/80">
      <div className="section-container text-center">
        <h3 className="font-script text-3xl sm:text-4xl md:text-5xl text-gold-light mb-4">
          {event.groom_name.split(' ')[0]} & {event.bride_name.split('(')[0].trim()}
        </h3>
        <p className="text-sm text-white/50 mb-8">
          {new Date(event.wedding_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors mb-10"
        >
          <Share2 className="w-4 h-4" />
          Share via WhatsApp
        </a>

        <div className="border-t border-white/10 pt-8">
          <p className="text-xs text-white/40 flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for our special day
          </p>
        </div>
      </div>
    </footer>
  );
}
