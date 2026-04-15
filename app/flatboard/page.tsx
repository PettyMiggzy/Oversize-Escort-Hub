"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Load {
  id: string;
  created_at: string;
  origin: { state: string; city: string };
  dest: { state: string; city: string };
  escort_type: string;
  rate: number;
  board_type: string;
  status: string;
  miles: number;
}

export default function FlatboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    getUser();

    const fetchLoads = async () => {
      try {
        const { data, error } = await supabase
          .from("loads")
          .select("*")
          .eq("board_type", "flat")
          .eq("status", "open")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setLoads(data ?? []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoads();
    const interval = setInterval(fetchLoads, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading flatboard...</div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Flatboard</h1>
      <p className="text-gray-600 mb-6">
        Flat-rate load postings available for escort.
      </p>

      {loads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No flatboard loads posted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loads.map((load) => (
            <div
              key={load.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
              style={{ borderLeft: "4px solid #2563eb" }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{load.escort_type}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Flat Rate
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ${load.rate}
                  </p>
                  <p className="text-xs text-gray-500">flat</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">From</span>
                  <span>
                    {load.origin?.city}, {load.origin?.state}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">To</span>
                  <span>
                    {load.dest?.city}, {load.dest?.state}
                  </span>
                </div>
                {load.miles > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Miles</span>
                    <span>{load.miles.toLocaleString()} mi</span>
                  </div>
                )}
              </div>

              {user ? (
                <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                  Request Load
                </button>
              ) : (
                <a
                  href="/signin"
                  className="mt-4 block w-full text-center border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 rounded-lg transition"
                >
                  Sign in to Request
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
