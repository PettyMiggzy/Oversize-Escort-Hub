import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export const dynamic = 'force-dynamic'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Format: OEH [TYPE] [QTYx] [BOARD] pickup [CITY] destination [CITY] [DATE] [RATE]
// Example: OEH WIDE 2x FLAT pickup Dallas destination Austin 04/15 $1200
// BOARD values: FLAT | OPEN | BID | (omit = all three)
// This endpoint is called by TextRequest webhook — activate when 10DLC approved

export function parseSMS(body: string) {
  const text = body.trim().toUpperCase();
  if (!text.startsWith("OEH ")) return null;

  const TYPES = ["WIDE", "TALL", "OVERSIZE", "SUPERLOAD", "OVERWIDTH", "OS"];
  const BOARDS = ["FLAT", "OPEN", "BID"];

  let remaining = text.slice(4).trim();
  const result: any = { boards: ["flat_rate", "open_loads", "bid_board"] };

  // Extract type
  for (const t of TYPES) {
    if (remaining.startsWith(t)) {
      result.type = t;
      remaining = remaining.slice(t.length).trim();
      break;
    }
  }

  // Extract quantity (e.g. 2X or 2)
  const qtyMatch = remaining.match(/^(\d+)X?\s*/i);
  if (qtyMatch) {
    result.quantity = parseInt(qtyMatch[1]);
    remaining = remaining.slice(qtyMatch[0].length).trim();
  }

  // Extract board
  for (const b of BOARDS) {
    if (remaining.startsWith(b)) {
      const boardMap: Record<string, string> = { FLAT: "flat_rate", OPEN: "open_loads", BID: "bid_board" };
      result.boards = [boardMap[b]];
      remaining = remaining.slice(b.length).trim();
      break;
    }
  }

  // Extract pickup city
  const pickupMatch = remaining.match(/PICKUP\s+([A-Z\s]+?)(?:\s+DESTINATION|\s+DEST)/i);
  if (pickupMatch) {
    result.pickup = pickupMatch[1].trim();
    remaining = remaining.slice(remaining.indexOf(pickupMatch[0]) + pickupMatch[0].length).trim();
  }

  // Extract destination city
  const destMatch = remaining.match(/(?:DESTINATION|DEST)\s+([A-Z\s]+?)(?:\s+\d{2}\/\d{2}|\s+\$|$)/i);
  if (destMatch) {
    result.destination = destMatch[1].trim();
    remaining = remaining.slice(remaining.indexOf(destMatch[0]) + destMatch[0].length).trim();
  }

  // Extract date (MM/DD or MM/DD/YY)
  const dateMatch = remaining.match(/(\d{2}\/\d{2}(?:\/\d{2,4})?)/);
  if (dateMatch) {
    result.date = dateMatch[1];
    remaining = remaining.replace(dateMatch[0], "").trim();
  }

  // Extract rate ($1200 or 1200)
  const rateMatch = remaining.match(/\$?([\d,]+)/);
  if (rateMatch) {
    result.rate = parseFloat(rateMatch[1].replace(",", ""));
  }

  return result;
}

export async function POST(req: NextRequest) {
  // Verify TextRequest webhook signature (when 10DLC approved, enable strict check)
  const body = await req.json();
  const smsBody: string = body.message ?? body.body ?? "";
  const from: string = body.from ?? body.phone ?? "";

  const parsed = parseSMS(smsBody);
  if (!parsed) {
    return NextResponse.json({ ok: false, reason: "Not an OEH command" });
  }

  // Look up user by phone number
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tier")
    .eq("phone", from)
    .single();

  if (!profile) {
    return NextResponse.json({ ok: false, reason: "Phone number not registered" });
  }

  // Insert a load for each board
  const insertions = parsed.boards.map((board: string) => ({
    carrier_id: profile.id,
    board,
    load_type: parsed.type ?? "OVERSIZE",
    quantity: parsed.quantity ?? 1,
    pickup_city: parsed.pickup ?? "",
    destination_city: parsed.destination ?? "",
    pickup_date: parsed.date ?? null,
    rate: parsed.rate ?? null,
    status: "open",
    source: "sms",
  }));

  const { error } = await supabase.from("loads").insert(insertions);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: insertions.length, parsed });
}
