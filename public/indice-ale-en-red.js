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

  var state = { data:null, items:[], view:[], pdf_url:'' };

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
    state.items = (state.data.items || []).map(function(it){
      return {
        n: it.n,
        raw_title: it.title || '',
        title_display: 'Alejandra Casado EN RED (' + it.n + ')',
        title: it.title || ('Alejandra Casado en Red ' + it.n),
        date_raw: it.date_raw || '',
        date: it.date || '',
        metrics: it.metrics || '',
        vuelta: it.vuelta || '',
        tags: Array.isArray(it.tags)? it.tags : [],
        youtube_url: it.youtube_url || '',
        transcripcion_url: it.transcripcion_url || '',
        pdf_page: it.pdf_page || null
      };
    });
    state.pdf_url = (state.data.pdf_url || '').trim();

    // init UI
    var qEl = $('q'); var countEl=$('count');
    qEl.value = parseQuery();

    qEl.addEventListener('input', function(){ render(filter(qEl.value)); });
    qEl.addEventListener('keydown', function(ev){ if(ev.key==='Escape'){ qEl.value=''; render(filter('')); } });

    render(filter(qEl.value));
  }

  function showErr(msg){
    var el=$('err');
    el.style.display='block';
    el.textContent = msg;
  }

  function filter(q){
    var nq = norm(q);
    if(!nq){
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

  function pdfLink(it){
    if(!state.pdf_url) return '';
    if(it.pdf_page) return state.pdf_url + '#page=' + encodeURIComponent(it.pdf_page);
    return state.pdf_url;
  }

  function render(list){
    $('count').textContent = list.length + ' / ' + state.items.length;
    var grid = $('grid');
    grid.innerHTML = '';
    if(!list.length){
      grid.innerHTML = '<div class="card"><div class="small">Sin resultados. Probá otra palabra o un #tag.</div></div>';
      return;
    }
    list.forEach(function(it){
      var yt = it.youtube_url || youtubeFallback(it.n);
      var tr = it.transcripcion_url || '';
      var pdf = pdfLink(it);

      var meta = [];
      if(it.date_raw) meta.push('<span class="pill">📅 ' + esc(it.date_raw) + '</span>');
      if(it.metrics) meta.push('<span class="pill">⚙️ ' + esc(it.metrics) + '</span>');
      if(it.vuelta) meta.push('<span class="pill">🧭 ' + esc(it.vuelta) + '</span>');
      meta.push('<span class="pill">#' + it.n + '</span>');

      var tags = (it.tags||[]).map(function(t){ return '<span class="tag">' + esc(t) + '</span>'; }).join('');

      var actions = [];
      actions.push('<a class="btn ok" href="' + esc(yt) + '" target="_blank" rel="noopener">▶︎ YouTube</a>');
      actions.push('<a class="btn" href="' + esc(tr || '#') + '" target="_blank" rel="noopener" ' + (tr? '' : 'aria-disabled="true" class="btn disabled"') + '>' + (tr? '📝 Transcripción' : '📝 Transcripción (no disponible)') + '</a>');
      actions.push('<a class="btn warn ' + (pdf? '' : 'disabled') + '" href="' + esc(pdf || '#') + '" target="_blank" rel="noopener">📄 Abrir PDF</a>');

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