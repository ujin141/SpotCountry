"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Calendar, Users, CheckCircle } from "lucide-react";

interface Tour {
  id: number;
  price: string; // e.g. "$50"
  title: string;
}

export default function TourBookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Parse price (remove '$' and convert to number)
  const pricePerPerson = parseInt(tour.price.replace(/[^0-9]/g, "")) || 0;
  const totalPrice = pricePerPerson * guests;

  const handleReserve = async () => {
    if (!user) {
      if (confirm("Login is required to book a tour.\nGo to login page?")) {
        router.push("/login");
      }
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      tour_id: tour.id,
      booking_date: date,
      guests: guests,
      total_price: `$${totalPrice}`,
      status: "confirmed", // Auto-confirm for MVP
    });

    if (!error) {
      setSuccess(true);
    } else {
      alert("Booking failed. Please try again.");
      console.error(error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
        <div className="flex justify-center mb-3">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Booking Confirmed!</h3>
        <p className="text-green-700 mb-4">
          You have successfully booked <strong>{tour.title}</strong>.
        </p>
        <div className="bg-white p-3 rounded-lg border border-green-200 text-left text-sm text-green-800 space-y-1 mb-4">
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Guests:</strong> {guests} people</p>
            <p><strong>Total:</strong> ${totalPrice}</p>
        </div>
        <button 
            onClick={() => setSuccess(false)}
            className="text-sm font-bold text-green-700 hover:underline"
        >
            Book another date
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="text-sm text-gray-500 mb-1">Price per person</div>
      <div className="text-2xl font-bold text-gray-900 flex items-center gap-1 mb-6">
        {tour.price}
        <span className="text-sm font-normal text-gray-500">/ day</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4" /> Guests
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-gray-900 font-bold">
          <span>Total</span>
          <span className="text-xl text-primary">${totalPrice}</span>
        </div>

        <button
          onClick={handleReserve}
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reserve Now"}
        </button>
        
        <p className="text-xs text-center text-gray-400 mt-2">
            No payment required today.
        </p>
      </div>
    </div>
  );
}
