"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Load {
  id: string;
  created_at: string;
  escort_type: string;
  rate: number;
  status: string;
  is_external?: boolean;
  origin_state?: string;
  origin_city?: string;
  dest_state?: string;
  dest_city?: string;
  miles?: number;
}

export default function OpenLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        const { data, error } = await supabase
          .from("loads")
          .select("*")
          .eq("board_type", "open")
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
    const interval = setInterval(fetchLoads, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading...</div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Open Loads Board</h1>

      {loads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No loads posted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loads.map((load) => (
            <div
              key={load.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
              style={{ borderLeft: "4px solid #4caf50" }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{load.escort_type}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${load.rate}
                  </p>
                  <p className="text-xs text-gray-500">per mile</p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                {load.origin_city && (
                  <div className="flex justify-between">
                    <span className="font-medium">From</span>
                    <span>
                      {load.origin_city}, {load.origin_state}
                    </span>
                  </div>
                )}
                {load.dest_city && (
                  <div className="flex justify-between">
                    <span className="font-medium">To</span>
                    <span>
                      {load.dest_city}, {load.dest_state}
                    </span>
                  </div>
                )}
                {load.miles && load.miles > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Miles</span>
                    <span>{load.miles.toLocaleString()} mi</span>
                  </div>
                )}
              </div>

              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
