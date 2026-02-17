import Link from "next/link";
import { Users, Globe, ShieldCheck } from "lucide-react";
import AdBanner from "@/components/AdBanner"; // 광고 컴포넌트

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-12 sm:py-24 lg:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            We Connect Travelers <span className="text-primary">Globally</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            SpotCountry helps you find real-time information, trusted travel buddies, and local experiences anywhere in the world.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Travel Smart</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why use SpotCountry?
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Globe className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Real-time Info
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                See who is online and what's happening right now in your destination.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Users className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Travel Buddies
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Find verified companions for meals, tours, or splitting costs.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Safe & Verified
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Our verification system ensures you meet real, trusted travelers.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 🟢 광고: 소개 페이지 하단 (New) */}
      <AdBanner position="about-bottom" className="mb-12" />
    </div>
  );
}
