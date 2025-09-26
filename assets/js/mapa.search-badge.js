// Calendaria · Patch: mostrar código ITU en el buscador + Enter para ir
(function(){
  // Espera que el script principal haya definido window.MapaCodigos y cargado phoneByN3/index
  function ready(fn){ if (document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    // 1) Inserta un badge al lado del input #search (si no existe)
    var search = document.getElementById('search');
    if (!search) return;
    if (!document.getElementById('search-code-badge')) {
      var wrap = search.parentElement;
      // Si el input no está dentro de un contenedor, crear uno
      if (!wrap.classList.contains('search-row')) {
        var row = document.createElement('div');
        row.className = 'search-row';
        wrap.insertBefore(row, search);
        row.appendChild(search);
        var badge = document.createElement('div');
        badge.id = 'search-code-badge';
        badge.textContent = '—';
        row.appendChild(badge);
      } else {
        var badge = document.createElement('div');
        badge.id = 'search-code-badge';
        badge.textContent = '—';
        wrap.appendChild(badge);
      }
    }
    var badgeEl = document.getElementById('search-code-badge');

    // 2) Fuente de datos: usar el índice y mapping del script principal si están
    function getPhoneByName(q){
      try{
        var list = (window.MapaCodigos && window.MapaCodigos._idx) || [];
        var phoneMap = (window.MapaCodigos && window.MapaCodigos._phoneByN3) || {};
        if (!q) return {name:'', n3:'', phone:''};
        q = q.trim().toLowerCase();
        // prioridad 1: match exacto por nombre
        var exact = list.find(x => (x.name||'').toLowerCase() === q);
        if (exact && phoneMap[exact.n3]) return {name: exact.name, n3: exact.n3, phone: phoneMap[exact.n3]};
        // prioridad 2: empieza con
        var starts = list.find(x => (x.name||'').toLowerCase().startsWith(q));
        if (starts && phoneMap[starts.n3]) return {name: starts.name, n3: starts.n3, phone: phoneMap[starts.n3]};
        // prioridad 3: incluye
        var incl = list.find(x => (x.name||'').toLowerCase().includes(q));
        if (incl && phoneMap[incl.n3]) return {name: incl.name, n3: incl.n3, phone: phoneMap[incl.n3]};
        return {name:'', n3:'', phone:''};
      }catch(e){ return {name:'', n3:'', phone:''}; }
    }

    function updateBadge(){
      var val = search.value;
      var res = getPhoneByName(val);
      badgeEl.textContent = res.phone || '—';
      badgeEl.title = res.name ? (res.name + ' · ' + (res.phone||'')) : 'Código UIT';
      // guardar última coincidencia para Enter
      badgeEl.dataset.n3 = res.n3 || '';
    }

    search.addEventListener('input', updateBadge);
    updateBadge();

    // 3) Enter para ir al primer match
    search.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter') {
        var n3 = badgeEl.dataset.n3 || '';
        if (n3 && window.MapaCodigos && typeof window.MapaCodigos.zoomToN3 === 'function') {
          ev.preventDefault();
          window.MapaCodigos.zoomToN3(n3);
        }
      }
    });

    // 4) Enlazar estructuras internas desde el script principal si aún no se expusieron
    //    (pequeño hook que corre cuando el mapa termina de cargar países)
    var hooked = false;
    var hookTimer = setInterval(function(){
      if (hooked) { clearInterval(hookTimer); return; }
      if (window._CalendariaInternals) {
        if (window._CalendariaInternals.idx && window._CalendariaInternals.phoneByN3) {
          if (!window.MapaCodigos) window.MapaCodigos = {};
          window.MapaCodigos._idx = window._CalendariaInternals.idx;
          window.MapaCodigos._phoneByN3 = window._CalendariaInternals.phoneByN3;
          if (typeof window._CalendariaInternals.exposeZoom === 'function') {
            window.MapaCodigos.zoomToN3 = window._CalendariaInternals.exposeZoom();
          }
          hooked = true;
          updateBadge();
        }
      }
    }, 200);
  });
})();