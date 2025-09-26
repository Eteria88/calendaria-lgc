// Mapa y Códigos (UIT) — usa dataset local primero y RestCountries como fallback
(function(){
  const state={ map:null, layers:{countries:null}, idx:[], phoneByN3:{}, nameByN3:{}, phoneByName:{} };
  const $=(s)=>document.querySelector(s);
  let tooltip, listEl, selectedEl, searchEl, badgeEl;

  document.addEventListener("DOMContentLoaded", init);
  async function init(){
    tooltip=$("#tooltip"); listEl=$("#country-list"); selectedEl=$("#selected-country"); searchEl=$("#search"); badgeEl=$("#search-code-badge");
    await loadLocal(); await loadRemote(); initMap();
  }

  function norm(s){ if(!s) return ""; s=s.toLowerCase(); s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return s.replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }

  async function loadLocal(){
    try{
      const r=await fetch("./itu-codes.json",{cache:"no-store"}); const arr=await r.json();
      for(const x of arr){ state.phoneByN3[x.n3]=x.phone||""; state.nameByN3[x.n3]=x.name||x.n3; state.phoneByName[norm(x.name)]=x.phone||""; }
    }catch(e){ console.warn("Local dataset missing", e); }
  }

  async function loadRemote(){
    try{
      const r=await fetch("https://restcountries.com/v3.1/all?fields=ccn3,idd,name,altSpellings",{cache:"no-store"});
      const data=await r.json();
      for(const c of data){
        const n3=(c.ccn3||"").toString().padStart(3,"0");
        const root=(c.idd&&c.idd.root)?c.idd.root:"+"; const suf=(c.idd&&Array.isArray(c.idd.suffixes)&&c.idd.suffixes.length)?c.idd.suffixes[0]:"";
        const phone=(root||suf)? `${root}${suf}` : "";
        if(n3){ if(phone) state.phoneByN3[n3]=state.phoneByN3[n3]||phone; state.nameByN3[n3]=state.nameByN3[n3]||(c.name&&c.name.common)||n3; }
        const names=[]; if(c.name){ if(c.name.common) names.push(c.name.common); if(c.name.official) names.push(c.name.official); }
        if(Array.isArray(c.altSpellings)) names.push(...c.altSpellings);
        for(const nm of new Set(names.map(norm).filter(Boolean))){ if(phone) state.phoneByName[nm]=state.phoneByName[nm]||phone; }
      }
    }catch(e){ /* offline fallback ok */ }
  }

  function initMap(){
    const map=L.map("map",{worldCopyJump:true}); state.map=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:6,minZoom:1,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    map.setView([15,0],2); loadCountries();
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

  function onEach(feature, layer){
    layer.on({
      mouseover:(e)=>{const l=e.target; l.setStyle(hoverStyle()); l.bringToFront(); showTip(e, label(feature));},
      mouseout:(e)=>{const l=e.target; l.setStyle(baseStyle()); hideTip();},
      mousemove:(e)=> showTip(e, label(feature)),
      click:(e)=> select(layer, feature)
    });
  }

  function label(f){ const p=f.properties||{}; const ph=p.phone?` (${p.phone})`:""; return (p.name||p.n3||"País")+ph; }
  function showTip(e,t){ if(!tooltip) return; tooltip.textContent=t; tooltip.style.left=e.originalEvent.clientX+"px"; tooltip.style.top=e.originalEvent.clientY+"px"; tooltip.style.display="block"; }
  function hideTip(){ if(tooltip) tooltip.style.display="none"; }

  function select(layer, feature){
    const p=feature.properties||{}; const name=p.name || `N3 ${p.n3}`;
    const phone = p.phone || state.phoneByN3[p.n3] || state.phoneByName[norm(name)] || "—";
    const codesInput = document.getElementById("codes-input");
    if (codesInput) codesInput.value = phone || "";
    const titleName = document.querySelector("#selected-country .name");
    const n3lab = document.getElementById("n3-label");
    if (titleName) titleName.textContent = name;
    if (n3lab) n3lab.textContent = p.n3 ? `(N3: ${p.n3})` : "";
    state.map.fitBounds(layer.getBounds(), {padding:[20,20]});
  }

  function renderList(list=null){
    const LST=list||state.idx; const el=document.getElementById("country-list"); el.innerHTML="";
    for(const item of LST){
      const phone = state.phoneByN3[item.n3] || state.phoneByName[norm(item.name)] || "";
      const li=document.createElement("li"); li.innerHTML=`<span>${item.name}</span><span class="country-code">${phone}</span>`;
      li.onclick=()=> zoomTo(item.n3); el.appendChild(li);
    }
  }

  function zoomTo(n3){
    state.layers.countries.eachLayer(l=>{ const f=l.feature; if(String(f.id).padStart(3,"0")===n3){ select(l, f); } });
  }

  function setupSearch(){
    const el=document.getElementById("search");
    const badge=document.getElementById("search-code-badge");
    el.addEventListener("input", ()=>{
      const q=el.value.trim().toLowerCase();
      const match = state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q));
      const phone = match ? (state.phoneByN3[match.n3] || state.phoneByName[norm(match.name)] || "—") : "—";
      badge.textContent = phone;
      if(!q) return renderList();
      const filtered = state.idx.filter(x=> x.name.toLowerCase().includes(q));
      renderList(filtered);
    });
    el.addEventListener("keydown",(ev)=>{ if(ev.key==="Enter"){ ev.preventDefault(); const q=el.value.trim().toLowerCase(); const m=state.idx.find(x=> x.name.toLowerCase()===q) || state.idx.find(x=> x.name.toLowerCase().startsWith(q)) || state.idx.find(x=> x.name.toLowerCase().includes(q)); if(m) zoomTo(m.n3); } });
  }
})();