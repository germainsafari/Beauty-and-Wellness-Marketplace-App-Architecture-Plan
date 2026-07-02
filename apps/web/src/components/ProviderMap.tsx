import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite bundles Leaflet's default marker images to hashed URLs, which breaks
// L.Icon.Default's runtime path detection. Point it at the imported assets.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KIGALI_CENTER: [number, number] = [-1.9441, 30.0619];

type MapProvider = {
  profile: {
    id: number;
    businessName: string;
    address: string;
    district: string | null;
    rating: string;
    reviewCount: number;
    latitude: string | null;
    longitude: string | null;
  };
  distanceKm: number | null;
};

type Props = {
  providers: MapProvider[];
  center?: [number, number];
  onView?: (providerId: number) => void;
};

export default function ProviderMap({ providers, center, onView }: Props) {
  const located = useMemo(
    () =>
      providers.filter(
        (p) => p.profile.latitude !== null && p.profile.longitude !== null
      ),
    [providers]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (located.length > 0) {
      return [Number(located[0].profile.latitude), Number(located[0].profile.longitude)];
    }
    return KIGALI_CENTER;
  }, [center, located]);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[360px] md:h-[480px]">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((p) => {
          const lat = Number(p.profile.latitude);
          const lng = Number(p.profile.longitude);
          return (
            <Marker key={p.profile.id} position={[lat, lng]}>
              <Popup>
                <div className="space-y-1 min-w-[170px]">
                  <p className="font-bold text-sm">{p.profile.businessName}</p>
                  <p className="text-xs text-gray-600">
                    ⭐ {p.profile.rating} ({p.profile.reviewCount})
                    {p.distanceKm !== null && <> · {p.distanceKm} km away</>}
                  </p>
                  {p.profile.district && (
                    <p className="text-xs text-gray-500">📍 {p.profile.district}, Kigali</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    {onView && (
                      <button
                        onClick={() => onView(p.profile.id)}
                        className="text-xs font-bold text-hafi-purple underline"
                      >
                        View
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-hafi-purple underline"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
