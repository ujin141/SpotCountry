import TourBookingWidget from "@/components/TourBookingWidget";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, User, Calendar } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TourDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .single();

  if (!tour) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back Button */}
      <Link 
        href={`/country/${tour.location.toLowerCase()}`} 
        className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Listings
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Hero Image */}
        <div className="h-64 md:h-96 bg-gray-200 relative">
          {tour.image_url ? (
            <img 
              src={tour.image_url} 
              alt={tour.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
              NO IMAGE AVAILABLE
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            4.9 (128 reviews)
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                {tour.location}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tour.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                Hosted by <span className="font-semibold text-gray-900">{tour.host}</span>
              </div>
            </div>
            
            {/* Booking Widget (Mobile: will stack, Desktop: right side but logic is separate, wait layout) */}
            {/* Actually, the layout has sidebar below. Let's keep the header clean and put widget in sidebar. */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">About this tour</h2>
                <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                  {tour.description || "No description provided for this tour yet. Please contact the host for more details."}
                </div>
              </section>

              {/* Itinerary */}
              <section className="border-t border-gray-100 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <h3 className="font-bold text-gray-900">09:00 AM - Meeting</h3>
                      <p className="text-sm text-gray-500">Meet at the central station exit 4.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <h3 className="font-bold text-gray-900">10:30 AM - First Stop</h3>
                      <p className="text-sm text-gray-500">Explore the historical landmark and take photos.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">01:00 PM - Lunch & End</h3>
                      <p className="text-sm text-gray-500">Enjoy local food and conclude the tour.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar / Booking Widget */}
            <div className="space-y-6">
              <TourBookingWidget tour={tour} />
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Availability
                </h3>
                <p className="text-sm text-blue-700">
                  This tour is available daily. Please book at least 24 hours in advance.
                </p>
              </div>
              
              {/* Ad Banner */}
              <AdBanner position="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
