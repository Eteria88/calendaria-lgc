(function(){
  var dbg = document.getElementById('rdbg');
  function status(msg, ok){
    if(dbg){
      dbg.style.display = 'block';
      dbg.textContent = msg;
      dbg.style.color = ok ? '#9cffd5' : '#ff9aa2';
    }
  }

  function $(id){ return document.getElementById(id); }
  function setText(id, txt){ var el=$(id); if(el) el.textContent = txt; }

  // Menú lateral: oculto por defecto, se abre con el botón ☰
  (function initMenu(){
    var btn = $('menuBtn');
    var sidenav = document.querySelector('.sidenav');
    var backdrop = $('backdrop');
    if(!btn || !sidenav || !backdrop) return;

    function closeMenu(){
      sidenav.classList.remove('open');
      backdrop.classList.remove('show');
      btn.setAttribute('aria-expanded','false');
    }
    function openMenu(){
      sidenav.classList.add('open');
      backdrop.classList.add('show');
      btn.setAttribute('aria-expanded','true');
    }

    btn.addEventListener('click', function(){
      if(sidenav.classList.contains('open')) closeMenu();
      else openMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMenu();
    });
  })();


  try{
    status('estado: JS cargado', true);

    // --- Calendario mixto (Juliano antes de 1582-10-15, Gregoriano desde ahí) ---
    function isGreg(y,m,d){ return (y>1582)||(y===1582&&(m>10||(m===10&&d>=15))); }
    function jdnG(y,m,d){
      var a=Math.floor((14-m)/12);
      var Y=y+4800-a;
      var M=m+12*a-3;
      return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-Math.floor(Y/100)+Math.floor(Y/400)-32045;
    }
    function jdnJ(y,m,d){
      var a=Math.floor((14-m)/12);
      var Y=y+4800-a;
      var M=m+12*a-3;
      return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-32083;
    }
    function jdnMixed(Y,M,D){ return isGreg(Y,M,D) ? jdnG(Y,M,D) : jdnJ(Y,M,D); }

    function flex(str){
      if(!str) return null;
      var s=String(str).trim().replace(/\//g,'-');
      var p=s.split('-'); if(p.length!==3) return null;

      // Detecta año por tener 4+ dígitos
      var idxY=-1;
      for(var i=0;i<3;i++){
        if(/^\d{4,6}$/.test(p[i])){ idxY=i; break; }
      }
      var y,m,d;
      if(idxY>=0){
        y=parseInt(p[idxY],10);
        var r=[];
        for(i=0;i<3;i++){ if(i!==idxY) r.push(parseInt(p[i],10)); }
        if(r.length!==2||isNaN(r[0])||isNaN(r[1])) return null;
        if(idxY===0){ m=r[0]; d=r[1]; } else { d=r[0]; m=r[1]; }
      }else{
        y=parseInt(p[0],10); m=parseInt(p[1],10); d=parseInt(p[2],10);
      }
      if(!(y>=1&&y<=275760&&m>=1&&m<=12&&d>=1&&d<=31)) return null;
      return {y:y,m:m,d:d};
    }

    function calcRange(startId, endId){
      var sI = $(startId) ? $(startId).value : '';
      var eI = $(endId) ? $(endId).value : '';
      var S = flex(sI), E = flex(eI);
      if(!(S && E)) return null;

      var baseA = jdnMixed(S.y,S.m,S.d);
      var baseB = jdnMixed(E.y,E.m,E.d);
      return baseB - baseA; // EXCLUSIVO
    }

    function render(){
      var exA = calcRange('startA','endA');
      var exB = calcRange('startB','endB');

      // Salidas por rango
      if(exA === null){
        setText('outA','—'); setText('yearsOutA','—'); setText('resA','—');
      }else{
        setText('outA', String(exA));
        setText('resA', String(exA));
        setText('yearsOutA', String(Math.floor(exA / 365.2425)));
      }

      if(exB === null){
        setText('outB','—'); setText('yearsOutB','—'); setText('resB','—');
      }else{
        setText('outB', String(exB));
        setText('resB', String(exB));
        setText('yearsOutB', String(Math.floor(exB / 365.2425)));
      }

      // Potenciales / Constante (solo cuando hay ambos)
      if(exA === null || exB === null){
        setText('potOut','—');
        setText('constOut','—');
        status('ok (faltan fechas)', true);
        return;
      }

      var potenciales = exA + exB;
      var constante = exA - exB;

      setText('potOut', String(potenciales));
      setText('constOut', String(constante));

      status('ok', true);
    }

    function clearAll(){
      ['startA','endA','startB','endB'].forEach(function(id){
        var el = $(id); if(el) el.value = '';
      });
      render();
      status('ok (limpio)', true);
    }

    function bind(){
      ['startA','endA','startB','endB'].forEach(function(id){
        var el = $(id);
        if(el){
          el.addEventListener('change', render);
          el.addEventListener('input', render);
        }
      });
      var btn = $('clearAll');
      if(btn){ btn.addEventListener('click', clearAll); }
    }

    bind();
    document.addEventListener('DOMContentLoaded', function(){ bind(); render(); }, {once:true});
    setTimeout(function(){ bind(); }, 250);

  }catch(e){
    status('error init: ' + e.message, false);
  }
})();