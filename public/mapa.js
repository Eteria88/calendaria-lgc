// Calendaria · Mapa y Códigos (UIT) — Autofill 100%
(function(){
  const state={ map:null, layers:{countries:null}, idx:[], phoneByN3:{}, phoneByName:{} };
  const $=(s)=>document.querySelector(s);
  let tooltip, listEl, selectedEl, searchEl, badgeEl;

  document.addEventListener("DOMContentLoaded", init);
  async function init(){
    tooltip=$("#tooltip"); listEl=$("#country-list"); selectedEl=$("#selected-country"); searchEl=$("#search"); badgeEl=$("#search-code-badge");
    await loadUIT(); initMap();
  }

  async function loadUIT(){
    function norm(s){ if(!s) return ""; s=s.toLowerCase(); s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return s.replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }
    const byN3={}, byName={};
    try{
      const r=await fetch("https://restcountries.com/v3.1/all"); const data=await r.json();
      for(const c of data){
        const n3=(c.ccn3||"").toString().padStart(3,"0");
        const root=(c.idd&&c.idd.root)?c.idd.root:"+"; const suf=(c.idd&&Array.isArray(c.idd.suffixes)&&c.idd.suffixes.length)?c.idd.suffixes[0]:"";
        const phone=(root||suf)? `${root}${suf}` : "";
        if(n3 && phone) byN3[n3]=phone;
        const names=[]; if(c.name){ if(c.name.common) names.push(c.name.common); if(c.name.official) names.push(c.name.official); }
        if(Array.isArray(c.altSpellings)) names.push(...c.altSpellings);
        for(const nm of new Set(names.map(norm).filter(Boolean))) byName[nm]=phone;
      }
    }catch(e){ console.warn("UIT fetch failed", e); }
    state.phoneByN3=byN3; state.phoneByName=byName;
  }

  function initMap(){
    const map=L.map("map",{worldCopyJump:true}); state.map=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:6,minZoom:1,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    map.setView([15,0],2); loadCountries();
  }

  async function loadCountries(){
    const res=await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
    const topo=await res.json();
    const geo=topojson.feature(topo, topo.objects.countries);
    const layer=L.geoJSON(geo,{style:baseStyle,onEachFeature:onEach}); layer.addTo(state.map); state.layers.countries=layer;
    state.idx = geo.features.map(f=>{
      const n3=String(f.id).padStart(3,"0"); f.properties=f.properties||{}; f.properties.n3=n3;
      const phone = state.phoneByN3[n3] || byName(f.properties.name);
      f.properties.phone = phone || ""; // guardar en el feature
      return { name: f.properties.name || `N3 ${n3}`, n3 };
    }).sort((a,b)=> a.name.localeCompare(b.name));
    renderList(); setupSearch();
  }

  function baseStyle(){return{weight:.8,color:"#2a3545",fillColor:"#14202e",fillOpacity:.6};}
  function hoverStyle(){return{weight:1.2,color:"#4a90e2",fillColor:"#19304a",fillOpacity:.8};}
  function selectedStyle(){return{weight:1.3,color:"#22d3ee",fillColor:"#0b3a4a",fillOpacity:.85};}

  function onEach(feature, layer){
    layer.on({
      mouseover:(e)=>{const l=e.target; l.setStyle(hoverStyle()); l.bringToFront(); showTip(e, label(feature));},
      mouseout:(e)=>{const l=e.target; l.setStyle(baseStyle()); hideTip();},
      mousemove:(e)=> showTip(e, label(feature)),
      click:(e)=> select(layer, feature)
    });
  }

  function label(f){ const p=f.properties||{}; const ph=p.phone?` (${p.phone})`:""; return (p.name||p.n3||"País")+ph; }
  function showTip(e,t){ tooltip.textContent=t; tooltip.style.left=e.originalEvent.clientX+"px"; tooltip.style.top=e.originalEvent.clientY+"px"; tooltip.style.display="block"; }
  function hideTip(){ tooltip.style.display="none"; }

  function byName(name){
    if(!name) return ""; const k=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
    return state.phoneByName[k] || "";
  }

  function select(layer, feature){
    const p=feature.properties||{}; const name=p.name || `N3 ${p.n3}`;
    const phone = p.phone || byName(p.name) || ""; // SIEMPRE sacamos el UIT del país
    // UI auto-fill SIEMPRE con UIT (el usuario no necesita cargar nada)
    selectedEl.innerHTML = `
      <div class="row"><strong>${name}</strong></div>
      <div class="row muted">Código UIT:</div>
      <div class="big-code">${phone || "—"}</div>`;
    state.map.fitBounds(layer.getBounds(), {padding:[20,20]});
  }

  function renderList(list=null){
    const LST=list||state.idx; listEl.innerHTML="";
    for(const item of LST){
      const phone = state.phoneByN3[item.n3] || byName(item.name) || "";
      const li=document.createElement("li"); li.innerHTML=`<span>${item.name}</span><span class="country-code">${phone}</span>`;
      li.onclick=()=> zoomTo(item.n3); listEl.appendChild(li);
    }
  }

  function zoomTo(n3){
    state.layers.countries.eachLayer(l=>{ const f=l.feature; if(String(f.id).padStart(3,"0")===n3){ select(l, f); } });
  }

  function setupSearch(){
    searchEl.addEventListener("input", ()=>{
      const q=searchEl.value.trim().toLowerCase();
      updateBadge(q);
      if(!q) return renderList();
      const filtered = state.idx.filter(x=> x.name.toLowerCase().includes(q));
      renderList(filtered);
    });
    searchEl.addEventListener("keydown",(ev)=>{
      if(ev.key==="Enter"){ ev.preventDefault();
        const q=searchEl.value.trim().toLowerCase();
        const m = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
        if(m) zoomTo(m.n3);
      }
    });
    updateBadge("");
  }

  function updateBadge(q){
    const m = q? (state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q))) : null;
    const phone = m ? (state.phoneByN3[m.n3] || byName(m.name) || "—") : "—";
    badgeEl.textContent = phone;
  }
})();