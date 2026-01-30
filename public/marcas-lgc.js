(function(){
  function $(id){ return document.getElementById(id); }
  var ms = 86400000;

  function pad(n){ n=String(n); return n.length<2 ? ('0'+n) : n; }

  function dt(y,m,d){
    // UTC date without the 1900+ year quirk for years 1–99
    var base = new Date(Date.UTC(2000, m-1, d));
    base.setUTCFullYear(y);
    return base;
  }

  function isL(y){ return (y%4===0) && ((y%100)!==0 || y%400===0); }

  function dim(y,m){
    if(m===2) return isL(y)?29:28;
    if(m===4||m===6||m===9||m===11) return 30;
    return 31;
  }

  function flex(str){
    // Parser tolerante: dd-mm-aaaa / dd/mm/aaaa / dd mm aaaa, etc.
    if(!str) return null;
    var s = String(str).trim();
    // Sanitiza espacios para que no afecten el parseo
    s = s.replace(/\s+/g,'');
    var toks = s.match(/\d+/g);
    if(!toks || toks.length!==3) return null;

    var a = toks.map(function(x){ return parseInt(x,10); });
    if(a.some(function(x){ return !isFinite(x); })) return null;

    // Detectar año
    var idxY=-1, i;
    for(i=0;i<3;i++){ if(toks[i].length===4){ idxY=i; break; } }
    if(idxY<0){
      for(i=0;i<3;i++){ if(a[i]>31 || toks[i].length===3){ idxY=i; break; } }
    }
    if(idxY<0) idxY=2;

    var y=a[idxY];
    var b=[];
    for(i=0;i<3;i++){ if(i!==idxY) b.push(a[i]); }

    var d,m;
    if(idxY===0){ m=b[0]; d=b[1]; }        // yyyy-mm-dd
    else if(idxY===2){ d=b[0]; m=b[1]; }   // dd-mm-yyyy
    else{
      if(b[1]>=1 && b[1]<=12 && b[0]>=1 && b[0]<=31){ d=b[0]; m=b[1]; }
      else if(b[0]>=1 && b[0]<=12 && b[1]>=1 && b[1]<=31){ m=b[0]; d=b[1]; }
      else { d=b[0]; m=b[1]; }
    }

    if(!(y>=1 && y<=9999)) return null;
    if(!(m>=1 && m<=12)) return null;
    if(!(d>=1 && d<=dim(y,m))) return null;
    return {y:y,m:m,d:d};
  }

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

  function jdnCut(y,m,d){
    // Regla LGC: Juliano hasta 04/10/1582 inclusive; Gregoriano desde 15/10/1582.
    if(y>1582) return jdnG(y,m,d);
    if(y<1582) return jdnJ(y,m,d);
    if(m>10) return jdnG(y,m,d);
    if(m<10) return jdnJ(y,m,d);
    return (d>=15) ? jdnG(y,m,d) : jdnJ(y,m,d);
  }

  function parseISODateParts(iso){
    if(!iso) return null;
    var m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(iso));
    if(!m) return null;
    return {y:parseInt(m[1],10), m:parseInt(m[2],10), d:parseInt(m[3],10)};
  }

  function fmtSigned(n){
    if(!isFinite(n)) return '—';
    if(n===0) return '0';
    return n<0 ? ('−'+Math.abs(n)) : String(n);
  }

  
  function isMobileMode(){
    try{
      return window.matchMedia && window.matchMedia("(max-width: 520px)").matches;
    }catch(e){ return false; }
  }

  function toISO(p){
    return String(p.y).padStart(4,'0')+'-'+pad(p.m)+'-'+pad(p.d);
  }

  function fmtDMY(p){
    return pad(p.d)+'/'+pad(p.m)+'/'+String(p.y).padStart(4,'0');
  }

  function setRefInputsFromParts(p){
    var refI=$('ref');
    var refM=$('refMobile');
    var iso = toISO(p);
    if(refI){ refI.value = iso; }
    if(refM){ refM.value = fmtDMY(p); }
    // Dispara eventos para que el resto del sistema actualice
    try{
      if(refI){
        refI.dispatchEvent(new Event('input', {bubbles:true}));
        refI.dispatchEvent(new Event('change', {bubbles:true}));
      }
      if(refM){
        refM.dispatchEvent(new Event('input', {bubbles:true}));
        refM.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }catch(e){}
  }

  function setRefInputsFromUTCDate(d){
    var p={y:d.getUTCFullYear(), m:d.getUTCMonth()+1, d:d.getUTCDate()};
    setRefInputsFromParts(p);
  }


  
  function readRefParts(){
    var refI=$('ref');
    var refM=$('refMobile');
    var raw='';

    // En móvil, se toma el input visible dd/mm/aaaa
    if(isMobileMode() && refM && refM.value!=null){
      raw = String(refM.value||'').trim();
    }else if(refI && refI.value!=null){
      raw = String(refI.value||'').trim();
    }

    if(!raw){
      var now=new Date();
      return {y:now.getFullYear(), m:now.getMonth()+1, d:now.getDate()};
    }

    // dd/mm/aaaa o dd-mm-aaaa o yyyy-mm-dd, tolerante
    var p=flex(raw);
    if(p) return p;

    var isoP = parseISODateParts(raw);
    if(isoP) return isoP;

    var t=Date.parse(raw);
    if(!isNaN(t)){
      var tmp=new Date(t);
      return {y:tmp.getUTCFullYear(), m:tmp.getUTCMonth()+1, d:tmp.getUTCDate()};
    }

    var now2=new Date();
    return {y:now2.getFullYear(), m:now2.getMonth()+1, d:now2.getDate()};
  }


  function updateAnchors(refJDN){
    var grid = $('anchorsGrid');
    if(!grid) return;

    // Orden cronológico (más antiguo → más reciente)
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.a-card'));
    var items = cards.map(function(card){
      var valEl = card.querySelector('[data-date-iso]');
      var iso = valEl ? valEl.getAttribute('data-date-iso') : null;
      var p = parseISODateParts(iso);
      var j = p ? jdnCut(p.y, p.m, p.d) : Number.POSITIVE_INFINITY;
      return {card:card, valEl:valEl, parts:p, jdn:j};
    });
    items.sort(function(a,b){ return a.jdn - b.jdn; });
    items.forEach(function(it){ grid.appendChild(it.card); });

    // Conteo: pasado positivo, futuro negativo (evita -0)
    items.forEach(function(it){
      if(!it.valEl || !isFinite(it.jdn)) return;
      var diff = refJDN - it.jdn;
      if(diff===0) diff = 0;
      it.valEl.textContent = fmtSigned(diff);
      it.valEl.title = diff<0 ? ('Faltan '+Math.abs(diff)+' días') : '';
    });
  }

  function up(){

    var p=readRefParts();
    var refJDN = jdnCut(p.y,p.m,p.d);
    updateAnchors(refJDN);

    var lbl=$('refLabel');
    if(lbl){
      lbl.textContent = pad(p.d)+'-'+pad(p.m)+'-'+String(p.y).padStart(4,'0');
    }
    // Mantiene sincronizado el campo móvil visible (dd/mm/aaaa)
    var refM=$('refMobile');
    if(refM){ refM.value = pad(p.d)+'/'+pad(p.m)+'/'+String(p.y).padStart(4,'0'); }

  }

  document.addEventListener('DOMContentLoaded', function(){
    // Init: si está vacío, setea hoy
    var refI=$('ref');
    if(refI && !refI.value){
      var now=new Date();
      setRefInputsFromUTCDate(dt(now.getFullYear(), now.getMonth()+1, now.getDate()));
    }
    up();

    // Si viene con valor (por cache/navegador), sincroniza el input móvil
    var refMInit=$('refMobile');
    if(refI && refI.value && refMInit){
      var pInit = readRefParts();
      refMInit.value = fmtDMY(pInit);
    }



    function maskDMY(value){
      var digits = String(value||'').replace(/\D/g,'').slice(0,8); // ddmmyyyy
      var out = digits;
      if(digits.length>2) out = digits.slice(0,2) + '/' + digits.slice(2);
      if(digits.length>4) out = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4);
      return out;
    }

    function trySyncMobileToISO(){
      var refM=$('refMobile');
      var refI=$('ref');
      if(!refM || !refI) return;
      var v = String(refM.value||'').trim();
      var p = flex(v);
      if(!p) return;
      refI.value = toISO(p);
      try{
        refI.dispatchEvent(new Event('input', {bubbles:true}));
        refI.dispatchEvent(new Event('change', {bubbles:true}));
      }catch(e){}
    }

    function debounce(fn, wait){
      var t;
      return function(){
        var ctx=this, args=arguments;
        clearTimeout(t);
        t=setTimeout(function(){ fn.apply(ctx,args); }, wait);
      };
    }
    var upDebounced = debounce(up, 200);

    if(refI){
      refI.addEventListener('input', upDebounced);
      refI.addEventListener('change', up);
    }

    function shiftRefBy(deltaDays){
      var p=readRefParts();
      var base=dt(p.y,p.m,p.d);
      var moved=new Date(base.getTime()+deltaDays*ms);
      setRefInputsFromUTCDate(moved);
    }

    var btnToday=$('btnToday');
    if(btnToday){ btnToday.addEventListener('click', function(){
      var now=new Date();
      setRefInputsFromUTCDate(dt(now.getFullYear(), now.getMonth()+1, now.getDate()));
    });}
    var btnPrev=$('btnPrevDay');
    if(btnPrev){ btnPrev.addEventListener('click', function(){ shiftRefBy(-1); });}
    var btnNext=$('btnNextDay');
    if(btnNext){ btnNext.addEventListener('click', function(){ shiftRefBy(1); });}
  }, {once:true});
})();