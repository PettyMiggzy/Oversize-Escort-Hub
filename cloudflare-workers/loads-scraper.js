
// OEH Loads Covered Scraper Worker
// Receives email webhook from Gmail → parses load → pushes to Supabase

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_KEY;

export default {
  async fetch(request, env) {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Verify secret token to prevent abuse
    const token = request.headers.get("X-OEH-Token");
    if (token !== env.OEH_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const body = await request.json();
      const { title, text, date, time } = body;

      // Parse the load from notification text
      const load = parseLoad(title, text, date, time);

      if (!load) {
        return new Response(JSON.stringify({ error: "Could not parse load" }), {
          status: 422,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Push to Supabase external_loads table
      const res = await fetch(`${SUPABASE_URL}/rest/v1/external_loads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(load)
      });

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, load: data }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

function parseLoad(title, text, date, time) {
  if (!text) return null;

  // Loads Covered notification format examples:
  // "Lead escort needed - Chicago IL to Denver CO - $2.00/mi"
  // "Chase car needed - Dallas TX to Houston TX - $500 day rate"

  const combined = `${title} ${text}`.toLowerCase();

  // Extract escort type
  let escortType = "Lead"; // default
  if (combined.includes("chase")) escortType = "Chase";
  else if (combined.includes("high pole")) escortType = "High Pole";
  else if (combined.includes("rear steer")) escortType = "Rear Steer";
  else if (combined.includes("lineman")) escortType = "Lineman";
  else if (combined.includes("survey")) escortType = "Survey";
  else if (combined.includes("flagger")) escortType = "Flagger";

  // Extract cities - look for patterns like "City ST to City ST"
  const routeMatch = text.match(/([a-zA-Z\s]+),?\s*([A-Z]{2})\s+to\s+([a-zA-Z\s]+),?\s*([A-Z]{2})/i);
  
  let pickupCity = "", pickupState = "", destCity = "", destState = "";
  if (routeMatch) {
    pickupCity = routeMatch[1].trim();
    pickupState = routeMatch[2].toUpperCase();
    destCity = routeMatch[3].trim();
    destState = routeMatch[4].toUpperCase();
  }

  // Extract rate
  let rate = null;
  const rateMatch = text.match(/\$?([\d.]+)\s*\/?\s*(mi|mile|day)/i);
  if (rateMatch) {
    rate = rateMatch[1];
  }

  // 24hr expiry
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    source: "loads_covered",
    board: "open_loads",
    escort_type: escortType,
    pickup_city: pickupCity || "Unknown",
    pickup_state: pickupState || "Unknown",
    destination_city: destCity || "Unknown",
    destination_state: destState || "Unknown",
    rate: rate,
    rate_type: text.includes("day") ? "day_rate" : "per_mile",
    raw_title: title,
    raw_text: text,
    posted_at: new Date().toISOString(),
    expires_at: expiresAt,
    status: "open"
  };
}
