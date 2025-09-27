// Mapa y Códigos (UIT) — paquete embebido final (sin archivos externos).
(function(){
  const EMBED=[
    {n3:"004",name:"Afghanistan",phone:"+93"},
    {n3:"008",name:"Albania",phone:"+355"},
    {n3:"012",name:"Algeria",phone:"+213"},
    {n3:"020",name:"Andorra",phone:"+376"},
    {n3:"024",name:"Angola",phone:"+244"},
    {n3:"028",name:"Antigua and Barbuda",phone:"+1"},
    {n3:"032",name:"Argentina",phone:"+54"},
    {n3:"051",name:"Armenia",phone:"+374"},
    {n3:"036",name:"Australia",phone:"+61"},
    {n3:"040",name:"Austria",phone:"+43"},
    {n3:"031",name:"Azerbaijan",phone:"+994"},
    {n3:"050",name:"Bangladesh",phone:"+880"},
    {n3:"112",name:"Belarus",phone:"+375"},
    {n3:"056",name:"Belgium",phone:"+32"},
    {n3:"084",name:"Belize",phone:"+501"},
    {n3:"068",name:"Bolivia",phone:"+591"},
    {n3:"070",name:"Bosnia and Herzegovina",phone:"+387"},
    {n3:"072",name:"Botswana",phone:"+267"},
    {n3:"076",name:"Brazil",phone:"+55"},
    {n3:"096",name:"Brunei",phone:"+673"},
    {n3:"100",name:"Bulgaria",phone:"+359"},
    {n3:"854",name:"Burkina Faso",phone:"+226"},
    {n3:"108",name:"Burundi",phone:"+257"},
    {n3:"116",name:"Cambodia",phone:"+855"},
    {n3:"120",name:"Cameroon",phone:"+237"},
    {n3:"124",name:"Canada",phone:"+1"},
    {n3:"132",name:"Cabo Verde",phone:"+238"},
    {n3:"140",name:"Central African Republic",phone:"+236"},
    {n3:"148",name:"Chad",phone:"+235"},
    {n3:"152",name:"Chile",phone:"+56"},
    {n3:"156",name:"China",phone:"+86"},
    {n3:"170",name:"Colombia",phone:"+57"},
    {n3:"188",name:"Costa Rica",phone:"+506"},
    {n3:"191",name:"Croatia",phone:"+385"},
    {n3:"192",name:"Cuba",phone:"+53"},
    {n3:"196",name:"Cyprus",phone:"+357"},
    {n3:"203",name:"Czechia",phone:"+420"},
    {n3:"208",name:"Denmark",phone:"+45"},
    {n3:"214",name:"Dominican Republic",phone:"+1"},
    {n3:"218",name:"Ecuador",phone:"+593"},
    {n3:"818",name:"Egypt",phone:"+20"},
    {n3:"222",name:"El Salvador",phone:"+503"},
    {n3:"233",name:"Estonia",phone:"+372"},
    {n3:"231",name:"Ethiopia",phone:"+251"},
    {n3:"246",name:"Finland",phone:"+358"},
    {n3:"250",name:"France",phone:"+33"},
    {n3:"268",name:"Georgia",phone:"+995"},
    {n3:"276",name:"Germany",phone:"+49"},
    {n3:"300",name:"Greece",phone:"+30"},
    {n3:"320",name:"Guatemala",phone:"+502"},
    {n3:"340",name:"Honduras",phone:"+504"},
    {n3:"348",name:"Hungary",phone:"+36"},
    {n3:"356",name:"India",phone:"+91"},
    {n3:"360",name:"Indonesia",phone:"+62"},
    {n3:"364",name:"Iran",phone:"+98"},
    {n3:"368",name:"Iraq",phone:"+964"},
    {n3:"372",name:"Ireland",phone:"+353"},
    {n3:"376",name:"Israel",phone:"+972"},
    {n3:"380",name:"Italy",phone:"+39"},
    {n3:"388",name:"Jamaica",phone:"+1"},
    {n3:"392",name:"Japan",phone:"+81"},
    {n3:"400",name:"Jordan",phone:"+962"},
    {n3:"398",name:"Kazakhstan",phone:"+7"},
    {n3:"404",name:"Kenya",phone:"+254"},
    {n3:"410",name:"Korea, Republic of",phone:"+82"},
    {n3:"414",name:"Kuwait",phone:"+965"},
    {n3:"428",name:"Latvia",phone:"+371"},
    {n3:"422",name:"Lebanon",phone:"+961"},
    {n3:"434",name:"Libya",phone:"+218"},
    {n3:"440",name:"Lithuania",phone:"+370"},
    {n3:"442",name:"Luxembourg",phone:"+352"},
    {n3:"446",name:"Macao",phone:"+853"},
    {n3:"807",name:"North Macedonia",phone:"+389"},
    {n3:"458",name:"Malaysia",phone:"+60"},
    {n3:"462",name:"Maldives",phone:"+960"},
    {n3:"484",name:"Mexico",phone:"+52"},
    {n3:"498",name:"Moldova",phone:"+373"},
    {n3:"496",name:"Mongolia",phone:"+976"},
    {n3:"499",name:"Montenegro",phone:"+382"},
    {n3:"504",name:"Morocco",phone:"+212"},
    {n3:"508",name:"Mozambique",phone:"+258"},
    {n3:"524",name:"Nepal",phone:"+977"},
    {n3:"528",name:"Netherlands",phone:"+31"},
    {n3:"554",name:"New Zealand",phone:"+64"},
    {n3:"558",name:"Nicaragua",phone:"+505"},
    {n3:"566",name:"Nigeria",phone:"+234"},
    {n3:"578",name:"Norway",phone:"+47"},
    {n3:"586",name:"Pakistan",phone:"+92"},
    {n3:"591",name:"Panama",phone:"+507"},
    {n3:"600",name:"Paraguay",phone:"+595"},
    {n3:"604",name:"Peru",phone:"+51"},
    {n3:"608",name:"Philippines",phone:"+63"},
    {n3:"616",name:"Poland",phone:"+48"},
    {n3:"620",name:"Portugal",phone:"+351"},
    {n3:"630",name:"Puerto Rico",phone:"+1"},
    {n3:"642",name:"Romania",phone:"+40"},
    {n3:"643",name:"Russian Federation",phone:"+7"},
    {n3:"682",name:"Saudi Arabia",phone:"+966"},
    {n3:"688",name:"Serbia",phone:"+381"},
    {n3:"702",name:"Singapore",phone:"+65"},
    {n3:"703",name:"Slovakia",phone:"+421"},
    {n3:"705",name:"Slovenia",phone:"+386"},
    {n3:"710",name:"South Africa",phone:"+27"},
    {n3:"724",name:"Spain",phone:"+34"},
    {n3:"144",name:"Sri Lanka",phone:"+94"},
    {n3:"752",name:"Sweden",phone:"+46"},
    {n3:"756",name:"Switzerland",phone:"+41"},
    {n3:"764",name:"Thailand",phone:"+66"},
    {n3:"792",name:"Türkiye",phone:"+90"},
    {n3:"804",name:"Ukraine",phone:"+380"},
    {n3:"784",name:"United Arab Emirates",phone:"+971"},
    {n3:"826",name:"United Kingdom",phone:"+44"},
    {n3:"840",name:"United States",phone:"+1"},
    {n3:"858",name:"Uruguay",phone:"+598"},
    {n3:"862",name:"Venezuela",phone:"+58"},
    {n3:"704",name:"Viet Nam",phone:"+84"}
  ];

  const state={ map:null, layers:{countries:null}, idx:[], phoneByN3:Object.create(null), nameByN3:Object.create(null), phoneByName:Object.create(null), n3ByPhone:Object.create(null) };
  const $=(s)=>document.querySelector(s);
  let listEl, searchEl, badgeEl, searchCodeEl, codeNameBadge, tooltip;

  document.addEventListener("DOMContentLoaded", init);

  async function init(){
    listEl = $("#country-list"); searchEl = $("#search"); badgeEl = $("#search-code-badge");
    searchCodeEl = $("#search-code"); codeNameBadge = $("#search-code-name"); tooltip=$("#tooltip");
    loadEmbed(); exposeDebug(); initMap();
  }

  function exposeDebug(){
    window.MapaDebug = { phoneByN3: state.phoneByN3, phoneByName: state.phoneByName, n3ByPhone: state.n3ByPhone };
  }

  function normText(s){ if(!s) return ""; s=s.toLowerCase(); s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,""); return s.replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }
  function normCode(s){ if(!s) return ""; return ("+" + s.replace(/[^0-9]/g,"")); }

  function loadEmbed(){
    for (const x of EMBED){
      const n3 = String(x.n3||"").padStart(3,"0"); if(!n3) continue;
      const name = x.name||n3; const phone = x.phone||"";
      state.phoneByN3[n3]=phone; state.nameByN3[n3]=name;
      if (name) state.phoneByName[normText(name)] = phone;
      if (phone) state.n3ByPhone[normCode(phone)] = state.n3ByPhone[normCode(phone)] || n3;
    }
  }

  function initMap(){
    const map=L.map("map",{worldCopyJump:false}); state.map=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:6,minZoom:1,noWrap:true,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
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

  function baseStyle(){return{weight:1.2,color:"#2a3545",fill:false};}
  function hoverStyle(){return{weight:1.6,color:"#0ea5b7",fill:false};}
  function selectedStyle(){return{weight:1.6,color:"#22d3ee",fill:false};}

  function onEach(feature, layer){
    layer.on({
      mouseover:(e)=>{const l=e.target; l.setStyle(hoverStyle()); l.bringToFront(); showTip(e, label(feature));},
      mouseout:(e)=>{const l=e.target; (l===_selectedLayer? l.setStyle(selectedStyle()): l.setStyle(baseStyle())); hideTip();},
      mousemove:(e)=> showTip(e, label(feature)),
      click:(e)=> select(layer, feature)
    });
  }

  function label(f){ const p=f.properties||{}; const ph=p.phone?` (${p.phone})`:""; return (p.name||p.n3||"País")+ph; }
  function showTip(e,t){ if(!tooltip) return; tooltip.textContent=t; tooltip.style.left=e.originalEvent.clientX+"px"; tooltip.style.top=e.originalEvent.clientY+"px"; tooltip.style.display="block"; }
  function hideTip(){ if(tooltip) tooltip.style.display="none"; }

  let _selectedLayer=null;
  function select(layer, feature){
    if (_selectedLayer && _selectedLayer !== layer) _selectedLayer.setStyle(baseStyle());
    _selectedLayer = layer; layer.setStyle(selectedStyle());

    const p=feature.properties||{}; const name=p.name || `N3 ${p.n3}`; const n3=p.n3;
    const phone = p.phone || state.phoneByN3[n3] || state.phoneByName[normText(name)] || "";

    const nameEl=document.querySelector("#selected-country .name");
    const n3El=document.getElementById("n3-label");
    const codesInput=document.getElementById("codes-input");
    if (nameEl) nameEl.textContent = name;
    if (n3El) n3El.textContent = ""; // oculto por HTML/CSS, de todos modos
    if (codesInput) codesInput.value = phone || "";

    highlightList(n3);
    state.map.fitBounds(layer.getBounds(), {padding:[20,20]});
  }

  function highlightList(n3){
    const items = (listEl?.querySelectorAll("li"))||[];
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
      li.innerHTML=`<span>${item.name}</span><span class="country-code">${phone || "—"}</span>`;
      li.onclick=()=> zoomTo(item.n3); listEl.appendChild(li);
    }
  }

  function zoomTo(n3){
    state.layers.countries.eachLayer(l=>{ const f=l.feature; if(String(f.id).padStart(3,"0")===String(n3)){ select(l, f); } });
  }

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