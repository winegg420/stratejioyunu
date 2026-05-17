import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CityPopup from './CityPopup';
import {
  CITY_STATUS_COLORS,
  getProvinceStyle,
  getDistrictStyle,
  getHoverStyle,
} from './mapUtils';
import { mapCities } from '../data/placeholder';

const TURKEY_CENTER = [39.0, 35.0];
const TURKEY_ZOOM = 6;
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, bounds]);
  return null;
}

export default function TurkeyMap() {
  const [provinces, setProvinces] = useState(null);
  const [districts, setDistricts] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');
  const [searchCoord, setSearchCoord] = useState('');
  const provinceLayerRef = useRef(null);
  const districtLayerRef = useRef(null);
  const [fitBounds, setFitBounds] = useState(null);

  useEffect(() => {
    fetch('/geo/provinces.json')
      .then((r) => r.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  const loadDistricts = useCallback(async (iso, name) => {
    setLoadingDistricts(true);
    setDistricts(null);
    setSelectedProvince({ iso, name });
    try {
      const data = await fetch(`/geo/districts/${iso}.json`).then((r) => r.json());
      setDistricts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const onProvinceClick = useCallback(
    (feature, layer) => {
      const iso = feature.properties.shapeISO;
      const name = feature.properties.shapeName;
      layer.on('click', () => {
        loadDistricts(iso, name);
        setFitBounds(layer.getBounds());
      });
    },
    [loadDistricts],
  );

  const provinceStyle = useCallback(() => getProvinceStyle(), []);

  const onEachProvince = useCallback(
    (feature, layer) => {
      const name = feature.properties.shapeName;
      layer.bindTooltip(name, { sticky: true, className: 'map-tooltip' });
      onProvinceClick(feature, layer);
      layer.on('mouseover', () => layer.setStyle(getHoverStyle(getProvinceStyle())));
      layer.on('mouseout', () => layer.setStyle(getProvinceStyle()));
    },
    [onProvinceClick],
  );

  const onEachDistrict = useCallback((feature, layer) => {
    const name = feature.properties.name;
    layer.bindTooltip(name, { sticky: true, className: 'map-tooltip' });
    layer.on('mouseover', () => layer.setStyle(getHoverStyle(getDistrictStyle())));
    layer.on('mouseout', () => layer.setStyle(getDistrictStyle()));
  }, []);

  const clearDistricts = () => {
    setDistricts(null);
    setSelectedProvince(null);
    setFitBounds(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    const coord = searchCoord.trim();
    if (coord) {
      const [lat, lng] = coord.split(',').map((n) => parseFloat(n.trim()));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setFitBounds(L.latLngBounds([[lat, lng]]));
        const near = mapCities.find(
          (c) => Math.abs(c.lat - lat) < 1 && Math.abs(c.lng - lng) < 1,
        );
        setSelectedCity(near || { name: 'Koordinat', status: 'empty', lat, lng });
        return;
      }
    }
    const city = mapCities.find((c) => c.name.toLowerCase().includes(q));
    if (city) {
      setSelectedCity(city);
      setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
    }
  };

  const filteredCities = search
    ? mapCities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : mapCities;

  return (
    <div className="map-page">
      <div className="map-toolbar">
        <form className="map-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Şehir veya oyuncu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Koordinat: 38.42, 27.14"
            value={searchCoord}
            onChange={(e) => setSearchCoord(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Ara
          </button>
        </form>
        <div className="map-legend">
          <span><i style={{ background: CITY_STATUS_COLORS.empty }} /> Boş</span>
          <span><i style={{ background: CITY_STATUS_COLORS.own }} /> Kendi</span>
          <span><i style={{ background: CITY_STATUS_COLORS.enemy }} /> Düşman</span>
          <span><i style={{ background: CITY_STATUS_COLORS.bot }} /> Bot</span>
          <span><i style={{ background: CITY_STATUS_COLORS.siege }} /> Kuşatma</span>
        </div>
        {selectedProvince && (
          <div className="map-province-bar">
            <span>
              {loadingDistricts ? 'İlçeler yükleniyor...' : `${selectedProvince.name} ilçeleri`}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearDistricts}>
              İl görünümüne dön
            </button>
          </div>
        )}
        <p className="map-hint">
          Lazy loading: Genel görünümde 81 il. İle tıklayınca yalnızca o ilin ilçeleri yüklenir.
        </p>
      </div>

      <div className="map-container-wrap">
        <MapContainer
          center={TURKEY_CENTER}
          zoom={TURKEY_ZOOM}
          className="turkey-map"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {fitBounds && <FitBounds bounds={fitBounds} />}
          {provinces && !districts && (
            <GeoJSON
              key="provinces"
              ref={provinceLayerRef}
              data={provinces}
              style={provinceStyle}
              onEachFeature={onEachProvince}
            />
          )}
          {districts && (
            <GeoJSON
              key={selectedProvince?.iso}
              ref={districtLayerRef}
              data={districts}
              style={() => getDistrictStyle()}
              onEachFeature={onEachDistrict}
            />
          )}
          {filteredCities.map((city) => (
            <CircleMarker
              key={city.name}
              center={[city.lat, city.lng]}
              radius={city.status === 'empty' ? 6 : 8}
              pathOptions={{
                color: '#fff',
                weight: 1,
                fillColor: CITY_STATUS_COLORS[city.status],
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => setSelectedCity(city) }}
            />
          ))}
        </MapContainer>
        <CityPopup city={selectedCity} onClose={() => setSelectedCity(null)} />
      </div>
    </div>
  );
}
