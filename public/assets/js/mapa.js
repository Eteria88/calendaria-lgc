// Calendaria · Mapa y Códigos — ITU auto-fill
(function(){
  const state={map:null,layers:{countries:null},selected:null,idxByName:[],saved:{},phoneByN3:{}};
  const $=(s)=>document.querySelector(s);
  const tooltip=$("#tooltip"), selectedBox=$("#selected-country"), savedList=$("#saved-codes");
  document.addEventListener("DOMContentLoaded", init);
  async function init(){ await loadITU(); initMap(); }

  async function loadITU(){
    try{
      const r=await fetch("https://restcountries.com/v3.1/all");
      const data=await r.json(); const map={};
      for(const c of data){
        const n3=(c.ccn3||"").toString().padStart(3,"0"); if(!n3) continue;
        const root=(c.idd && c.idd.root)? c.idd.root : "+";
        const suf=(c.idd && Array.isArray(c.idd.suffixes) && c.idd.suffixes.length)? c.idd.suffixes[0] : "";
        if(root||suf) map[n3]=`${root}${suf}`;
      } state.phoneByN3=map;
    }catch(e){ console.warn("No ITU codes", e); }
  }

  function initMap(){
    state.map=L.map("map",{zoomControl:true,worldCopyJump:true});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:6,minZoom:1,attribution:"&copy; OpenStreetMap contributors"}).addTo(state.map);
    state.map.setView([15,0],2); loadCountries();
  }

  async function loadCountries(){
    const res=await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
    const topo=await res.json(); const geo=topojson.feature(topo, topo.objects.countries);
    geo.features.forEach(f=>{ const n3=String(f.id).padStart(3,"0"); f.properties=f.properties||{}; f.properties.n3=n3; if(!f.properties.name) f.properties.name=`N3 ${n3}`; const ph=state.phoneByN3[n3]; if(ph) f.properties.phone=ph; });
    const layer=L.geoJSON(geo,{style:baseStyle,onEachFeature:onEachCountry}).addTo(state.map);
    state.layers.countries=layer; buildIndex(geo.features); restoreSaved();
  }

  function baseStyle(){return{weight:.8,color:"#2a3545",fillColor:"#14202e",fillOpacity:.6};}
  function hoverStyle(){return{weight:1.2,color:"#4a90e2",fillColor:"#19304a",fillOpacity:.8};}
  function selectedStyle(){return{weight:1.3,color:"#22d3ee",fillColor:"#0b3a4a",fillOpacity:.85};}

  function onEachCountry(feature, layer){
    layer.on({mouseover:(e)=>{const l=e.target;l.setStyle(hoverStyle());l.bringToFront();showTooltip(e,label(feature));},
              mouseout:(e)=>{const l=e.target;(state.selected===l?l.setStyle(selectedStyle()):l.setStyle(baseStyle()));hideTooltip();},
              mousemove:(e)=>showTooltip(e,label(feature)),
              click:(e)=>selectCountry(e.target,feature)});
  }

  function label(f){const p=f.properties||{};return (p.name||p.n3||"País")+(p.phone?` (${p.phone})`:"");}
  function showTooltip(e,t){tooltip.textContent=t;tooltip.style.left=e.originalEvent.clientX+"px";tooltip.style.top=e.originalEvent.clientY+"px";tooltip.style.display="block";}
  function hideTooltip(){tooltip.style.display="none";}

  function selectCountry(layer,feature){
    if(state.selected && state.selected!==layer) state.selected.setStyle(baseStyle());
    state.selected=layer; layer.setStyle(selectedStyle());
    const p=feature.properties||{}; const name=p.name||`N3 ${p.n3}`; const def=p.phone||"";
    const current=state.saved[p.n3]||{codigos:[],notes:""};
    const initial=(current.codigos&&current.codigos.length)?current:{codigos:(def?[def]:[]),notes:current.notes||""};
    renderSelected(name,p.n3,initial); state.map.fitBounds(layer.getBounds(),{padding:[20,20]});
  }

  function renderSelected(name,key,data){
    selectedBox.innerHTML=`
      <div class="row"><span class="name">${name}</span> <span class="country-code">(N3: ${key})</span></div>
      <div class="row muted" style="margin-top:4px;">Códigos UIT prellenados si existen; puedes editarlos.</div>
      <div style="margin-top:10px;"><label for="codes-input">Códigos (separados por coma)</label>
        <input id="codes-input" type="text" placeholder="+54, +1…" value="${(data.codigos||[]).join(", ")}" /></div>
      <div style="margin-top:10px;"><label for="notes-input">Notas</label>
        <input id="notes-input" type="text" placeholder="Notas para este país…" value="${data.notes||""}" /></div>
      <div style="margin-top:12px; display:flex; gap:8px;"><button id="btn-save" class="btn">Guardar</button><button id="btn-clear" class="btn">Limpiar</button></div>`;
    $("#btn-save").onclick=()=>{const codes=$("#codes-input").value.split(",").map(s=>s.trim()).filter(Boolean);const notes=$("#notes-input").value.trim();state.saved[key]={codigos:codes,notes};persist();flash("Guardado");renderSavedList();};
    $("#btn-clear").onclick=()=>{delete state.saved[key];persist();renderSavedList();flash("Limpio");$("#codes-input").value="";$("#notes-input").value="";};
  }

  function flash(msg){const n=document.createElement("div");n.textContent=msg;n.style.position="fixed";n.style.right="18px";n.style.bottom="18px";n.style.padding="10px 12px";n.style.border="1px solid #243142";n.style.background="#0f1620";n.style.color="#e8ecf1";n.style.borderRadius="10px";n.style.zIndex=9999;document.body.appendChild(n);setTimeout(()=>n.remove(),1200);}
  function persist(){try{localStorage.setItem("calendaria_mapa_codigos",JSON.stringify(state.saved));}catch(e){}}
  function restoreSaved(){try{const raw=localStorage.getItem("calendaria_mapa_codigos");if(raw)state.saved=JSON.parse(raw);}catch(e){};renderSavedList();}

  function renderSavedList(){
    const entries=Object.entries(state.saved).sort((a,b)=>a[0].localeCompare(b[0]));
    savedList.innerHTML=entries.length?"":'<li class="muted">No hay códigos guardados.</li>';
    for(const [key,data] of entries){
      const li=document.createElement("li"); const codes=(data.codigos||[]).join(", "); const notes=data.notes||"";
      li.innerHTML=`<div><div><strong>N3 ${key}</strong> <span class="country-code">${codes? "(" + codes + ")":""}</span></div><div class="muted" style="max-width:38ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${notes}</div></div><div style="display:flex;gap:6px;"><button data-key="${key}" data-action="zoom">Ir</button><button data-key="${key}" data-action="del">Borrar</button></div>`;
      savedList.appendChild(li);
    }
    savedList.onclick=(e)=>{const b=e.target.closest("button");if(!b)return;const key=b.getAttribute("data-key");const a=b.getAttribute("data-action");if(a==="del"){delete state.saved[key];persist();renderSavedList();}else if(a==="zoom"){zoom(key);}}
  }

  function zoom(key){state.layers.countries.eachLayer(l=>{const f=l.feature;const n3=f?.properties?.n3;if(n3===key){selectCountry(l,f);}});}

  function buildIndex(features){
    state.idxByName = features.map(f=>({name:f.properties.name||`N3 ${f.properties.n3}`,n3:f.properties.n3})).sort((a,b)=>a.name.localeCompare(b.name));
    const list=document.getElementById("country-list"); list.innerHTML="";
    for(const item of state.idxByName){ const li=document.createElement("li"); const phone=state.phoneByN3[item.n3]||""; li.innerHTML=`<span>${item.name}</span> <span class="country-code">${phone}</span>`; li.onclick=()=>zoom(item.n3); list.appendChild(li); }
  }

  window.MapaCodigos={ filterCountryList(q){ q=(q||"").trim().toLowerCase(); const base=state.idxByName; if(!q){return buildIndex(state.layers.countries.toGeoJSON().features);} const f=base.filter(x=>x.name.toLowerCase().includes(q) || (x.n3||"").includes(q)); const list=document.getElementById("country-list"); list.innerHTML=""; for(const item of f){const li=document.createElement("li"); const phone=state.phoneByN3[item.n3]||""; li.innerHTML=`<span>${item.name}</span> <span class="country-code">${phone}</span>`; li.onclick=()=>zoom(item.n3); list.appendChild(li);} } };
})();