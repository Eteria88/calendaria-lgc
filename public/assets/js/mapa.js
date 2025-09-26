// Calendaria · Mapa y Códigos — ITU + buscador con código en vivo
(function () {
  const state = { map:null, layers:{countries:null}, selected:null, idxByName:[], saved:{}, phoneByN3:{} };
  const $ = (sel) => document.querySelector(sel);
  let tooltip, selectedBox, savedList, countryList, searchInput, badgeEl;

  document.addEventListener("DOMContentLoaded", init);
  async function init(){
    tooltip=$("#tooltip"); selectedBox=$("#selected-country"); savedList=$("#saved-codes"); countryList=$("#country-list"); searchInput=$("#search");
    await loadITUPhoneCodes(); initMap();
  }

  async function loadITUPhoneCodes(){
    try{
      const res = await fetch("https://restcountries.com/v3.1/all");
      const data = await res.json();
      const phoneByN3 = {};
      for (const c of data){
        const n3 = (c.ccn3 || "").toString().padStart(3,"0"); if(!n3) continue;
        const root = (c.idd && c.idd.root) ? c.idd.root : "+";
        const suf  = (c.idd && Array.isArray(c.idd.suffixes) && c.idd.suffixes.length) ? c.idd.suffixes[0] : "";
        if (root || suf) phoneByN3[n3] = `${root}${suf}`;
      }
      state.phoneByN3 = phoneByN3;
    }catch(e){ console.warn("No se pudieron cargar códigos ITU:", e); }
  }

  function initMap(){
    state.map = L.map("map", { zoomControl:true, worldCopyJump:true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:6,minZoom:1,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.map);
    state.map.setView([15,0],2);
    loadCountries();
  }

  async function loadCountries(){
    try{
      const res = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
      const topo = await res.json();
      const geo = topojson.feature(topo, topo.objects.countries);
      geo.features.forEach(f=>{
        const n3 = String(f.id).padStart(3,"0");
        f.properties = f.properties || {};
        f.properties.n3 = n3;
        if(!f.properties.name) f.properties.name = `N3 ${n3}`;
        const phone = state.phoneByN3[n3]; if (phone) f.properties.phone = phone;
      });
      const layer = L.geoJSON(geo, { style: baseStyle, onEachFeature: onEachCountry }).addTo(state.map);
      state.layers.countries = layer;
      buildCountryIndex(geo.features);
      setupSearchBadge();
      restoreSaved();
    }catch(err){ console.error("Error cargando países:", err); }
  }

  function baseStyle(){ return { weight:.8, color:"#2a3545", fillColor:"#14202e", fillOpacity:.6 }; }
  function hoverStyle(){ return { weight:1.2, color:"#4a90e2", fillColor:"#19304a", fillOpacity:.8 }; }
  function selectedStyle(){ return { weight:1.3, color:"#22d3ee", fillColor:"#0b3a4a", fillOpacity:.85 }; }

  function onEachCountry(feature, layer){
    layer.on({
      mouseover:(e)=>{ const l=e.target; l.setStyle(hoverStyle()); l.bringToFront(); showTooltip(e, getLabel(feature)); },
      mouseout:(e)=>{ const l=e.target; (state.selected===l? l.setStyle(selectedStyle()):l.setStyle(baseStyle())); hideTooltip(); },
      mousemove:(e)=>{ showTooltip(e, getLabel(feature)); },
      click:(e)=>{ selectCountryLayer(e.target, feature); }
    });
  }

  function getLabel(feature){ const p=feature.properties||{}; const phone=p.phone?` (${p.phone})`:""; return (p.name||p.n3||"País")+phone; }
  function showTooltip(e,text){ tooltip.textContent=text; tooltip.style.left=e.originalEvent.clientX+"px"; tooltip.style.top=e.originalEvent.clientY+"px"; tooltip.style.display="block"; }
  function hideTooltip(){ tooltip.style.display="none"; }

  function selectCountryLayer(layer, feature){
    if (state.selected && state.selected !== layer) state.selected.setStyle(baseStyle());
    state.selected = layer; layer.setStyle(selectedStyle());
    const p = feature.properties || {}; const name = p.name || `N3 ${p.n3}`; const defPhone = p.phone || "";
    const current = state.saved[p.n3] || { codigos:[], notes:"" };
    const initial = (current.codigos && current.codigos.length) ? current : { codigos: (defPhone? [defPhone]:[]), notes: current.notes||"" };
    renderSelected(name, p.n3, initial);
    state.map.fitBounds(layer.getBounds(), { padding:[20,20] });
  }

  function renderSelected(name, key, data){
    selectedBox.innerHTML = `
      <div class="row"><span class="name">${name}</span> <span class="country-code">(N3: ${key})</span></div>
      <div class="row muted" style="margin-top:4px;">Códigos UIT prellenados si existen; puedes editarlos.</div>
      <div style="margin-top:10px;"><label for="codes-input">Códigos (separados por coma)</label>
        <input id="codes-input" type="text" placeholder="+54, +1…" value="${(data.codigos||[]).join(", ")}" /></div>
      <div style="margin-top:10px;"><label for="notes-input">Notas</label>
        <input id="notes-input" type="text" placeholder="Notas para este país…" value="${data.notes || ""}" /></div>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button id="btn-save" class="btn">Guardar</button>
        <button id="btn-clear" class="btn">Limpiar</button>
      </div>`;
    $("#btn-save").onclick = ()=>{ const codes=$("#codes-input").value.split(",").map(s=>s.trim()).filter(Boolean); const notes=$("#notes-input").value.trim(); saveCodes(key,{codigos:codes,notes}); flashSaved(`${name} guardado`); renderSavedList(); };
    $("#btn-clear").onclick = ()=>{ delete state.saved[key]; persist(); renderSavedList(); flashSaved(`Se borraron los códigos de ${name}`); $("#codes-input").value=""; $("#notes-input").value=""; };
  }

  function flashSaved(msg){ const n=document.createElement("div"); n.textContent=msg; n.style.position="fixed"; n.style.right="18px"; n.style.bottom="18px"; n.style.padding="10px 12px"; n.style.border="1px solid #243142"; n.style.background="#0f1620"; n.style.color="#e8ecf1"; n.style.borderRadius="10px"; n.style.zIndex=9999; document.body.appendChild(n); setTimeout(()=>n.remove(),1500); }
  function saveCodes(key, data){ state.saved[key] = { codigos:data.codigos||[], notes:data.notes||"" }; persist(); }
  function persist(){ try{ localStorage.setItem("calendaria_mapa_codigos", JSON.stringify(state.saved)); }catch(e){} }
  function restoreSaved(){ try{ const raw=localStorage.getItem("calendaria_mapa_codigos"); if(raw) state.saved=JSON.parse(raw);}catch(e){}; renderSavedList(); }

  function renderSavedList(){
    const entries=Object.entries(state.saved).sort((a,b)=> a[0].localeCompare(b[0]));
    savedList.innerHTML=""; if(!entries.length){ savedList.innerHTML='<li class="muted">No hay códigos guardados.</li>'; return; }
    for (const [key, data] of entries){
      const li=document.createElement("li"); const codes=(data.codigos||[]).join(", "); const notes=data.notes||"";
      li.innerHTML = `<div><div><strong>N3 ${key}</strong> <span class="country-code">${codes ? "(" + codes + ")" : ""}</span></div><div class="muted" style="max-width:38ch; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${notes}</div></div><div style="display:flex; gap:6px;"><button data-key="${key}" data-action="zoom">Ir</button><button data-key="${key}" data-action="del">Borrar</button></div>`;
      savedList.appendChild(li);
    }
    savedList.onclick = (e)=>{ const btn=e.target.closest("button"); if(!btn) return; const key=btn.getAttribute("data-key"); const action=btn.getAttribute("data-action"); if(action==="del"){ delete state.saved[key]; persist(); renderSavedList(); } else if(action==="zoom"){ zoomToN3(key); } };
  }

  function zoomToN3(n3){ state.layers.countries.eachLayer(l=>{ const f=l.feature; if(f?.properties?.n3===n3){ selectCountryLayer(l,f); }}); }

  function buildCountryIndex(features){
    state.idxByName = features.map(f=>({ name: f.properties.name || `N3 ${f.properties.n3}`, n3: f.properties.n3 })).sort((a,b)=> a.name.localeCompare(b.name));
    renderCountryList();
  }

  function renderCountryList(filtered=null){
    const list = filtered || state.idxByName;
    countryList.innerHTML="";
    list.forEach(item=>{
      const li=document.createElement("li");
      const phone=state.phoneByN3[item.n3]||"";
      li.innerHTML = `<span>${item.name}</span> <span class="country-code">${phone}</span>`;
      li.onclick = ()=> zoomToN3(item.n3);
      countryList.appendChild(li);
    });
    updateSearchBadge();
  }

  // === Buscador: badge con código + Enter ===
  function setupSearchBadge(){
    if(!searchInput) return;
    const parent = searchInput.parentElement;
    if (parent && !parent.classList.contains("search-row")){
      const row=document.createElement("div"); row.className="search-row"; parent.insertBefore(row, searchInput); row.appendChild(searchInput);
      badgeEl=document.createElement("div"); badgeEl.id="search-code-badge"; badgeEl.textContent="—"; row.appendChild(badgeEl);
    } else {
      badgeEl=document.createElement("div"); badgeEl.id="search-code-badge"; badgeEl.textContent="—"; parent.appendChild(badgeEl);
    }
    const style=document.createElement("style");
    style.textContent=`.search-row{display:flex;align-items:center;gap:8px} #search{flex:1} #search-code-badge{border:1px solid #1b212b;background:#0f1620;color:#e8ecf1;border-radius:10px;padding:6px 10px;font-size:12px;white-space:nowrap;min-width:64px;text-align:center}`;
    document.head.appendChild(style);

    searchInput.addEventListener("input", ()=>{ filterCountryList(searchInput.value); updateSearchBadge(); });
    searchInput.addEventListener("keydown", (ev)=>{ if(ev.key==="Enter"){ const m=bestMatch(searchInput.value); if(m){ ev.preventDefault(); zoomToN3(m.n3);} } });
    updateSearchBadge();
  }

  function bestMatch(q){
    q=(q||"").trim().toLowerCase(); if(!q) return null;
    let m = state.idxByName.find(x => (x.name||"").toLowerCase() === q); if(m) return m;
    m = state.idxByName.find(x => (x.name||"").toLowerCase().startsWith(q)); if(m) return m;
    m = state.idxByName.find(x => (x.name||"").toLowerCase().includes(q)); return m || null;
  }

  function updateSearchBadge(){
    if(!badgeEl) return;
    const m = bestMatch(searchInput ? searchInput.value : "");
    if(m){ const phone=state.phoneByN3[m.n3]||"—"; badgeEl.textContent=phone; badgeEl.title=`${m.name} · ${phone}`; }
    else { badgeEl.textContent="—"; badgeEl.title="Código UIT"; }
  }

  // Exponer solo el filtro (compatibilidad con HTML existente)
  window.MapaCodigos = {
    filterCountryList(q){
      q=(q||"").trim().toLowerCase();
      if(!q){ renderCountryList(); return; }
      const filtered = state.idxByName.filter(x => x.name.toLowerCase().includes(q) || (x.n3||"").includes(q));
      renderCountryList(filtered);
    }
  };
})();