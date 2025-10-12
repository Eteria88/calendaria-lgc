(function(){
  function $(id){ return document.getElementById(id); }
  function openNav(){ var m=$('mobileNav'); if(m){ m.classList.add('open'); m.setAttribute('aria-hidden','false'); document.body.classList.add('noScroll'); } }
  function closeNav(){ var m=$('mobileNav'); if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); document.body.classList.remove('noScroll'); } }
  function bind(){
    var b=$('menuBtn'); if(b){ b.addEventListener('click', openNav); }
    var c=$('closeMenu'); if(c){ c.addEventListener('click', closeNav); }
    var o=$('mobileOverlay'); if(o){ o.addEventListener('click', closeNav); }
    // Cerrar al navegar
    document.querySelectorAll('.mnav-link').forEach(function(a){ a.addEventListener('click', closeNav); });
    // Cerrar con Esc
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeNav(); } });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bind, {once:true}); } else { bind(); }
})();

/* ===== Calendaria compute API (for range chips) ===== */
(function(){
  // Helper: try a chain of accessors until one returns a non-null/undefined value
  function pick() {
    for (var i=0;i<arguments.length;i++) {
      var fn = arguments[i];
      try {
        var v = (typeof fn === 'function') ? fn() : undefined;
        if (v !== undefined && v !== null) return v;
      } catch(e){ /* ignore and continue */ }
    }
    return undefined;
  }
  // Normalize labels
  function normCard(x){ return x || '—'; }
  function normStep(x){ return x || '—'; }
  function normMem(x){ return x || '—'; }
  function normInt(x){ return (x===0 || x) ? x : '—'; }

  // Expose global
  window.CAL = window.CAL || {};
  /**
   * @param {Date} date  (UTC-normalizada por range)
   * @returns {{card:string, step:string, mem:string, turnNum:number, turnDay:number}}
   */
  window.CAL.compute = function(date){
    // Intentar distintas convenciones que puedas tener en tu codebase
    var card = pick(
      function(){ return (window.CAL_CORE && window.CAL_CORE.getCardinalidad && window.CAL_CORE.getCardinalidad(date)); },
      function(){ return (window.Calendaria && window.Calendaria.cardinalidad && window.Calendaria.cardinalidad(date)); },
      function(){ return (window.getCardinalidad && window.getCardinalidad(date)); }
    );
    var step = pick(
      function(){ return (window.CAL_CORE && window.CAL_CORE.getPaso && window.CAL_CORE.getPaso(date)); },
      function(){ return (window.Calendaria && window.Calendaria.paso && window.Calendaria.paso(date)); },
      function(){ return (window.getPaso && window.getPaso(date)); }
    );
    var mem = pick(
      function(){ return (window.CAL_CORE && window.CAL_CORE.getMemoria && window.CAL_CORE.getMemoria(date)); },
      function(){ return (window.Calendaria && window.Calendaria.memoria && window.Calendaria.memoria(date)); },
      function(){ return (window.getMemoria && window.getMemoria(date)); }
    );
    var turnNum = pick(
      function(){ return (window.CAL_CORE && window.CAL_CORE.getVueltaNumero && window.CAL_CORE.getVueltaNumero(date)); },
      function(){ return (window.Calendaria && window.Calendaria.vuelta && window.Calendaria.vuelta(date)); },
      function(){ return (window.getVueltaNumero && window.getVueltaNumero(date)); }
    );
    var turnDay = pick(
      function(){ return (window.CAL_CORE && window.CAL_CORE.getDiaEnVuelta && window.CAL_CORE.getDiaEnVuelta(date)); },
      function(){ return (window.Calendaria && window.Calendaria.diaEnVuelta && window.Calendaria.diaEnVuelta(date)); },
      function(){ return (window.getDiaEnVuelta && window.getDiaEnVuelta(date)); }
    );
    return {
      card: normCard(card),
      step: normStep(step),
      mem:  normMem(mem),
      turnNum: normInt(turnNum),
      turnDay: normInt(turnDay)
    };
  };
})();
