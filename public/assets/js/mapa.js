// Calendaria · Mapa y Códigos
// Leaflet + world-atlas TopoJSON (countries-110m).
// Interacciones: hover highlight, tooltip con nombre, click para seleccionar y editar códigos.
(function () {
  const state = {
    map: null,
    layers: {
      countries: null
    },
    selected: null, // Feature seleccionada
    idxByName: [], // Para listado y búsqueda
    saved: {}, // { ISO_A3: {codigos: [...], notes: ""} }
  };

  // Diccionario inicial: ejemplo de códigos por país (para que veas la estructura).
  // Clave por ISO_A3 (world-atlas usa id numérica, pero le inyectamos ISO_A3 cuando exista).
  const initialCodes = {
    "ARG": { codigos: ["+54"], notes: "Argentina: receptor 74 · Tierra/Humano" },
    "USA": { codigos: ["+1"], notes: "Estados Unidos" },
    "RUS": { codigos: ["+7"], notes: "Rusia" },
    "VEN": { codigos: ["+58"], notes: "Venezuela (enjambre 2025-09-25)" },
    "COL": { codigos: ["+57"], notes: "Colombia" },
  };

  // Utils
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // UI elements
  const tooltip = $("#tooltip");
  const selectedBox = $("#selected-country");
  const savedList = $("#saved-codes");
  const countryList = $("#country-list");

  function initMap() {
    state.map = L.map("map", { zoomControl: true, worldCopyJump: true });
    // Fondo
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 6,
      minZoom: 1,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);

    state.map.setView([15, 0], 2);
    loadCountries();
  }

  async function loadCountries() {
    try {
      const res = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
      const topo = await res.json();
      // Convertir a GeoJSON
      const geo = topojson.feature(topo, topo.objects.countries);

      // world-atlas 110m no trae nombres listos; agregamos por name del "countries-110m.json"?
      // En 110m vienen sólo ids numéricas. Para nombres humanos, apoyamos en una lista embebida mínima
      // y además haremos reverse geocoding por clic con 'name' si existe en properties.
      // Para hacerlo práctico, vamos a complementar con otra lista de nombres por id cuando sea posible.
      // Incluimos un mapeo id->name para algunos países clave (se puede ampliar luego).
      const idToName = {
        032: "Argentina",
        076: "Brasil",
        124: "Canadá",
        152: "Chile",
        170: "Colombia",
        218: "Ecuador",
        222: "El Salvador",
        724: "España",
        826: "Reino Unido",
        840: "Estados Unidos",
        372: "Irlanda",
        250: "Francia",
        276: "Alemania",
        380: "Italia",
        528: "Países Bajos",
        616: "Polonia",
        620: "Portugal",
        724: "España",
        804: "Ucrania",
        862: "Venezuela",
        643: "Rusia",
        356: "India",
        360: "Indonesia",
        156: "China",
        392: "Japón",
        360: "Indonesia",
        364: "Irán",
        368: "Iraq",
        682: "Arabia Saudita",
        760: "Siria",
        422: "Líbano",
        818: "Egipto",
        887: "Yemen",
        566: "Nigeria",
        710: "Sudáfrica",
        756: "Suiza",
        724: "España"
      };

      // ISO3 aproximado por id (limitado; se puede extender)
      const idToISO3 = {
        032: "ARG",
        076: "BRA",
        124: "CAN",
        152: "CHL",
        170: "COL",
        218: "ECU",
        222: "SLV",
        724: "ESP",
        826: "GBR",
        840: "USA",
        372: "IRL",
        250: "FRA",
        276: "DEU",
        380: "ITA",
        528: "NLD",
        616: "POL",
        620: "PRT",
        804: "UKR",
        862: "VEN",
        643: "RUS",
        356: "IND",
        360: "IDN",
        156: "CHN",
        392: "JPN",
        364: "IRN",
        368: "IRQ",
        682: "SAU",
        760: "SYR",
        422: "LBN",
        818: "EGY",
        887: "YEM",
        566: "NGA",
        710: "ZAF",
        756: "CHE"
      };

      geo.features.forEach(f => {
        // Inyectar propiedades auxiliares
        const id = f.id;
        f.properties = f.properties || {};
        f.properties.name = f.properties.name || idToName[id] || `ID ${id}`;
        f.properties.iso_a3 = idToISO3[id] || `ID${id}`;
      });

      const layer = L.geoJSON(geo, {
        style: baseStyle,
        onEachFeature: onEachCountry
      }).addTo(state.map);

      state.layers.countries = layer;
      buildCountryIndex(geo.features);
      renderCountryList();
      restoreSaved();
    } catch (err) {
      console.error("Error cargando países:", err);
    }
  }

  function baseStyle() {
    return {
      weight: 0.8,
      color: "#2a3545",
      fillColor: "#14202e",
      fillOpacity: 0.6
    };
  }

  function hoverStyle() {
    return {
      weight: 1.2,
      color: "#4a90e2",
      fillColor: "#19304a",
      fillOpacity: 0.8
    };
  }

  function selectedStyle() {
    return {
      weight: 1.3,
      color: "#22d3ee",
      fillColor: "#0b3a4a",
      fillOpacity: 0.85
    };
  }

  function onEachCountry(feature, layer) {
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle(hoverStyle());
        l.bringToFront();
        showTooltip(e, feature.properties.name);
      },
      mouseout: (e) => {
        const l = e.target;
        if (state.selected === l) {
          l.setStyle(selectedStyle());
        } else {
          l.setStyle(baseStyle());
        }
        hideTooltip();
      },
      mousemove: (e) => {
        showTooltip(e, feature.properties.name);
      },
      click: (e) => {
        selectCountryLayer(e.target, feature);
      }
    });
  }

  function showTooltip(e, text) {
    tooltip.textContent = text;
    tooltip.style.left = e.originalEvent.clientX + "px";
    tooltip.style.top = e.originalEvent.clientY + "px";
    tooltip.style.display = "block";
  }
  function hideTooltip() {
    tooltip.style.display = "none";
  }

  function selectCountryLayer(layer, feature) {
    // Reset estilo del anterior
    if (state.selected && state.selected !== layer) {
      state.selected.setStyle(baseStyle());
    }
    state.selected = layer;
    layer.setStyle(selectedStyle());

    const props = feature.properties;
    const iso = props.iso_a3;
    const name = props.name;

    const current = state.saved[iso] || initialCodes[iso] || { codigos: [], notes: "" };
    renderSelected(name, iso, current);
    state.map.fitBounds(layer.getBounds(), { padding: [20,20] });
  }

  function renderSelected(name, iso, data) {
    selectedBox.innerHTML = `
      <div class="row"><span class="name">${name}</span> <span class="country-code">(${iso})</span></div>
      <div class="row muted" style="margin-top:4px;">Añade, edita y guarda tus códigos.</div>

      <div style="margin-top:10px;">
        <label for="codes-input">Códigos (separados por coma)</label>
        <input id="codes-input" type="text" placeholder="+54, 83, 74…" value="${(data.codigos||[]).join(", ")}" />
      </div>

      <div style="margin-top:10px;">
        <label for="notes-input">Notas</label>
        <input id="notes-input" type="text" placeholder="Notas para este país…" value="${data.notes || ""}" />
      </div>

      <div style="margin-top:12px; display:flex; gap:8px;">
        <button id="btn-save" class="btn">Guardar</button>
        <button id="btn-clear" class="btn">Limpiar</button>
      </div>
    `;

    $("#btn-save").onclick = () => {
      const codes = $("#codes-input").value.split(",").map(s => s.trim()).filter(Boolean);
      const notes = $("#notes-input").value.trim();
      saveCodes(iso, { codigos: codes, notes });
      flashSaved(`${name} guardado`);
      renderSavedList();
    };
    $("#btn-clear").onclick = () => {
      delete state.saved[iso];
      persist();
      renderSavedList();
      flashSaved(`Se borraron los códigos de ${name}`);
      // Mantener visible el panel, solo limpiar inputs
      $("#codes-input").value = "";
      $("#notes-input").value = "";
    };
  }

  function flashSaved(msg) {
    const n = document.createElement("div");
    n.textContent = msg;
    n.style.position = "fixed";
    n.style.right = "18px";
    n.style.bottom = "18px";
    n.style.padding = "10px 12px";
    n.style.border = "1px solid #243142";
    n.style.background = "#0f1620";
    n.style.color = "#e8ecf1";
    n.style.borderRadius = "10px";
    n.style.zIndex = 9999;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1500);
  }

  function saveCodes(iso, data) {
    state.saved[iso] = { codigos: data.codigos || [], notes: data.notes || "" };
    persist();
  }

  function persist() {
    try {
      localStorage.setItem("calendaria_mapa_codigos", JSON.stringify(state.saved));
    } catch (e) { console.warn("No se pudo persistir en localStorage:", e); }
  }

  function restoreSaved() {
    try {
      const raw = localStorage.getItem("calendaria_mapa_codigos");
      if (raw) state.saved = JSON.parse(raw);
    } catch (e) { /* noop */ }
    // Inicializa con algunos por defecto si no hay nada
    if (!Object.keys(state.saved).length) {
      state.saved = { ...initialCodes };
      persist();
    }
    renderSavedList();
  }

  function renderSavedList() {
    const entries = Object.entries(state.saved).sort((a,b)=> a[0].localeCompare(b[0]));
    savedList.innerHTML = "";
    if (!entries.length) {
      savedList.innerHTML = '<li class="muted">No hay códigos guardados.</li>';
      return;
    }
    for (const [iso, data] of entries) {
      const li = document.createElement("li");
      const codes = (data.codigos || []).join(", ");
      const notes = data.notes || "";
      li.innerHTML = `
        <div>
          <div><strong>${iso}</strong> <span class="country-code">${codes ? "(" + codes + ")" : ""}</span></div>
          <div class="muted" style="max-width:38ch; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${notes}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button data-iso="${iso}" data-action="zoom">Ir</button>
          <button data-iso="${iso}" data-action="del">Borrar</button>
        </div>
      `;
      savedList.appendChild(li);
    }

    // Delegación de eventos
    savedList.onclick = (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const iso = btn.getAttribute("data-iso");
      const action = btn.getAttribute("data-action");
      if (action === "del") {
        delete state.saved[iso];
        persist();
        renderSavedList();
      } else if (action === "zoom") {
        zoomToISO(iso);
      }
    };
  }

  function zoomToISO(iso) {
    // Recorre las capas para encontrarla
    state.layers.countries.eachLayer(l => {
      const f = l.feature;
      if (f && f.properties && f.properties.iso_a3 === iso) {
        selectCountryLayer(l, f);
      }
    });
  }

  function buildCountryIndex(features) {
    state.idxByName = features.map(f => ({
      name: f.properties.name,
      iso: f.properties.iso_a3
    })).sort((a,b)=> a.name.localeCompare(b.name));
  }

  function renderCountryList(filtered=null) {
    const list = filtered || state.idxByName;
    countryList.innerHTML = "";
    list.forEach(item => {
      const li = document.createElement("li");
      const codes = state.saved[item.iso]?.codigos || initialCodes[item.iso]?.codigos || [];
      li.innerHTML = `<span>${item.name}</span> <span class="country-code">${codes.join(", ")}</span>`;
      li.onclick = () => zoomToISO(item.iso);
      countryList.appendChild(li);
    });
  }

  function filterCountryList(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) { renderCountryList(); return; }
    const filtered = state.idxByName.filter(x => x.name.toLowerCase().includes(q) || (x.iso||"").toLowerCase().includes(q));
    renderCountryList(filtered);
  }

  // Expose a tiny API for the input text handler
  window.MapaCodigos = { filterCountryList };

  // Ready
  document.addEventListener("DOMContentLoaded", initMap);
})();
