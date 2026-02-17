"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Calendar, MapPin, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export default function MyBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          tours (
            title,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setBookings(data);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-6">Explore our tours and make your first reservation!</p>
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-blue-900 transition-colors">
            Explore Tours
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-colors">
              {/* Image */}
              <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {booking.tours?.image_url ? (
                  <img src={booking.tours.image_url} alt={booking.tours.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">NO IMAGE</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{booking.tours?.title || "Unknown Tour"}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {booking.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> :
                         booking.status === 'cancelled' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {booking.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    {booking.tours?.location || "Unknown Location"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                        <span className="text-gray-500 block text-xs">Date</span>
                        <span className="font-semibold text-gray-900">{booking.booking_date}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs">Guests</span>
                        <span className="font-semibold text-gray-900">{booking.guests} people</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs">Total</span>
                        <span className="font-bold text-primary">{booking.total_price}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
