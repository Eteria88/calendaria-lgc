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