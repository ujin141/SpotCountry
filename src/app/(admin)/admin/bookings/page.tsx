"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, CheckCircle, XCircle, Search, Clock, Trash2 } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id (email, name),
        tours (title)
      `)
      .order('created_at', { ascending: false });

    if (data) setBookings(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    if(!confirm(`Change status to ${newStatus}?`)) return;
    
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } else {
        alert("Failed to update status");
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.tours?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search tour or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Guests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
                <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>
            ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No bookings found.</td></tr>
            ) : (
                filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.profiles?.name || "Unknown"}</div>
                        <div className="text-sm text-gray-500">{booking.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{booking.tours?.title}</div>
                        <div className="text-xs text-gray-500">{booking.total_price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{booking.booking_date}</div>
                        <div>{booking.guests} guests</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {booking.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {booking.status !== 'confirmed' && (
                            <button 
                                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                className="text-green-600 hover:text-green-900"
                                title="Confirm"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        )}
                        {booking.status !== 'cancelled' && (
                            <button 
                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
