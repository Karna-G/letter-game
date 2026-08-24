import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api";

// Fix Leaflet marker icon bug with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PICKUP_RADIUS = 500; // meters

export default function LetterMap({ userId, onClaim }: { userId: string, onClaim: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [letters, setLetters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Could not locate thee. Allow location access and try again.")
    );
  }, []);

  useEffect(() => {
    if (!position) return;
    api.get(`/letters/nearby?lat=${position[0]}&lng=${position[1]}&radius=${PICKUP_RADIUS}`)
      .then(res => setLetters(res.data))
      .catch(() => setError("Failed to fetch nearby letters."));
  }, [position]);

  const claimLetter = async (letterId: string) => {
    try {
      const letter = letters.find(l => l._id === letterId);
      if (!letter) return;
      await api.post("/letters/scan", {
        token: letter.qrCodeToken,
        userId,
        role: "mailman"
      });
      alert("Letter claimed! Deliver it swiftly.");
      onClaim();
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not claim letter.");
    }
  };

  if (error) return (
    <div className="text-center p-8 font-serif text-amber-900">{error}</div>
  );

  if (!position) return (
    <div className="text-center p-8 font-serif text-amber-900 italic">
      Locating thee upon the realm...
    </div>
  );

  return (
    <div className="rounded-lg overflow-hidden border-2 border-amber-800">
      <MapContainer center={position} zoom={15} style={{ height: "500px", width: "100%" }}>
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        />
        {/* Mailman position */}
        <Marker position={position}>
          <Popup>
            <span className="font-serif">Thou art here</span>
          </Popup>
        </Marker>
        {/* Pickup radius */}
        <Circle
          center={position}
          radius={PICKUP_RADIUS}
          pathOptions={{ color: "#92400e", fillColor: "#D2B48C", fillOpacity: 0.15 }}
        />
        {/* Nearby letter pins */}
        {letters.map((letter) => (
          <Marker key={letter._id} position={[letter.senderLocation.lat, letter.senderLocation.lng]}>
            <Popup>
              <div className="font-serif text-amber-900">
                <p><b>A letter awaits</b></p>
                <p>From: {letter.senderRef?.name || "Unknown"}</p>
                {letter.receiverRef && <p>To: {letter.receiverRef?.name}</p>}
                <button
                  onClick={() => claimLetter(letter._id)}
                  style={{
                    marginTop: "8px",
                    padding: "4px 12px",
                    background: "#92400e",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontFamily: "serif"
                  }}
                >
                  Claim this missive
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}