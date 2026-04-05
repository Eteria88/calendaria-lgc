
(function(){
  const mount = document.getElementById('periodicGridMount');
  if (!mount || !window.PERIODIC_DATA || !window.PERIODIC_DATA.length) return;

  const CATEGORY_LABELS = {
    'alkali': 'Alcalino',
    'alkaline': 'Alcalinotérreo',
    'transition': 'Transición',
    'post-transition': 'Post-transición',
    'metalloid': 'Metaloide',
    'nonmetal': 'No metal',
    'halogen': 'Halógeno',
    'noble': 'Gas noble',
    'lanthanide': 'Lantánido',
    'actinide': 'Actínido',
    'unknown': 'Grupo'
  };

  function getActiveKey() {
    const bodyKey = (document.body.getAttribute('data-el') || '').trim().toUpperCase();
    if (bodyKey) return bodyKey;
    const m = /[?&]el=([^&]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().toUpperCase() : 'H';
  }

  const activeKey = getActiveKey();
  const data = window.PERIODIC_DATA.slice();
  const maxRow = Math.max.apply(null, data.map(d => d.row));
  const maxCol = Math.max.apply(null, data.map(d => d.col));

  const wrap = document.createElement('div');
  wrap.className = 'pgridWrap';

  const grid = document.createElement('div');
  grid.className = 'pgrid';
  grid.style.setProperty('--p-cols', String(maxCol));
  grid.style.setProperty('--p-rows', String(maxRow));

  data.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'p-el is-' + item.category + (item.key === activeKey ? ' is-active' : '');
    btn.style.gridColumn = String(item.col);
    btn.style.gridRow = String(item.row);
    btn.dataset.key = item.key;
    btn.title = item.symbol + ' · ' + item.atomic + ' · ' + item.name + ' · ' + (CATEGORY_LABELS[item.category] || 'Grupo');

    btn.innerHTML = ''
      + '<span class="p-el__atomic">' + item.atomic + '</span>'
      + '<span class="p-el__symbol">' + item.symbol + '</span>'
      + '<span class="p-el__name">' + item.name + '</span>';

    btn.addEventListener('click', function(){
      const url = new URL(window.location.href);
      url.searchParams.set('el', item.symbol);
      window.location.href = url.toString();
    });

    grid.appendChild(btn);
  });

  wrap.appendChild(grid);
  mount.innerHTML = '';
  mount.appendChild(wrap);

  const activeNode = grid.querySelector('.is-active');
  if (activeNode) {
    requestAnimationFrame(() => {
      activeNode.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    });
  }
})();
