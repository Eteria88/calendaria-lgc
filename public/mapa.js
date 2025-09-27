// OpenLayers version (no Leaflet). Avoids tile seams and hover bands.
(function(){
  const $ = (s)=>document.querySelector(s);
  const listEl = $("#country-list");
  const badgeEl = $("#search-badge");
  const tooltip = $("#tooltip");
  const nameEl = $("#selected-country .name");

  // ---- OpenLayers map ----
  const osm = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attributions: '&copy; OpenStreetMap contributors',
      wrapX: false,
      tileSize: 512,      // reduce seams
      tilePixelRatio: 2,  // retina-friendly
      transition: 0
    }),
    className: "ol-osm"
  });

  const view = new ol.View({
    center: ol.proj.fromLonLat([0, 15]),
    zoom: 2,
    constrainResolution: true,   // enteros
    enableRotation: false
  });

  const map = new ol.Map({
    target: "map",
    layers: [osm],
    view,
    controls: ol.control.defaults.defaults({ attribution: true }),
    pixelRatio: 1   // estabiliza en algunas GPUs
  });

  // Vector layer para países
  const countriesSource = new ol.source.Vector({ wrapX: false });
  const countriesLayer = new ol.layer.Vector({
    source: countriesSource,
    style: baseStyle
  });
  map.addLayer(countriesLayer);

  // Cargar países desde world-atlas (50m para mejor corte antimeridiano)
  fetch("https://unpkg.com/world-atlas@2/countries-50m.json").then(r=>r.json()).then(topo=>{
    const geo = topojson.feature(topo, topo.objects.countries);
    const fmt = new ol.format.GeoJSON();
    const feats = fmt.readFeatures(geo, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" });
    countriesSource.addFeatures(feats);
    buildList(feats);
  });

  // ---- Estilos (sin relleno en hover para evitar franjas) ----
  function baseStyle(){
    return new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "#2a3545", width: 1.2 }),
      fill: new ol.style.Fill({ color: "rgba(57,66,74,0.85)" })
    });
  }
  function hoverStyle(){
    return new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "#0ea5b7", width: 1.6 }),
      fill: null
    });
  }
  function selectedStyle(){
    return new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "#22d3ee", width: 1.6 }),
      fill: new ol.style.Fill({ color: "rgba(11,58,74,0.6)" })
    });
  }

  let hoveredFeature = null;
  let selectedFeature = null;

  map.on("pointermove", function(evt){
    if (tooltip) { tooltip.style.display = "none"; }
    if (hoveredFeature) { hoveredFeature.setStyle(null); hoveredFeature = null; }
    map.forEachFeatureAtPixel(evt.pixel, function(feat, layer){
      if (layer !== countriesLayer) return;
      hoveredFeature = feat;
      feat.setStyle(hoverStyle());
      const name = feat.get("name") || `N3 ${feat.getId()}`;
      showTip(evt.originalEvent.clientX, evt.originalEvent.clientY, name);
    }, { hitTolerance: 2 });
  });

  map.on("click", function(evt){
    if (selectedFeature) { selectedFeature.setStyle(null); selectedFeature = null; }
    map.forEachFeatureAtPixel(evt.pixel, function(feat, layer){
      if (layer !== countriesLayer) return;
      selectedFeature = feat;
      feat.setStyle(selectedStyle());
      const geom = feat.getGeometry();
      if (geom) { map.getView().fit(geom, { padding: [20,20,20,20], duration: 200 }); }
      const name = feat.get("name") || `N3 ${feat.getId()}`;
      if (nameEl) nameEl.textContent = name;
    }, { hitTolerance: 2 });
  });

  function showTip(x,y,text){
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.style.display = "block";
  }

  // ---- Búsqueda simple y lista ----
  function buildList(features){
    const items = features
      .map(f => ({ name: f.get("name") || `N3 ${f.getId()}`, id: f.getId(), feature: f }))
      .sort((a,b) => a.name.localeCompare(b.name));

    // render
    listEl.innerHTML = "";
    for (const it of items){
      const li = document.createElement("li");
      li.textContent = it.name;
      li.dataset.id = it.id;
      li.onclick = () => {
        if (selectedFeature) selectedFeature.setStyle(null);
        selectedFeature = it.feature;
        selectedFeature.setStyle(selectedStyle());
        const g = it.feature.getGeometry();
        if (g) map.getView().fit(g, { padding:[20,20,20,20], duration:200 });
        if (nameEl) nameEl.textContent = it.name;
        highlightList(String(it.id));
      };
      listEl.appendChild(li);
    }

    // buscar
    const search = $("#search");
    if (search){
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        if (!q){
          Array.from(listEl.children).forEach(li => li.style.display = "");
          if (badgeEl) badgeEl.textContent = "—";
          return;
        }
        Array.from(listEl.children).forEach(li => {
          const ok = li.textContent.toLowerCase().includes(q);
          li.style.display = ok ? "" : "none";
        });
        const first = items.find(x => x.name.toLowerCase().includes(q));
        if (badgeEl) badgeEl.textContent = first ? first.name : "—";
      });
      search.addEventListener("keydown",(ev)=>{
        if (ev.key === "Enter"){
          ev.preventDefault();
          const q = search.value.trim().toLowerCase();
          const first = items.find(x => x.name.toLowerCase().includes(q));
          if (first){
            first.feature && map.getView().fit(first.feature.getGeometry(), { padding:[20,20,20,20], duration:200 });
            if (nameEl) nameEl.textContent = first.name;
            highlightList(String(first.id));
          }
        }
      });
    }
  }

  function highlightList(id){
    Array.from(listEl.children).forEach(li => li.classList.remove("is-active"));
    const el = Array.from(listEl.children).find(li => li.dataset.id === id);
    if (el) el.classList.add("is-active");
  }
})();