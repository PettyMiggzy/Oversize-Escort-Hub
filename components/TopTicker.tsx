export default function TopTicker() {
  const DOT = <span style={{color:"#ff6600"}}> • </span>
  return (
    <div className="w-full bg-black text-white text-sm py-2 overflow-hidden border-b border-white/10">
      <div className="animate-marquee whitespace-nowrap px-6">
        <span style={{color:"#ffffff"}}>🔥 Load #4821 awarded</span>{DOT}
        <span style={{color:"#ffffff"}}>312 mi @ $2.95/mi</span>{DOT}
        <span style={{color:"#ffffff"}}>🚛 New load posted</span>{DOT}
        <span style={{color:"#ffffff"}}>IN → OH</span>{DOT}
        <span style={{color:"#ffffff"}}>Pro window active</span>{DOT}
        <span style={{color:"#ffffff"}}>💰 FastPay used</span>{DOT}
        <span style={{color:"#ffffff"}}>Escort paid in 24 hrs</span>{DOT}
        <span style={{color:"#ffffff"}}>📌 Load #4890 posted</span>{DOT}
        <span style={{color:"#ffffff"}}>TX → LA</span>{DOT}
        <span style={{color:"#ffffff"}}>271 mi</span>{DOT}
        <span style={{color:"#ffffff"}}>L + E</span>
      </div>
    </div>
  );
}
