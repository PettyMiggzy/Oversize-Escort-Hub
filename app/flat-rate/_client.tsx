"use client";
import SiteHeader from '@/components/SiteHeader';

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';

interface Load {
  id: string;
    created_at: string;
      escort_type: string;
        rate: number;
          status: string;
            origin_city?: string;
              origin_state?: string;
                dest_city?: string;
                  dest_state?: string;
                  }
                  
                  export function FlatRateBoardClient() {
                    const [loads, setLoads] = useState<Load[]>([]);
                      const [loading, setLoading] = useState(true);
                      
                        useEffect(() => {
                            const fetchLoads = async () => {
                                  try {
                                          const supabase = createClient();
                                                                      
                                                                              const { data, error } = await supabase
                                                                                        .from("loads")
                                                                                                  .select("*")
                                                                                                            .eq("board_type", "flat-rate")
                                                                                                                      .eq("status", "open");
                                                                                                                      
                                                                                                                              if (error) {
                                                                                                                                        console.error("Error fetching loads:", error);
                                                                                                                                                } else {
                                                                                                                                                          setLoads((data || [])
      .filter((load: any) => {
        if (!load.deadhead_notified_at) return true
        return new Date(load.deadhead_notified_at).getTime() + 5 * 60 * 1000 <= Date.now()
      }));
                                                                                                                                                                  }
                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                console.error("Fetch error:", err);
                                                                                                                                                                                      } finally {
                                                                                                                                                                                              setLoading(false);
                                                                                                                                                                                                    }
                                                                                                                                                                                                        };
                                                                                                                                                                                                        
                                                                                                                                                                                                            fetchLoads();
                                                                                                                                                                                                              }, []);
                                                                                                                                                                                                              
                                                                                                                                                                                                                if (loading) {
    return (
      <>
        <SiteHeader />
        <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc', textAlign: 'center' }}>
          Loading...
        </div>
      </>
    );
  }
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                if (loads.length === 0) {
    return (
      <>
        <SiteHeader />
        <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc', textAlign: 'center' }}>
          No loads posted yet.
        </div>
      </>
    );
  }
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                return (
                                                                                                                                                                                                                                                                                    <>
                                                                                                                                                                                                                                                                                    <SiteHeader />
                                                                                                                                                                                                                                                                                    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc' }}>
                                                                                                                                                                                                                                                                                          <h1>Flat Rate Board</h1>
                                                                                                                                                                                                                                                                                                <div style={{ marginTop: "20px" }}>
                                                                                                                                                                                                                                                                                                        {loads.map((load) => (
                                                                                                                                                                                                                                                                                                                  <div
                                                                                                                                                                                                                                                                                                                              key={load.id}
                                                                                                                                                                                                                                                                                                                                          style={{
        background: 'var(--p1, #111)',
        border: '1px solid #222',
        borderLeft: '3px solid #f0a500',
        padding: '16px 20px',
        marginBottom: '12px',
        borderRadius: '4px',
      }}
                                                                                                                                                                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                                                                                                                                                                    <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                  <strong>Route:</strong> {load.origin_city}, {load.origin_state} →{" "}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                {load.dest_city}, {load.dest_state}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <strong>Escort Type:</strong> {load.escort_type}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <strong>Rate:</strong> ${load.rate != null ? Number(load.rate).toLocaleString() : 'TBD'}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <strong>Posted:</strong>{" "}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {new Date(load.created_at).toLocaleDateString()}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                    </>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          }