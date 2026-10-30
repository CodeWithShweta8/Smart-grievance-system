
import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix the default marker icon in Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

function MapClickHandler({ onLocationSelect }) {
    useMapEvents({
        click(event) {
            onLocationSelect(
                event.latlng.lat,
                event.latlng.lng
            );
        }
    });

    return null;
}

function RecenterMap({ latitude, longitude }) {
    const map = useMap();

    useEffect(() => {
        if (latitude !== "" && longitude !== "") {
            map.setView(
                [Number(latitude), Number(longitude)],
                16
            );
        }
    }, [latitude, longitude, map]);

    return null;
}

export default function LocationPicker({
    latitude,
    longitude,
    setLatitude,
    setLongitude
}) {
    const defaultPosition = [16.7050, 74.2433];

    const hasLocation =
        latitude !== "" &&
        longitude !== "" &&
        Number.isFinite(Number(latitude)) &&
        Number.isFinite(Number(longitude));

    const position = hasLocation
        ? [Number(latitude), Number(longitude)]
        : defaultPosition;

    const selectLocation = (lat, lng) => {
        setLatitude(String(lat));
        setLongitude(String(lng));
    };

    return (
        <div className="location-picker">
            <p>
                <strong>Select the actual problem location</strong>
            </p>

            <p>
                Click the map where the issue exists.
                You can select a location different from your
                current GPS position.
            </p>

            <div
                style={{
                    height: "350px",
                    width: "100%",
                    borderRadius: "10px",
                    overflow: "hidden"
                }}
            >
                <MapContainer
                    center={position}
                    zoom={hasLocation ? 16 : 12}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler
                        onLocationSelect={selectLocation}
                    />

                    <RecenterMap
                        latitude={latitude}
                        longitude={longitude}
                    />

                    {hasLocation && (
                        <Marker position={position} />
                    )}
                </MapContainer>
            </div>

            <p>
                <strong>Selected latitude:</strong>{" "}
                {hasLocation ? latitude : "Click the map"}
            </p>

            <p>
                <strong>Selected longitude:</strong>{" "}
                {hasLocation ? longitude : "Click the map"}
            </p>
        </div>
    );
}
