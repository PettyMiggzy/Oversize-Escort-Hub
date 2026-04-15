'use client';

import { useState } from 'react';

export default function HomePage() {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Fixed Fleet Manager handler
  const handleFleetClick = () => {
    window.location.href = "/join";
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-white">
      {/* Navigation Bar - keep your existing nav if any */}

      {/* WHO ARE YOU? Section */}
      <div className="pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight">WHO ARE YOU?</h1>
          <p className="text-xl text-zinc-400 mt-4">SELECT YOUR ROLE TO GET STARTED</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          {/* Oversize Carrier */}
          <div className="card bg-[#0f1318] border border-[#1c2229] rounded-xl p-8 hover:border-orange-500 transition cursor-pointer">
            <h3 className="text-2xl font-bold text-orange-500 mb-4">OVERSIZE CARRIER</h3>
            <p className="text-zinc-400 mb-8">Carriers hauling oversize/overweight loads who need permits, escorts, and load boards.</p>
            <div className="text-xs uppercase tracking-widest text-orange-400">POST LOADS · BID BOARD · FIND ESCORTS</div>
          </div>

          {/* Pilot Car / P/EVO */}
          <div className="card bg-[#0f1318] border border-[#1c2229] rounded-xl p-8 hover:border-amber-500 transition cursor-pointer">
            <h3 className="text-2xl font-bold text-amber-500 mb-4">PILOT CAR / P/EVO</h3>
            <p className="text-zinc-400 mb-8">Pilot car operators and P/EVO escorts looking for loads, routes, and work opportunities.</p>
            <div className="text-xs uppercase tracking-widest text-amber-400">FIND LOADS · DEADHEAD MINIMIZER · BID</div>
          </div>

          {/* Freight Broker */}
          <div className="card bg-[#0f1318] border border-[#1c2229] rounded-xl p-8 hover:border-emerald-500 transition cursor-pointer">
            <h3 className="text-2xl font-bold text-emerald-500 mb-4">FREIGHT BROKER</h3>
            <p className="text-zinc-400 mb-8">Licensed freight brokers who need verified P/EVO escorts for oversize shipments.</p>
            <div className="text-xs uppercase tracking-widest text-emerald-400">POST LOADS · FIND ESCORTS · MANAGE SHIPMENTS</div>
          </div>

          {/* FLEET MANAGER - FIXED */}
          <div 
            className="card bg-[#0f1318] border-2 border-blue-600 rounded-xl p-8 hover:border-blue-500 transition cursor-pointer"
            onClick={handleFleetClick}
          >
            <h3 className="text-2xl font-bold text-blue-500 mb-4">FLEET MANAGER</h3>
            <p className="text-zinc-400 mb-8">Manage multiple P/EVO escorts across loads. Find work for your fleet, track jobs, and maximize every mile.</p>
            <div className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-6">PRO REQUIRED</div>
            <div className="text-xs uppercase tracking-widest text-blue-400">FIND LOADS · FLEET DEADHEAD · MANAGE ESCORTS</div>
          </div>
        </div>
      </div>

      {/* Keep the rest of your original page code below this point */}
      {/* RoleBar, bid-strip, dashboards, etc. - paste your existing code here */}

    </div>
  );
}