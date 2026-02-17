"use client";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="mx-auto relative h-16 w-16 mb-6">
          <Image 
            src="/logo.png" 
            alt="SpotCountry Logo" 
            fill
            className="object-contain"
            priority
            sizes="64px"
          />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to access your travel plans
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {loading ? (
           <div className="flex justify-center py-12">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
           </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleLogin('google')}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.0003 20.45c4.6667 0 7.8465-3.2385 7.8465-8.0468 0-.6608-.0638-1.2847-.1683-1.875H12.0003v3.525h4.4373c-.1943 1.1394-1.2585 3.1905-4.4373 3.1905-2.6738 0-4.869-2.1645-4.869-4.8383 0-2.6737 2.1952-4.8383 4.869-4.8383 1.254 0 2.3325.4373 3.1905 1.2465l2.5155-2.5155C16.1418 4.752 14.2233 3.9 12.0003 3.9 7.5258 3.9 3.9 7.5258 3.9 12s3.6258 8.1 8.1003 8.1z"
                  fill="#4285F4"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleLogin('github')}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#24292F] px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#24292F]/90 transition-all"
            >
              <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with GitHub
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Not a member?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:text-indigo-500">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
