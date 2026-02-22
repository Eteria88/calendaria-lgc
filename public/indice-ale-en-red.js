(function(){
  function $(id){ return document.getElementById(id); }
  function esc(s){ return (s||'').toString().replace(/[&<>"']/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function norm(s){
    s = (s||'').toString().toLowerCase();
    try{ s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){}
    return s.replace(/\u200b/g,' ').replace(/\s+/g,' ').trim();
  }
  function parseQuery(){
    var q = new URLSearchParams(location.search).get('q') || '';
    return q;
  }
  function youtubeFallback(n){
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Alejandra Casado en red ' + n);
  }


  // Inline SVG icons (monocromo, consistente en todos los dispositivos)
  var ICONS = {
    calendar: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>',
    gear: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"></path><path d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.2-2-3.4-2.3.5a7.8 7.8 0 0 0-1.7-1L15.2 4H8.8L8.5 6.9a7.8 7.8 0 0 0-1.7 1L4.5 7.4 2.5 10.8 4.5 12a7.9 7.9 0 0 0 .1 1l-2 1.2 2 3.4 2.3-.5a7.8 7.8 0 0 0 1.7 1l.3 2.9h6.4l.3-2.9a7.8 7.8 0 0 0 1.7-1l2.3.5 2-3.4-2-1.2z"></path></svg>',
    compass: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M14.8 9.2l-1.4 5.6-5.6 1.4 1.4-5.6 5.6-1.4z"></path></svg>',
    note: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8M8 17h8M8 9h4"></path></svg>'
  };
  function icon(name){ return ICONS[name] || ''; }

  function ensureIconStyles(){
    if(document.getElementById('ico-style')) return;
    var st = document.createElement('style');
    st.id = 'ico-style';
    st.textContent = [
      '.pill.has-ico{display:inline-flex;align-items:center;gap:6px;}',
      '.pill.has-ico>span{line-height:1;}',
      '.pill.has-ico .ico{width:14px;height:14px;flex:0 0 14px;display:block;stroke:currentColor;fill:none;stroke-width:1.8;opacity:.85;}',
      '.btn.has-ico{display:inline-flex;align-items:center;gap:8px;}',
      '.btn.has-ico .ico{width:14px;height:14px;flex:0 0 14px;display:block;stroke:currentColor;fill:none;stroke-width:1.8;opacity:.9;}','#count strong{font-weight:700;}','#count .dim{opacity:.55;}'
    ].join('');
    document.head.appendChild(st);
  }



  var state = { data:null, items:[], view:[] };

  function loadData(){
    // 1) Try fetch (normal hosting)
    fetch('./data/ale_en_red_index.json', {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){ state.data=d; boot(); })
      .catch(function(err){
        // 2) Fallback embedded (GitHub preview / file://)
        if(window.ALE_EN_RED_INDEX && window.ALE_EN_RED_INDEX.items){
          state.data = window.ALE_EN_RED_INDEX;
          boot();
          return;
        }
        showErr('No pude cargar el índice. Si estás en un “preview” que no sirve archivos relativos, probá desde la app publicada. Detalle: ' + (err && err.message ? err.message : err));
      });
  }

  function boot(){
    ensureIconStyles();
    state.items = (state.data.items || []).map(function(it){
      return {
        n: it.n,
        raw_title: it.title || '',
        // ✅ Formato pedido (sin paréntesis)
        title_display: 'Alejandra Casado EN RED ' + it.n,
        title: it.title || ('Alejandra Casado en Red ' + it.n),
        date_raw: it.date_raw || '',
        date: it.date || '',
        metrics: it.metrics || '',
        vuelta: it.vuelta || '',
        tags: Array.isArray(it.tags)? it.tags : [],
        youtube_url: it.youtube_url || '',
        transcripcion_url: it.transcripcion_url || ''
      };
    });

    // init UI
    var qEl = $('q');
    qEl.value = parseQuery();

    qEl.addEventListener('input', function(){ render(filter(qEl.value)); });
    qEl.addEventListener('keydown', function(ev){ if(ev.key==='Escape'){ qEl.value=''; render(filter('')); } });

    render(filter(qEl.value));

    // Toggle de hashtags (delegación)
    var grid = $('grid');
    grid.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.classList && ev.target.classList.contains('tagToggle') ? ev.target : null;
      if(!btn) return;
      var open = btn.getAttribute('data-open') === '1';
      var card = btn.closest('.card');
      if(!card) return;
      card.querySelectorAll('.tag.extra').forEach(function(el){ el.style.display = open ? 'none' : 'inline-flex'; });
      btn.setAttribute('data-open', open ? '0' : '1');
      btn.textContent = open ? 'Ver todos' : 'Ver menos';
    });
  }

  function showErr(msg){
    var el=$('err');
    el.style.display='block';
    el.textContent = msg;
  }

  function filter(q){
    var nq = norm(q);
    if(!nq){
      // ✅ sin límite de 60
      return state.items;
    }
    return state.items.filter(function(it){
      var hay = [
        it.n,
        it.raw_title,
        it.title_display,
        it.title,
        it.date_raw,
        it.date,
        it.metrics,
        it.vuelta,
        (it.tags||[]).join(' ')
      ].join(' ');
      return norm(hay).indexOf(nq) !== -1;
    });
  }

  function render(list){
    $('count').innerHTML = '<strong>' + list.length + '</strong><span class="dim"> / ' + state.items.length + '</span>';
    var grid = $('grid');
    grid.innerHTML = '';
    if(!list.length){
      grid.innerHTML = '<div class="card"><div class="small">Sin resultados. Probá otra palabra o un #tag.</div></div>';
      return;
    }
    list.forEach(function(it){
      var yt = it.youtube_url || youtubeFallback(it.n);
      var tr = it.transcripcion_url || '';

      var meta = [];
      if(it.date_raw) meta.push('<span class="pill meta-pill has-ico">' + icon('calendar') + '<span>' + esc(it.date_raw) + '</span></span>');
      if(it.metrics) meta.push('<span class="pill meta-pill metrics has-ico">' + icon('gear') + '<span>' + esc(it.metrics) + '</span></span>');
      if(it.vuelta) meta.push('<span class="pill meta-pill has-ico">' + icon('compass') + '<span>' + esc(it.vuelta) + '</span></span>');
      meta.push('<span class="pill meta-pill">#' + it.n + '</span>');

      var allTags = (it.tags||[]);
var LIMIT = 12;
var tags = '';
if(allTags.length){
  var shown = allTags.slice(0, LIMIT);
  var rest = allTags.slice(LIMIT);
  tags = shown.map(function(t){ return '<span class="tag">' + esc(t) + '</span>'; }).join('');
  if(rest.length){
    tags += rest.map(function(t){ return '<span class="tag extra">' + esc(t) + '</span>'; }).join('');
    tags += '<button class="tagToggle" type="button" data-open="0">Ver todos</button>';
  }
}

      var actions = [];
      actions.push('<a class="btn ok" href="' + esc(yt) + '" target="_blank" rel="noopener">▶︎ YouTube</a>');

      if(tr){
        actions.push('<a class="btn has-ico" href="' + esc(tr) + '" target="_blank" rel="noopener">' + icon('note') + '<span>Transcripción</span></a>');
      }else{
        actions.push('<a class="btn disabled has-ico" href="#" aria-disabled="true">' + icon('note') + '<span>Transcripción (no disponible)</span></a>');
      }

      // ✅ PDF removido (no se renderiza botón)

      var card = document.createElement('div');
      card.className='card';
      card.innerHTML =
        '<div class="head">' +
          '<div class="hleft">' +
            '<div><a href="' + esc(yt) + '" target="_blank" rel="noopener"><b>' + esc(it.title_display || it.title) + '</b></a></div>' +
            '<div class="meta">' + meta.join('') + '</div>' +
          '</div>' +
          '<div class="actions">' + actions.join('') + '</div>' +
        '</div>' +
        (tags? '<div class="tags">' + tags + '</div>' : '');
      grid.appendChild(card);
    });
  }

  loadData();
})();