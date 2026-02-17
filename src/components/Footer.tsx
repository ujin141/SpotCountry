export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            SpotCountry
          </span>
          <p className="text-sm text-gray-500 max-w-xs">
            Safe travels start here. Your ultimate guide to every country.
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>
        
        <div className="text-xs text-gray-400">
          © {new Date().getFullYear()} SpotCountry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
