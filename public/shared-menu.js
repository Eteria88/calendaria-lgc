(function(){
  if (window.__calSharedMenuLoaded) return;
  window.__calSharedMenuLoaded = true;

  var config = window.CAL_MENU_CONFIG || {};
  var current = config.current || '';
  var items = [
    { key:'inicio', label:'Inicio', href:'/' },
    { key:'aparatos', label:'Aparatos', href:'/aparatos.html' },
    { key:'matriz', label:'Matriz Psíquica', href:'/matriz-psiquica.html' },
    { key:'mapa', label:'Mapa y códigos', href:'/mapa/' },
    { key:'marcas', label:'Marcas LGC', href:'/marcas-lgc.html' },
    { key:'comparador', label:'Comparador LGC', href:'/range.html' },
    { key:'letras', label:'Letras a números', href:'/letters.html' },
    { key:'instruccion', label:'Instrucción', href:'/indice-ale-en-red.html' }
  ];
  var supportItems = [
    { key:'apoyar', label:'Apoyar el proyecto', href:'/apoyar.html' }
  ];

  function linkHtml(item, mobile){
    var cls = mobile ? 'mnav-link' : 'nav-link';
    if (item.key === current) cls += ' active';
    return '<a class="'+cls+'" href="'+item.href+'">'+item.label+'</a>';
  }

  function mobileHtml(){
    return ''+
      '<div class="mobileNav" id="mobileNav" aria-hidden="true">' +
      '  <div class="mobileNavPanel" role="dialog" aria-modal="true" aria-label="Menú">' +
      '    <div class="mobileNavHeader">' +
      '      <span>Menú</span>' +
      '      <button class="closeBtn" id="menuCloseBtn" type="button" aria-label="Cerrar menú" title="Cerrar">×</button>' +
      '    </div>' +
      '    <nav class="mobileList">' +
      '      <div class="mnav-group">' + items.map(function(i){ return linkHtml(i, true); }).join('') + '</div>' +
      '      <div class="mnav-group mnav-support">' + supportItems.map(function(i){ return linkHtml(i, true); }).join('') + '</div>' +
      '    </nav>' +
      '  </div>' +
      '  <div class="mobileOverlay" id="mobileOverlay" tabindex="-1"></div>' +
      '</div>';
  }

  function desktopHtml(){
    return ''+
      '<nav>' +
      '  <div class="nav-title">Menú</div>' +
      '  <div class="nav-group">' + items.map(function(i){ return linkHtml(i, false); }).join('') + '</div>' +
      '  <div class="nav-group nav-support">' + supportItems.map(function(i){ return linkHtml(i, false); }).join('') + '</div>' +
      '</nav>';
  }

  var mobileHost = document.querySelector('[data-cal-menu="mobile"]');
  if (mobileHost) mobileHost.outerHTML = mobileHtml();

  var desktopHost = document.querySelector('[data-cal-menu="desktop"]');
  if (desktopHost) desktopHost.innerHTML = desktopHtml();

  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('mobileNav');
  var overlay = document.getElementById('mobileOverlay');
  var closeBtn = document.getElementById('menuCloseBtn');
  if (!btn || !nav) return;

  function setOpen(open){
    nav.classList.toggle('open', open);
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('noScroll', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function(e){
    e.preventDefault();
    setOpen(true);
  });

  if (overlay) overlay.addEventListener('click', function(){ setOpen(false); });
  if (closeBtn) closeBtn.addEventListener('click', function(){ setOpen(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setOpen(false); });
  nav.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) setOpen(false);
  });
})();
