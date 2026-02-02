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

    
    // Inverso de JDN -> fecha (para mostrar cronogramas)
    var JDN_GREG_START = jdnG(1582,10,15); // 1582-10-15
    function ymdFromJdnG(j){
      var l = j + 68569;
      var n = Math.floor(4*l/146097);
      l = l - Math.floor((146097*n + 3)/4);
      var i = Math.floor(4000*(l + 1)/1461001);
      l = l - Math.floor(1461*i/4) + 31;
      var j2 = Math.floor(80*l/2447);
      var d = l - Math.floor(2447*j2/80);
      l = Math.floor(j2/11);
      var m = j2 + 2 - 12*l;
      var y = 100*(n - 49) + i + l;
      return {y:y, m:m, d:d};
    }
    function ymdFromJdnJ(j){
      var c = j + 32082;
      var d = Math.floor((4*c + 3)/1461);
      var e = c - Math.floor(1461*d/4);
      var m = Math.floor((5*e + 2)/153);
      var day = e - Math.floor((153*m + 2)/5) + 1;
      var month = m + 3 - 12*Math.floor(m/10);
      var year = d - 4800 + Math.floor(m/10);
      return {y:year, m:month, d:day};
    }
    function ymdFromJdnMixed(j){
      return (j >= JDN_GREG_START) ? ymdFromJdnG(j) : ymdFromJdnJ(j);
    }
    function fmtDMY(ymd){
      return ymd.d + '/' + ymd.m + '/' + ymd.y;
    }
    function fmtInput(ymd){
      if(!ymd) return '';
      var d = String(ymd.d).padStart(2,'0');
      var m = String(ymd.m).padStart(2,'0');
      var y = String(ymd.y).padStart(4,'0');
      return d + '/' + m + '/' + y;
    }
    function setTodayTo(id){
      var el = $(id);
      if(!el) return;
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth()+1).padStart(2,'0');
      var d = String(now.getDate()).padStart(2,'0');
      // Si es input nativo (type=date) usa ISO YYYY-MM-DD, si no usa D/M/Y
      if(String(el.type).toLowerCase() === 'date'){
        el.value = y + '-' + m + '-' + d;
      }else{
        el.value = d + '/' + m + '/' + y;
      }
    }


function flex(str){
      if(!str) return null;
      var s = String(str).trim();

      // Quita espacios (incluye espacios invisibles)
      s = s.replace(/\s+/g,'');

      // Normaliza separadores: / . · espacios -> -
      s = s.replace(/[\.\/·\s]+/g,'-').replace(/[^0-9\-]/g,'-');

      // Partes numéricas
      var parts = s.match(/\d+/g);
      if(!parts || parts.length !== 3) return null;

      var a = parts.map(function(x){ return parseInt(x,10); });
      if(a.some(function(n){ return isNaN(n); })) return null;

      var y, m, d;

      // 1) ISO YYYY-MM-DD (típico de <input type="date">)
      if(parts[0].length === 4){
        y = a[0]; m = a[1]; d = a[2];
      }else{
        // 2) Si alguna parte tiene 4+ dígitos => año
        var idxY = -1;
        for(var i=0;i<3;i++){
          if(parts[i].length >= 4){ idxY = i; break; }
        }
        // 3) Si no, la parte > 31 => año (ej: 491)
        if(idxY < 0){
          for(i=0;i<3;i++){
            if(a[i] > 31){ idxY = i; break; }
          }
        }

        if(idxY >= 0){
          y = a[idxY];
          var r = [];
          for(i=0;i<3;i++){ if(i!==idxY) r.push(a[i]); }
          if(r.length !== 2) return null;

          if(idxY === 0){
            // Y-M-D
            m = r[0]; d = r[1];
          }else{
            // Convención de la app: si el año no es primero => D-M-Y
            d = r[0]; m = r[1];
          }
        }else{
          // 4) Caso ultra-ambiguo (ej: 1/1/1): asumimos D-M-Y
          d = a[0]; m = a[1]; y = a[2];
        }
      }

      if(!(y>=1 && y<=275760 && m>=1 && m<=12 && d>=1 && d<=31)) return null;
      return {y:y,m:m,d:d};
    }

    function calcRange(startId, endId){
      var sI = $(startId) ? $(startId).value : '';
      var eI = $(endId) ? $(endId).value : '';
      var S = flex(sI), E = flex(eI);
      if(!(S && E)) return null;

      var baseA = jdnMixed(S.y,S.m,S.d);
      var baseB = jdnMixed(E.y,E.m,E.d);
      var diff = baseB - baseA;
      // INCLUSIVO: cuenta ambos extremos (si es el mismo día => 1)
      return (diff >= 0) ? (diff + 1) : (diff - 1);
    }



function bandaEtaria(dias){
  var bandas = [
    { n: 1, desde: 0,     hasta: 5777,  nextStart: 5778 },
    { n: 2, desde: 5778,  hasta: 11554, nextStart: 11555 },
    { n: 3, desde: 11555, hasta: 17331, nextStart: 17332 },
    { n: 4, desde: 17332, hasta: 23108, nextStart: 23109 },
    { n: 5, desde: 23109, hasta: 28885, nextStart: 28886 }
  ];
  for(var i=0;i<bandas.length;i++){
    var b = bandas[i];
    if(dias >= b.desde && dias <= b.hasta) return { ok:true, b:b };
  }
  return { ok:false, msg:'Fuera de rango (0–40439).' };
}

function calcBandas(){
  var birthEl = $('birth');
  var refEl = $('ref');
  if(!birthEl || !refEl){
    return { ok:false, msg:'Campos no encontrados.' };
  }

  var B = flex(birthEl.value);
  if(!B) return { ok:false, msg:'Falta fecha de nacimiento.' };

  var R = flex(refEl.value);
  if(!R) return { ok:false, msg:'Falta fecha de referencia.' };

  var jBirth = jdnMixed(B.y,B.m,B.d);
  var jRef = jdnMixed(R.y,R.m,R.d);
  var dias = (jRef - jBirth); // EXCLUSIVO. Día 0 = mismo día.

  if(dias < 0) return { ok:false, msg:'Referencia < Nacimiento.' };

  var found = bandaEtaria(dias);
  if(!found.ok) return { ok:false, msg: found.msg, dias:dias };

  var b = found.b;
  var faltan = (b.hasta - dias);
  var recorridas = Math.max(0, b.n - 1); // bandas completas

  return {
    ok:true,
    dias:dias,
    banda: b.n,
    desde: b.desde,
    hasta: b.hasta,
    faltan: faltan,
    recorridas: recorridas
  };
}

function renderBandSchedule(){
  var wrap = $('bandScheduleWrap');
  var body = $('bandScheduleBody');
  var hint = $('bandScheduleHint');
  var birthEl = $('birth');
  if(!wrap || !body || !birthEl) return;

  var B = flex(birthEl.value);
  if(!B){
    wrap.style.display = 'none';
    body.innerHTML = '';
    if(hint) hint.textContent = 'Ingresá una fecha de nacimiento para ver el rango de fechas de cada banda.';
    return;
  }

  var jBirth = jdnMixed(B.y,B.m,B.d);
  if(hint) hint.textContent = 'Nacimiento: ' + (B.d + '/' + B.m + '/' + B.y);

  // Resaltar banda actual según fecha de referencia (si existe y es válida)
  var refEl = $('ref');
  var daysLife = null;
  if(refEl){
    var R = flex(refEl.value);
    if(R){
      daysLife = jdnMixed(R.y,R.m,R.d) - jBirth; // exclusivo
    }
  }

  var bands = [
    {name:'Primera',  desde:0,     hasta:5777},
    {name:'Segunda',  desde:5778,  hasta:11554},
    {name:'Tercera',  desde:11555, hasta:17331},
    {name:'Cuarta',   desde:17332, hasta:23108},
    {name:'Quinta',   desde:23109, hasta:28885},
    {name:'Sexta',    desde:28886, hasta:34662},
    {name:'Séptima',  desde:34663, hasta:40439}
  ];

  var rows = '';
  for(var i=0;i<bands.length;i++){
    var b = bands[i];
    var from = ymdFromJdnMixed(jBirth + b.desde);
    var to = ymdFromJdnMixed(jBirth + b.hasta);
    var hi = (daysLife !== null && daysLife >= b.desde && daysLife <= b.hasta) ? ' class="hi"' : '';
    rows += '<tr'+hi+'>'
      + '<td>'+b.name+'</td>'
      + '<td>'+b.desde+'–'+b.hasta+'</td>'
      + '<td>'+fmtDMY(from)+'</td>'
      + '<td>'+fmtDMY(to)+'</td>'
      + '</tr>';
  }

  body.innerHTML = rows;
  wrap.style.display = 'block';
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
}else{
  var potenciales = exA + exB;
  var constante = exA - exB;
  setText('potOut', String(potenciales));
  setText('constOut', String(constante));
}




// --- Bandas etarias ---
var band = calcBandas();
if(!band.ok){
  // Si faltan fechas, no mostramos nada; si hay error real, lo mostramos en "Frecuencias de la banda etaria"
  if(String(band.msg||'').indexOf('Falta') === 0){
    setText('bandOut','—'); setText('bandLeft','—'); setText('bandDone','—');
  }else{
    setText('bandOut','—'); setText('bandDone','—');
    setText('bandLeft', band.msg || '—');
  }
}else{
  setText('bandOut', band.banda + 'ª (' + band.desde + '–' + band.hasta + ')');

  // Frecuencias de la banda etaria: +transcurridos | -faltan
  // Transcurridos: incluye el día actual (primer día de banda = 1)
  // Faltan: días restantes después de hoy (último día de banda = 0)
  var trans = (band.dias - band.desde) + 1;
  var left = Math.max(0, band.hasta - band.dias);
  setText('bandLeft', '+' + String(trans) + ' | -' + String(left));
setText('bandDone', String(band.recorridas) + ' (completas)');
}

// Cronograma informativo de bandas (independiente)
renderBandSchedule();

      status('ok', true);
    }

    function clearAll(){
      ['startA','endA','startB','endB','birth','ref'].forEach(function(id){
        var el = $(id); if(el) el.value = '';
      });
      render();
      status('ok (limpio)', true);
    }

    
    // Sanitiza espacios en inputs de fecha (evita desajustes por espacios)
    function sanitizeDateInput(el){
      if(!el) return;
      var v = String(el.value || '');
      var nv = v.replace(/\s+/g,'');
      if(nv !== v) el.value = nv;
    }

function bind(){
      ['startA','endA','startB','endB','birth','ref'].forEach(function(id){
        var el = $(id);
        if(el){
          el.addEventListener('change', function(){ sanitizeDateInput(el); render(); });
          el.addEventListener('input', function(){ sanitizeDateInput(el); render(); });
          el.addEventListener('blur', function(){ sanitizeDateInput(el); render(); });
      // Botones "Hoy" (compat móvil + inputs texto)
      var map = [
        ['btnStartTodayA','startA'],
        ['btnEndTodayA','endA'],
        ['btnStartTodayB','startB'],
        ['btnEndTodayB','endB'],
        ['btnRefToday','ref']
      ];
      map.forEach(function(p){
        var b = $(p[0]);
        if(b){
          b.addEventListener('click', function(){
            setTodayTo(p[1]);
            render();
          });
        }
      });

        }
      });
      var btn = $('clearAll');
      if(btn){ btn.addEventListener('click', clearAll); }
    }

    bind();


(function initBandRefToday(){
  var refEl = $('ref');
  if(refEl && !refEl.value){
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    if(String(refEl.type).toLowerCase() === 'date'){
      refEl.value = y + '-' + m + '-' + day;
    }else{
      refEl.value = day + '/' + m + '/' + y;
    }
  }
})();
    document.addEventListener('DOMContentLoaded', function(){ bind(); render(); }, {once:true});
    setTimeout(function(){ bind(); }, 250);

  }catch(e){
    status('error init: ' + e.message, false);
  }
})();