document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('wasteHeatMap');
  if (!mapElement) return;

  const loadingElement = document.getElementById('heatMapLoading');
  const statusElement = document.getElementById('heatMapStatus');
  const selectedAreaElement = document.getElementById('selectedAreaDetails');
  const defaultCenter = [23.8103, 90.4125];
  const defaultZoom = 7;
  let dataBounds = null;

  const showFatalError = (message) => {
    loadingElement.classList.add('is-error');
    loadingElement.innerHTML = `<span class="material-icons-outlined">map</span><span>${message}</span>`;
    statusElement.textContent = message;
  };

  if (!window.L || typeof window.L.heatLayer !== 'function') {
    showFatalError('The interactive map library could not be loaded. Check the network connection and reload.');
    return;
  }

  const map = L.map(mapElement, {
    center: defaultCenter,
    zoom: defaultZoom,
    minZoom: 2,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const wasteLayer = L.heatLayer([], {
    radius: 32,
    blur: 24,
    minOpacity: 0.32,
    maxZoom: 15,
    gradient: { 0.2: '#dcedc8', 0.48: '#66bb6a', 0.72: '#ffb300', 1: '#c62828' }
  }).addTo(map);

  const complaintLayer = L.heatLayer([], {
    radius: 30,
    blur: 22,
    minOpacity: 0.28,
    maxZoom: 15,
    gradient: { 0.2: '#fff3e0', 0.5: '#ffb74d', 0.76: '#f4511e', 1: '#8e0000' }
  }).addTo(map);

  const areaLayer = L.layerGroup().addTo(map);
  const layerControls = [
    { input: document.getElementById('toggleWasteLayer'), layer: wasteLayer },
    { input: document.getElementById('toggleComplaintLayer'), layer: complaintLayer },
    { input: document.getElementById('toggleAreaLayer'), layer: areaLayer }
  ];

  layerControls.forEach(({ input, layer }) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
    });
  });

  document.getElementById('fitMapData').addEventListener('click', () => {
    if (dataBounds && dataBounds.isValid()) {
      map.fitBounds(dataBounds, { padding: [35, 35], maxZoom: 13 });
    } else {
      map.setView(defaultCenter, defaultZoom);
    }
  });

  const setCount = (id, value) => {
    document.getElementById(id).textContent = Number(value || 0).toLocaleString();
  };

  const validAreas = (areas) => areas.filter((area) => {
    const latitude = Number(area.latitude);
    const longitude = Number(area.longitude);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
      Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
      Number(area.totalCount) > 0;
  });

  const markerColor = (area) => {
    if (area.wasteCount > 0 && area.complaintCount > 0) return '#6a1b9a';
    if (area.complaintCount > 0) return '#d32f2f';
    return '#2e7d32';
  };

  const describeArea = (area) => {
    const wasteCount = Number(area.wasteCount) || 0;
    const complaintCount = Number(area.complaintCount) || 0;
    return `Approximate area: ${wasteCount.toLocaleString()} waste listing${wasteCount === 1 ? '' : 's'} and ${complaintCount.toLocaleString()} pollution complaint${complaintCount === 1 ? '' : 's'}.`;
  };

  const renderData = (data) => {
    const summary = data.summary || {};
    const wasteSummary = summary.wasteListings || {};
    const complaintSummary = summary.pollutionComplaints || {};
    const areas = validAreas(Array.isArray(data.areas) ? data.areas : []);

    setCount('mappedWasteCount', wasteSummary.mapped);
    setCount('mappedComplaintCount', complaintSummary.mapped);
    setCount('mappedAreaCount', areas.length);
    setCount('unmappedRecordCount', summary.unmappedRecords);

    const maxWaste = Math.max(1, ...areas.map((area) => Number(area.wasteCount) || 0));
    const maxComplaints = Math.max(1, ...areas.map((area) => Number(area.complaintCount) || 0));
    const maxTotal = Math.max(1, ...areas.map((area) => Number(area.totalCount) || 0));

    wasteLayer.setLatLngs(areas
      .filter((area) => Number(area.wasteCount) > 0)
      .map((area) => [Number(area.latitude), Number(area.longitude), Number(area.wasteCount) / maxWaste]));
    complaintLayer.setLatLngs(areas
      .filter((area) => Number(area.complaintCount) > 0)
      .map((area) => [Number(area.latitude), Number(area.longitude), Number(area.complaintCount) / maxComplaints]));

    areaLayer.clearLayers();
    areas.forEach((area) => {
      const latitude = Number(area.latitude);
      const longitude = Number(area.longitude);
      const totalCount = Number(area.totalCount) || 0;
      const description = describeArea(area);
      const popup = `<div class="heat-map-popup"><h3>Aggregated map cell</h3><p><strong>${totalCount.toLocaleString()}</strong> total mapped records</p><p>${(Number(area.wasteCount) || 0).toLocaleString()} waste listings</p><p>${(Number(area.complaintCount) || 0).toLocaleString()} pollution complaints</p></div>`;

      const marker = L.circleMarker([latitude, longitude], {
        radius: Math.min(22, 6 + (Math.sqrt(totalCount / maxTotal) * 13)),
        color: '#ffffff',
        weight: 2,
        fillColor: markerColor(area),
        fillOpacity: 0.72,
        opacity: 0.9
      }).bindPopup(popup, { maxWidth: 240 });

      marker.on('click', () => {
        selectedAreaElement.textContent = description;
      });
      marker.addTo(areaLayer);
    });

    if (areas.length > 0) {
      dataBounds = L.latLngBounds(areas.map((area) => [Number(area.latitude), Number(area.longitude)]));
      map.fitBounds(dataBounds, { padding: [35, 35], maxZoom: 13 });
    } else {
      dataBounds = null;
      map.setView(defaultCenter, defaultZoom);
      selectedAreaElement.textContent = 'No geolocated waste listings or complaints are available yet.';
    }

    const mappedRecords = Number(summary.mappedRecords) || 0;
    const unmappedRecords = Number(summary.unmappedRecords) || 0;
    if (mappedRecords === 0) {
      statusElement.textContent = unmappedRecords > 0
        ? `No valid coordinates are available; ${unmappedRecords.toLocaleString()} records were safely omitted.`
        : 'No waste listings or pollution complaints have been mapped yet.';
    } else {
      statusElement.textContent = `Showing ${mappedRecords.toLocaleString()} mapped records in ${areas.length.toLocaleString()} aggregated areas${unmappedRecords > 0 ? `; ${unmappedRecords.toLocaleString()} records with missing or invalid coordinates were omitted` : ''}.`;
    }

    loadingElement.remove();
    window.setTimeout(() => map.invalidateSize(), 0);
  };

  fetch('/api/heat-map', { credentials: 'include' })
    .then(async (response) => {
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Map data request failed');
      return data;
    })
    .then(renderData)
    .catch((error) => {
      if (error.message !== 'Authentication required') {
        showFatalError('Map data could not be loaded. Please try again later.');
      }
    });
});
