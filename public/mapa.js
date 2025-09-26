// Mapa y Códigos (UIT) — robusto: busca itu-codes.json en varias rutas
(function(){
  const state={ map:null, layers:{countries:null}, idx:[], phoneByN3:{}, nameByN3:{}, phoneByName:{}, n3ByPhone:{} };
  const $=(s)=>document.querySelector(s);
  let listEl, searchEl, badgeEl, searchCodeEl, codeNameBadge;

  document.addEventListener("DOMContentLoaded", init);

  async function init(){
    listEl = $("#country-list"); searchEl = $("#search"); badgeEl = $("#search-code-badge");
    searchCodeEl = $("#search-code"); codeNameBadge = $("#search-code-name");
    await loadLocal(); await loadRemote(); initMap();
  }

  function normText(s){ if(!s) return ""; s=s.toLowerCase(); s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return s.replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }
  function normCode(s){ if(!s) return ""; return ("+" + s.replace(/[^0-9]/g,"")); }

  async function fetchJSONMulti(paths){
    for (const p of paths){
      try{
        const r = await fetch(p, {cache:"no-store"});
        if (!r.ok) throw new Error(r.statusText || ("HTTP " + r.status));
        return await r.json();
      }catch(e){
        console.warn("[Calendaria] No se pudo cargar", p, e);
      }
    }
    throw new Error("itu-codes.json no encontrado en rutas probadas");
  }

  async function loadLocal(){
    try{
      const data = await fetchJSONMulti([
        "./itu-codes.json",         // si el HTML está en /mapa/
        "/mapa/itu-codes.json",    // absoluto
        "../mapa/itu-codes.json"   // por si movieron el HTML un nivel
      ]);
      for(const x of data){
        const n3=String(x.n3||"").padStart(3,"0"); if (!n3) continue;
        const name=x.name||n3; const phone=x.phone||"";
        state.phoneByN3[n3]=phone; state.nameByN3[n3]=name;
        if (name) state.phoneByName[normText(name)]=phone;
        if (phone) state.n3ByPhone[normCode(phone)]=state.n3ByPhone[normCode(phone)]||n3;
      }
      console.info("[Calendaria] Dataset local UIT cargado OK");
    }catch(e){ console.warn("[Calendaria] sin dataset local (se intentará remoto):", e.message||e); }
  }

  async function loadRemote(){
    try{
      const r=await fetch("https://restcountries.com/v3.1/all?fields=ccn3,idd,name,altSpellings",{cache:"no-store"});
      const data=await r.json();
      for(const c of data){
        const n3=(c.ccn3||"").toString().padStart(3,"0");
        const root=(c.idd&&c.idd.root)?c.idd.root:"+"; const suf=(c.idd&&Array.isArray(c.idd.suffixes)&&c.idd.suffixes.length)?c.idd.suffixes[0]:"";
        const phone=(root||suf)? `${root}${suf}` : "";
        if(n3){
          if (phone && !state.phoneByN3[n3]) state.phoneByN3[n3]=phone;
          if (!state.nameByN3[n3]) state.nameByN3[n3]=(c.name&&c.name.common)||n3;
          if (phone) state.n3ByPhone[normCode(phone)] = state.n3ByPhone[normCode(phone)] || n3;
        }
        const names=[]; if(c.name){ if(c.name.common) names.push(c.name.common); if(c.name.official) names.push(c.name.official); }
        if(Array.isArray(c.altSpellings)) names.push(...c.altSpellings);
        for(const nm of new Set(names.map(normText).filter(Boolean))){
          if (phone && !state.phoneByName[nm]) state.phoneByName[nm]=phone;
        }
      }
      console.info("[Calendaria] Datos UIT remotos integrados");
    }catch(e){ console.warn("[Calendaria] Falló RestCountries (continuamos con local si existe)"); }
  }

  function initMap(){
    const map=L.map("map",{worldCopyJump:true}); state.map=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:6,minZoom:1,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    map.setView([15,0],2);
    loadCountries();
  }

  async function loadCountries(){
    const r=await fetch("https://unpkg.com/world-atlas@2/countries-110m.json",{cache:"no-store"});
    const topo=await r.json();
    const geo=topojson.feature(topo, topo.objects.countries);

    const layer=L.geoJSON(geo,{style:baseStyle,onEachFeature:onEach}); layer.addTo(state.map); state.layers.countries=layer;

    state.idx = geo.features.map(f=>{
      const n3=String(f.id).padStart(3,"0"); f.properties=f.properties||{}; f.properties.n3=n3;
      const name = state.nameByN3[n3] || f.properties.name || `N3 ${n3}`;
      const phone = state.phoneByN3[n3] || state.phoneByName[normText(name)] || "";
      f.properties.name = name; f.properties.phone = phone;
      return { name, n3 };
    }).sort((a,b)=> a.name.localeCompare(b.name));

    renderList(); setupSearchByName(); setupSearchByCode();
  }

  function baseStyle(){return{weight:.8,color:"#2a3545",fillColor:"#14202e",fillOpacity:.6};}
  function hoverStyle(){return{weight:1.2,color:"#4a90e2",fillColor:"#19304a",fillOpacity:.8};}
  function selectedStyle(){return{weight:1.3,color:"#22d3ee",fillColor:"#0b3a4a",fillOpacity:.85};}

  function onEach(feature, layer){
    layer.on({
      mouseover:(e)=>{const l=e.target; l.setStyle(hoverStyle()); l.bringToFront();},
      mouseout:(e)=>{const l=e.target; (l===_selectedLayer? l.setStyle(selectedStyle()): l.setStyle(baseStyle()));},
      click:(e)=> select(layer, feature)
    });
  }

  let _selectedLayer=null;
  function select(layer, feature){
    if (_selectedLayer && _selectedLayer !== layer) _selectedLayer.setStyle(baseStyle());
    _selectedLayer = layer; layer.setStyle(selectedStyle());

    const p=feature.properties||{}; const name=p.name || `N3 ${p.n3}`; const n3=p.n3;
    const phone = p.phone || state.phoneByN3[n3] || state.phoneByName[normText(name)] || "";

    // Actualiza panel lateral (si existen esos nodos en tu HTML)
    const nameEl=document.querySelector("#selected-country .name");
    const n3El=document.getElementById("n3-label");
    const codesInput=document.getElementById("codes-input");
    if (nameEl) nameEl.textContent = name;
    if (n3El) n3El.textContent = n3 ? `(N3: ${n3})` : "";
    if (codesInput) codesInput.value = phone || "";

    // Resalta item en lista
    highlightList(n3);

    state.map.fitBounds(layer.getBounds(), {padding:[20,20]});
  }

  function highlightList(n3){
    const items = listEl?.querySelectorAll("li")||[];
    items.forEach(li => li.classList.remove("is-active"));
    const idx = Array.from(items).find(li => (li.dataset && li.dataset.n3 === String(n3)));
    if (idx) idx.classList.add("is-active");
  }

  function renderList(list=null){
    const LST=list||state.idx; if (!listEl) return;
    listEl.innerHTML="";
    for(const item of LST){
      const phone = state.phoneByN3[item.n3] || state.phoneByName[normText(item.name)] || "";
      const li=document.createElement("li"); li.dataset.n3 = String(item.n3);
      li.innerHTML=`<span>${item.name}</span><span class="country-code">${phone}</span>`;
      li.onclick=()=> zoomTo(item.n3); listEl.appendChild(li);
    }
  }

  function zoomTo(n3){
    state.layers.countries.eachLayer(l=>{ const f=l.feature; if(String(f.id).padStart(3,"0")===String(n3)){ select(l, f); } });
  }

  // --- Buscar por NOMBRE ---
  function setupSearchByName(){
    if (!searchEl) return;
    searchEl.addEventListener("input", ()=>{
      const q=searchEl.value.trim().toLowerCase();
      const match = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
      const phone = match ? (state.phoneByN3[match.n3] || state.phoneByName[normText(match.name)] || "—") : "—";
      if (badgeEl) badgeEl.textContent = phone;
      if(!q) return renderList();
      const filtered = state.idx.filter(x=> x.name.toLowerCase().includes(q));
      renderList(filtered);
    });
    searchEl.addEventListener("keydown",(ev)=>{
      if(ev.key==="Enter"){
        ev.preventDefault();
        const q=searchEl.value.trim().toLowerCase();
        const m = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
        if(m) zoomTo(m.n3);
      }
    });
  }

  // --- Buscar por CÓDIGO (+57 -> Colombia) ---
  function setupSearchByCode(){
    if (!searchCodeEl) return;
    searchCodeEl.addEventListener("input", ()=>{
      const code = normCode(searchCodeEl.value);
      const n3 = state.n3ByPhone[code];
      const name = n3 ? (state.nameByN3[n3] || "—") : "—";
      if (codeNameBadge) codeNameBadge.textContent = name;
    });
    searchCodeEl.addEventListener("keydown", (ev)=>{
      if(ev.key==="Enter"){
        ev.preventDefault();
        const code = normCode(searchCodeEl.value);
        const n3 = state.n3ByPhone[code];
        if (n3) zoomTo(n3);
      }
    });
  }
})();