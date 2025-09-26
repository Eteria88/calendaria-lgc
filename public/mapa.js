// Mapa y Códigos (UIT) — offline-first + click en mapa actualiza panel
(function(){
  const state={ map:null, layers:{countries:null}, idx:[], phoneByN3:{}, nameByN3:{}, phoneByName:{} };
  const $=(s)=>document.querySelector(s);
  let listEl, searchEl, badgeEl;

  document.addEventListener("DOMContentLoaded", init);

  async function init(){
    listEl = $("#country-list"); searchEl = $("#search"); badgeEl = $("#search-code-badge");
    await loadLocal(); await loadRemote(); initMap();
  }

  function norm(s){ if(!s) return ""; s=s.toLowerCase(); s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return s.replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }

  async function loadLocal(){
    try{
      const r=await fetch("./itu-codes.json",{cache:"no-store"});
      const arr=await r.json();
      for(const x of arr){
        state.phoneByN3[x.n3]=x.phone||"";
        state.nameByN3[x.n3]=x.name||x.n3;
        if (x.name) state.phoneByName[norm(x.name)]=x.phone||"";
      }
    }catch(e){ console.warn("itu-codes.json no encontrado (se usará remoto si hay red)"); }
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
        }
        const names=[]; if(c.name){ if(c.name.common) names.push(c.name.common); if(c.name.official) names.push(c.name.official); }
        if(Array.isArray(c.altSpellings)) names.push(...c.altSpellings);
        for(const nm of new Set(names.map(norm).filter(Boolean))){
          if (phone && !state.phoneByName[nm]) state.phoneByName[nm]=phone;
        }
      }
    }catch(e){ /* sin red: seguimos con local */ }
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
      const phone = state.phoneByN3[n3] || state.phoneByName[norm(name)] || "";
      f.properties.name = name; f.properties.phone = phone;
      return { name, n3 };
    }).sort((a,b)=> a.name.localeCompare(b.name));

    renderList(); setupSearch();
  }

  function baseStyle(){return{weight:.8,color:"#2a3545",fillColor:"#14202e",fillOpacity:.6};}
  function hoverStyle(){return{weight:1.2,color:"#4a90e2",fillColor:"#19304a",fillOpacity:.8};}
  function selectedStyle(){return{weight:1.3,color:"#22d3ee",fillColor:"#0b3a4a",fillOpacity:.85};}

  function onEach(feature, layer){
    layer.on({
      mouseover:(e)=>{const l=e.target; l.setStyle(hoverStyle()); l.bringToFront(); },
      mouseout:(e)=>{const l=e.target; (l===_selectedLayer? l.setStyle(selectedStyle()) : l.setStyle(baseStyle())); },
      click:(e)=> select(layer, feature)
    });
  }

  let _selectedLayer=null;
  function select(layer, feature){
    if (_selectedLayer && _selectedLayer !== layer) _selectedLayer.setStyle(baseStyle());
    _selectedLayer = layer; layer.setStyle(selectedStyle());

    const p=feature.properties||{}; const name=p.name || `N3 ${p.n3}`; const n3=p.n3;
    const phone = p.phone || state.phoneByN3[n3] || state.phoneByName[norm(name)] || "";
    // === Actualiza panel lateral ===
    ensureSelectedPanel();
    document.querySelector("#selected-country .name").textContent = name;
    document.getElementById("n3-label").textContent = n3 ? `(N3: ${n3})` : "";
    // badge grande de código
    const codeView = document.getElementById("uit-code-view");
    codeView.textContent = phone || "—";
    // input de códigos (autoprefill)
    const codesInput = document.getElementById("codes-input");
    if (codesInput) codesInput.value = phone || "";

    // resaltar en lista
    highlightList(n3);

    // zoom
    state.map.fitBounds(layer.getBounds(), {padding:[20,20]});
  }

  function ensureSelectedPanel(){
    let box = document.getElementById("selected-country");
    if (!box) return;
    if (!box.dataset.enhanced){
      // si el HTML ya trae estructura, solo añadimos el visor de código si falta
      if (!box.querySelector("#uit-code-view")){
        const codeRow = document.createElement("div");
        codeRow.className = "row";
        codeRow.innerHTML = '<div class="muted" style="margin-top:6px;">Código UIT:</div><div id="uit-code-view" class="big-code" style="font-size:20px;margin-top:6px;"></div>';
        // Insertar antes del bloque de inputs si existe
        const firstInput = document.getElementById("codes-input");
        if (firstInput) box.insertBefore(codeRow, firstInput.parentElement);
        else box.appendChild(codeRow);
      }
      box.dataset.enhanced = "1";
    }
  }

  function highlightList(n3){
    const items = listEl.querySelectorAll("li");
    items.forEach(li => li.classList.remove("is-active"));
    const idx = Array.from(items).find(li => (li.dataset && li.dataset.n3 === String(n3)));
    if (idx) idx.classList.add("is-active");
  }

  function renderList(list=null){
    const LST=list||state.idx; listEl.innerHTML="";
    for(const item of LST){
      const phone = state.phoneByN3[item.n3] || state.phoneByName[norm(item.name)] || "";
      const li=document.createElement("li"); li.dataset.n3 = String(item.n3);
      li.innerHTML=`<span>${item.name}</span><span class="country-code">${phone}</span>`;
      li.onclick=()=> zoomTo(item.n3); listEl.appendChild(li);
    }
  }

  function zoomTo(n3){
    state.layers.countries.eachLayer(l=>{ const f=l.feature; if(String(f.id).padStart(3,"0")===String(n3)){ select(l, f); } });
  }

  function setupSearch(){
    searchEl?.addEventListener("input", ()=>{
      const q=searchEl.value.trim().toLowerCase();
      const match = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
      const phone = match ? (state.phoneByN3[match.n3] || state.phoneByName[norm(match.name)] || "—") : "—";
      badgeEl && (badgeEl.textContent = phone);
      if(!q) return renderList();
      const filtered = state.idx.filter(x=> x.name.toLowerCase().includes(q));
      renderList(filtered);
    });
    searchEl?.addEventListener("keydown",(ev)=>{
      if(ev.key==="Enter"){
        ev.preventDefault();
        const q=searchEl.value.trim().toLowerCase();
        const m = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
        if(m) zoomTo(m.n3);
      }
    });
  }
})();