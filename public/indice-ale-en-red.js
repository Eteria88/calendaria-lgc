(function(){
  function $(id){ return document.getElementById(id); }

  // --- helpers ---
  function norm(s){
    return (s||"")
      .toString()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .trim();
  }
  function tokens(q){
    q = norm(q);
    if(!q) return [];
    return q.split(/\s+/g).filter(Boolean);
  }
  function esc(s){
    return (s||"").toString()
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  }

  // --- time label ---
  try{
    var now = new Date();
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
    $("nowTZ").textContent = now.toLocaleString([], {year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"}) + " · " + tz;
  }catch(e){}

  // --- mobile menu ---
  (function(){
    var nav = $("mobileNav");
    var btn = $("menuBtn");
    var close = $("closeMenu");
    var ov = $("mobileOverlay");
    function open(){ if(!nav) return; nav.classList.add("open"); document.body.classList.add("noScroll"); nav.setAttribute("aria-hidden","false"); }
    function shut(){ if(!nav) return; nav.classList.remove("open"); document.body.classList.remove("noScroll"); nav.setAttribute("aria-hidden","true"); }
    if(btn) btn.addEventListener("click", open);
    if(close) close.addEventListener("click", shut);
    if(ov) ov.addEventListener("click", shut);
    document.addEventListener("keydown", function(ev){ if(ev.key==="Escape") shut(); });
  })();

  // --- data ---
  var DATA_URL = "./data/ale_en_red_index.json";
  var state = { items: [], view: [] };

  function toInt(x){
    var n = parseInt(x, 10);
    return isFinite(n) ? n : null;
  }

  function canonItem(raw){
    // Tolerante con distintos esquemas de JSON.
    // Soporta:
    //  - wrapper {pdf_url, updated, items:[...]}
    //  - array directo [...]
    // Item ejemplo export: { num, date, dateISO, pdfPage, url (telegram), tags, vuelta, freq }
    raw = raw || {};

    var n = (raw.n != null ? raw.n
          : raw.num != null ? raw.num
          : raw.numero != null ? raw.numero
          : raw.id != null ? raw.id
          : null);
    n = toInt(n);

    // Título: evitamos usar "snippet" si es "(Extraído de ...)"
    var titulo = raw.titulo || raw.title || raw.tema || "";
    if(!titulo && raw.snippet){
      var sn = (raw.snippet||"").toString().trim();
      if(!/^\(?\s*extra[ií]do/i.test(sn)) titulo = sn;
    }

    var fecha  = raw.fecha || raw.date || raw.fecha_str || raw.dateStr || "";
    var page   = (raw.page != null ? raw.page
               : raw.pdfPage != null ? raw.pdfPage
               : raw.pagina != null ? raw.pagina
               : null);
    page = toInt(page);

    var tags = raw.tags || raw.etiquetas || raw.labels || [];
    if(typeof tags === "string") tags = tags.split(",").map(function(x){return x.trim();}).filter(Boolean);

    var transcript = raw.transcripcion || raw.transcripción || raw.transcription || raw.telegram || raw.url || raw.link || raw.href || "";
    var youtube = raw.youtube_url || raw.youtubeUrl || raw.youtube || raw.yt || raw.yt_url || "";

    return {
      n: n,
      titulo: titulo,
      fecha: fecha,
      page: page,
      transcript_url: transcript,
      youtube_url: youtube,
      tags: Array.isArray(tags) ? tags : [],
      vuelta: (raw.vuelta != null ? toInt(raw.vuelta) : null),
      freq: raw.freq || raw.frecuencia || ""
    };
  }

  function itemHaystack(it){
    var t = [];
    t.push("ale");
    t.push("en");
    t.push("red");
    if(it.n!=null) t.push(String(it.n));
    if(it.titulo) t.push(it.titulo);
    if(it.fecha) t.push(it.fecha);
    if(it.freq) t.push(String(it.freq));
    if(it.vuelta!=null) t.push("vuelta " + String(it.vuelta));
    if(it.tags && it.tags.length) t = t.concat(it.tags.map(function(x){return "#"+x;}));
    return norm(t.join(" "));
  }

  function pdfLink(it, pdfUrl){
    if(!pdfUrl) return "";
    var p = it.page ? ("#page=" + it.page) : "";
    return pdfUrl + p;
  }

  function youtubeLink(it){
    if(it.youtube_url) return it.youtube_url;
    // Fallback: búsqueda en YouTube (sirve si todavía no cargaste el lirender(list, pdfUrl){
    var wrap = $("results");
    if(!wrap) return;
    wrap.innerHTML = "";

    $("countSpan").textContent = String(list.length);

    if(list.length === 0){
      wrap.innerHTML = '<div class="result"><div class="rTitle">Sin resultados</div><div class="small">Probá con otra palabra, con un <span class="mono">#tag</span> o con el número de transmisión.</div></div>';
      return;
    }

    for(var i=0;i<list.length;i++){
      var it = list[i];

      var yt = youtubeLink(it);
      var tr = transcriptLink(it);
      var pdf = pdfLink(it, pdfUrl);

      var btns = '<div class="btnStack">';
      btns += '<a class="btn linkBtn" href="'+esc(yt)+'" target="_blank" rel="noopener">YouTube</a>';
      if(tr){
        btns += '<a class="btn linkBtn" href="'+esc(tr)+'" target="_blank" rel="noopener">Transcripción</a>';
      }else{
        btns += '<span class="btn" style="opacity:.55">Transcripción</span>';
      }
      if(pdfUrl){
        btns += '<a class="btn linkBtn" href="'+esc(pdf||pdfUrl)+'" target="_blank" rel="noopener">PDF</a>';
      }
      btns += '</div>';

      var tags = "";
      if(it.tags && it.tags.length){
        var show = it.tags.slice(0, 12);
        tags = '<div class="tagRow">' + show.map(function(t){ return '<span class="tag">#'+esc(t)+'</span>'; }).join("") + "</div>";
      }

      var meta = [];
      meta.push('<span class="pill">N° <span class="mono">'+esc(it.n)+'</span></span>');
      if(it.fecha) meta.push('<span class="pill">'+esc(it.fecha)+'</span>');
      if(it.page) meta.push('<span class="pill">p. '+esc(it.page)+'</span>');
      if(it.vuelta!=null) meta.push('<span class="pill">Vuelta '+esc(it.vuelta)+'</span>');
      if(it.freq) meta.push('<span class="pill">'+esc(it.freq)+'</span>');

      var title = it.titulo || ("Alejandra Casado EN RED " + it.n);

      var html = ''
        + '<div class="result">'
        + '  <div class="resultTop">'
        + '    <div>'
        + '      <div class="rTitle"><a class="rTitleLink" href="'+esc(yt)+'" target="_blank" rel="noopener">'+esc(title)+'</a></div>'
        + '      <div class="rMeta">'+meta.join(" ")+'</div>'
        + '    </div>'
        +      btns
        + '  </div>'
        +      tags
        + '</div>';

      wrap.insertAdjacentHTML("beforeend", html);
    }
  }div class="rTitle">'+esc(title)+'</div>'
        + '      <div class="rMeta">'+meta.join(" ")+'</div>'
        + '    </div>'
        + '    <div>'+aOpen+'</div>'
        + '  </div>'
        +      tags
        + '</div>';

      wrap.insertAdjacentHTML("beforeend", html);
    }
  }

  function applyQuery(){
    var q = $("searchInput").value || "";
    var ts = tokens(q);
    if(ts.length === 0){
      state.view = state.items.slice(0, 80);
      render(state.view, state.pdf_url);
      return;
    }
    var out = [];
    for(var i=0;i<state.items.length;i++){
      var it = state.items[i];
      var h = it._h;
      var ok = true;
      for(var k=0;k<ts.length;k++){
        var tk = ts[k];
        // allow "#tag" queries
        if(tk[0] === "#"){
          if(h.indexOf(tk) === -1){ ok=false; break; }
        }else{
          if(h.indexOf(tk) === -1){ ok=false; break; }
        }
      }
      if(ok) out.push(it);
      if(out.length >= 120) break; // keep UI snappy
    }
    state.view = out;
    render(out, state.pdf_url);
  }

  function setPdfLink(pdfUrl){
    var btn = $("openPdfBtn");
    if(!btn) return;
    if(pdfUrl){
      btn.href = pdfUrl;
      btn.removeAttribute("aria-disabled");
      btn.classList.remove("disabled");
    }else{
      btn.href = "#";
      btn.setAttribute("aria-disabled","true");
    }
  }

  function parseQ(){
    var q = (location.search||"");
    if(q.indexOf("?")===0) q=q.slice(1);
    var o={};
    q.split("&").forEach(function(p){
      if(!p) return;
      var kv=p.split("=");
      o[decodeURIComponent(kv[0]||"")] = decodeURIComponent(kv[1]||"");
    });
    return o;
  }

  function boot(){
    fetch(DATA_URL, {cache:"no-store"})
      .then(function(r){ return r.json(); })
      .then(function(data){
        // Acepta wrapper {pdf_url, updated, items:[...]}
        // o array directo [...]
        var itemsRaw;
        if(Array.isArray(data)){
          itemsRaw = data;
          state.pdf_url = "";
        }else{
          itemsRaw = data.items || data.data || [];
          state.pdf_url = data.pdf_url || data.pdfUrl || "";
        }
        if(!state.pdf_url && window.ALE_EN_RED_PDF_URL){ state.pdf_url = window.ALE_EN_RED_PDF_URL; }
        setPdfLink(state.pdf_url);

        if(!Array.isArray(data) && data.updated){
          $("updatedSpan").textContent = " · actualizado: " + data.updated;
        }

        state.items = (itemsRaw||[])
          .map(canonItem)
          .filter(function(it){ return it && it.n != null; })
          .slice()
          .sort(function(a,b){ return (a.n||0) - (b.n||0); })
          .map(function(it){ it._h = itemHaystack(it); return it; });

        // initial query
        var qp = parseQ();
        if(qp.q){
          $("searchInput").value = qp.q;
        }
        applyQuery();
      })
      .catch(function(){
        $("results").innerHTML = '<div class="result"><div class="rTitle">No se pudo cargar el índice</div><div class="rMeta">Revisá que exista <span class="mono">/data/ale_en_red_index.json</span>.</div></div>';
        $("countSpan").textContent = "0";
      });

    var input = $("searchInput");
    if(input){
      input.addEventListener("input", applyQuery);
    }
    var clear = $("clearBtn");
    if(clear){
      clear.addEventListener("click", function(){
        $("searchInput").value = "";
        applyQuery();
        $("searchInput").focus();
      });
    }
  }

  boot();
})();