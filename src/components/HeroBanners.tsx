import Image from "next/image";

export default function HeroBanners() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Bonus Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-dark via-brand-green/60 to-brand-dark min-h-[280px] group cursor-pointer">
        <Image
          src="/hero-bonus.png"
          alt="500% Joining Bonus"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
          priority
        />
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full p-6 md:p-8">
          <p className="text-sm text-brand-lime font-semibold tracking-wider uppercase mb-1">
            Limited Offer
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-1">
            Get <span className="text-gradient-gold">500%</span>
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Joining Bonus
          </h3>
          <a
            href="#"
            className="inline-flex items-center gap-2 w-fit px-6 py-3 bg-white text-brand-dark text-sm font-bold rounded-xl hover:bg-brand-lime hover:text-black transition-all duration-300 shadow-lg"
          >
            Deposit Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Affiliate Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-green via-brand-green-light/60 to-brand-teal min-h-[280px] group cursor-pointer">
        <Image
          src="/hero-affiliate.png"
          alt="Join Our Affiliate Program"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          style={{ objectPosition: "right 15%" }}
          priority
        />
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-brand-green/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full p-6 md:p-8">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-1 text-white">
            Join Our Affiliate
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Program
          </h3>
          <p className="text-sm text-brand-lime border border-brand-lime/40 rounded-full px-4 py-1 w-fit mb-4 backdrop-blur-sm">
            & Earn daily commission
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 w-fit px-6 py-3 bg-white text-brand-dark text-sm font-bold rounded-xl hover:bg-brand-lime hover:text-black transition-all duration-300 shadow-lg"
          >
            Join Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
