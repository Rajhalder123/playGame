export default function Footer() {
  return (
    <footer className="mt-8">
      {/* Main Footer */}
      <div className="bg-brand-surface border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-lime to-brand-accent rounded-lg flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">
                  Play <span className="text-brand-lime">Adda</span>
                </span>
              </div>
              <p className="text-sm text-brand-muted leading-relaxed">
                Your ultimate destination for sports betting and online gaming. Experience the thrill of live matches and win big.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {["Home", "Inplay", "Sportsbook", "Casino", "Multi Markets"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-brand-muted hover:text-brand-lime transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Sports */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Popular Sports
              </h4>
              <ul className="space-y-2">
                {["Cricket", "Football", "Tennis", "Basketball", "Kabaddi"].map(
                  (sport) => (
                    <li key={sport}>
                      <a
                        href="#"
                        className="text-sm text-brand-muted hover:text-brand-lime transition-colors duration-200"
                      >
                        {sport}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-2">
                {[
                  "Help Center",
                  "Terms & Conditions",
                  "Privacy Policy",
                  "Responsible Gaming",
                  "Contact Us",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-brand-muted hover:text-brand-lime transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-brand-teal/80 border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-sm text-brand-lime font-semibold tracking-wider uppercase">
            Rules & Regulations © 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
