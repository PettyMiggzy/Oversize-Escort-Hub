"use client";
import { useState } from "react";

interface WeatherData { temperature: number; description: string; windSpeed: number; alerts: string[]; }

export default function WeatherPage() {
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchWeather(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/weather?lat=${coords.lat}&lng=${coords.lng}`);
    const data = await res.json();
    setWeather(data);
    setLoading(false);
  }

  async function useMyLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      setCoords({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() });
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">⛈️ Route Weather</h1>
        <p className="text-gray-400 mb-8">Check NWS weather alerts along your route</p>
        <form onSubmit={fetchWeather} className="bg-gray-800 rounded-xl p-6 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Latitude" value={coords.lat} onChange={e => setCoords({...coords, lat: e.target.value})}
              className="bg-gray-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="Longitude" value={coords.lng} onChange={e => setCoords({...coords, lng: e.target.value})}
              className="bg-gray-700 rounded-lg px-4 py-2 text-white" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading || !coords.lat} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg">
              {loading ? "Loading..." : "Get Weather"}
            </button>
            <button type="button" onClick={useMyLocation} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              📍 Use My Location
            </button>
          </div>
        </form>
        {weather && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/30 rounded-lg p-4"><p className="text-gray-400 text-sm">Temperature</p><p className="text-2xl font-bold">{weather.temperature}°F</p></div>
              <div className="bg-blue-900/30 rounded-lg p-4"><p className="text-gray-400 text-sm">Wind Speed</p><p className="text-2xl font-bold">{weather.windSpeed} mph</p></div>
            </div>
            <p className="text-gray-300">{weather.description}</p>
            {weather.alerts?.length > 0 && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">⚠️ Active Alerts</p>
                {weather.alerts.map((a, i) => <p key={i} className="text-red-300 text-sm">{a}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}