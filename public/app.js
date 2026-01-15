(function(){
  var dbg=document.getElementById('dbg');
  function status(msg, ok){ if(dbg){ dbg.textContent=msg; dbg.style.color = ok ? '#9cffd5' : '#ff9aa2'; } }
  try{
    status('estado: JS cargado', true);
    function $(s){return document.querySelector(s);} 
    var ms=86400000;
    function dt(y,m,d){
      // Crea fechas en UTC sin el corrimiento 1900+ para años 1–99.
      // Importante: el "año base" debe ser bisiesto para que 29/02 no se normalice a 01/03.
      // Usamos 2000 (bisiesto) y luego seteamos el año real.
      var base = new Date(Date.UTC(2000, m-1, d));
      base.setUTCFullYear(y);
      return base;
    }
function fmtDate(d){
      var dd = String(d.getUTCDate()).padStart(2,'0');
      var mm = String(d.getUTCMonth()+1).padStart(2,'0');
      var yyyy = d.getUTCFullYear();
      return dd+'-'+mm+'-'+yyyy;
    }
    function isL(y){return (y%4===0)&&((y%100)!==0||y%400===0);}
    function yLen(y){return isL(y)?366:365;}
    function dOY(d){var y=d.getUTCFullYear();return Math.floor((d-dt(y,1,1))/ms)+1;}
    function addDays(d,n){return new Date(d.getTime()+n*ms);}
    function pad(n){n=String(n); return n.length<2?('0'+n):n;}

    function flex(str){
      // Parser flexible para fechas escritas por el usuario.
      // Soporta separadores: / - . · espacios (y cualquier no-dígito).
      // También soporta año de 1 a 4 dígitos (ej: 491, 0491, 2026).
      if(!str) return null;

      // Normalizar: todo lo que no sea dígito se vuelve separador
      var s = String(str).trim();
      if(!s) return null;
      s = s.replace(/[^0-9]+/g,'-').replace(/^-+|-+$/g,'');
      var p = s.split('-').filter(Boolean);
      if(p.length!==3) return null;

      var n0 = parseInt(p[0],10), n1 = parseInt(p[1],10), n2 = parseInt(p[2],10);
      if(isNaN(n0)||isNaN(n1)||isNaN(n2)) return null;

      var lens = [p[0].length, p[1].length, p[2].length];
      var nums = [n0,n1,n2];

      // Detectar índice de año:
      // 1) Preferir el token de 4 dígitos.
      // 2) Si no hay, usar el que sea > 31 (día/mes no superan 31).
      // 3) Si sigue ambiguo, asumir formato dd-mm-yy/yyy cuando los 2 primeros parecen día/mes.
      var idxY = -1;
      for(var i=0;i<3;i++){ if(lens[i]===4){ idxY=i; break; } }
      if(idxY<0){
        var cand = [];
        for(i=0;i<3;i++){ if(nums[i]>31) cand.push(i); }
        if(cand.length===1){
          idxY=cand[0];
        }else if(cand.length>1){
          // Probable yyyy-mm-dd si el primero es grande; si no, tomamos el último grande.
          idxY = (nums[0]>31 ? 0 : cand[cand.length-1]);
        }else{
          // Ninguno >31: si parece dd-mm-yy/yyy, tomamos el último como año.
          if(nums[0]>=1 && nums[0]<=31 && nums[1]>=1 && nums[1]<=12){
            idxY = 2;
          }else{
            // Fallback conservador
            idxY = 0;
          }
        }
      }

      var y,m,d;
      if(idxY===0){ y=nums[0]; m=nums[1]; d=nums[2]; }
      else if(idxY===2){ d=nums[0]; m=nums[1]; y=nums[2]; }
      else {
        // idxY===1 (raro): intentar inferir mm-YYYY-dd o dd-YYYY-mm
        y=nums[1];
        if(nums[0]>=1 && nums[0]<=12 && nums[2]>=1 && nums[2]<=31){ m=nums[0]; d=nums[2]; }
        else { d=nums[0]; m=nums[2]; }
      }

      if(!(y>=1&&y<=9999&&m>=1&&m<=12&&d>=1&&d<=31)) return null;
      return {y:y,m:m,d:d};
    }
    function jdnG(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-Math.floor(Y/100)+Math.floor(Y/400)-32045;}
    function jdnJ(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-32083;}

    function apIdx(y){return Math.floor((y-1)/4)+1;}
    function plane(card){
      var ks=['NE','NO','SE','SO']; for(var i=0;i<ks.length;i++){var el=$('#cell'+ks[i]); if(!el) continue; if(ks[i]===card) el.classList.add('active'); else el.classList.remove('active');}
    }
    
    function buildCalog(ref, futureYears){
      var tbl=$('#calog'); if(!tbl) return;
      var tbody=tbl.querySelector('tbody'); if(!tbody) return;

      futureYears = parseInt(futureYears||0,10) || 0;

      tbody.innerHTML='';

      // Rango base histórico del Calendario Lógico (según instrucción)
      var y0 = 2012;
      var baseEnd = 2028;               // hasta Aparato 507
      var yr = ref.getUTCFullYear();

      // Extensión a futuro controlada por slider (se suma desde 2028)
      var y1 = baseEnd + futureYears;

      // Si el usuario pone una referencia más allá del tope, siempre incluimos ese año
      if(yr > y1) y1 = yr;

      var LGC=dt(2015,10,15), INS=dt(2012,10,14), C={};

      // Constante (secuenciación anual)
      C[2012]=Math.floor((LGC-INS)/ms);
      C[2013]=Math.floor((dt(2016,1,1)-LGC)/ms);
      for(var y=2014;y<=y1;y++){
        C[y]=C[y-1]+yLen(y-1);
      }

      // Variable: distancia (en días) desde 01/01 del año hasta la fecha de referencia
      // Para años futuros queda en negativo (faltante), para años pasados en positivo (transcurrido).
      var V={}, d=dOY(ref);
      V[yr]=d;

      // Hacia el pasado
      for(y=yr-1;y>=2013 && y>=y0;y--){
        V[y]=V[y+1]+yLen(y);
      }

      // 2012: mantiene el offset que venías usando (no se ajusta con longitudes de año)
      if(yr>=2013 && y0<=2012 && V.hasOwnProperty(2013)){
        V[2012]=V[2013]-1018;
      }else if(yr===2012){
        V[2012]=d;
      }

      // Hacia el futuro (quedan negativos hasta que llegues a ese año)
      for(y=yr+1;y<=y1;y++){
        V[y]=V[y-1]-yLen(y-1);
      }

      var s=0;
      for(y=y1;y>=y0;y--){
        var tr=document.createElement('tr');
        if(y===yr) tr.classList.add('calog-current');

        var cells=[
          ''+y,
          (V.hasOwnProperty(y)?V[y]:''),
          (C[y]||0),
          apIdx(y)
        ];

        for(var i2=0;i2<cells.length;i2++){
          var td=document.createElement('td');
          td.textContent=cells[i2];
          tr.appendChild(td);
        }

        // Suma (solo años <= referencia, como venías haciendo)
        if(V.hasOwnProperty(y) && y<=yr) s+=V[y];

        tbody.appendChild(tr);
      }

      var sumEl=$('#calogSum'); if(sumEl) sumEl.textContent=s;
    }


    var init=false;
    function parseSearch(){
      var q=(location.search||''); if(q.indexOf('?')===0) q=q.slice(1);
      var o={}; var parts=q.split('&'); for(var i=0;i<parts.length;i++){ if(!parts[i]) continue; var kv=parts[i].split('='); o[decodeURIComponent(kv[0]||'')]=decodeURIComponent(kv[1]||''); }
      return o;
    }

    function up(){
      var now=new Date();
      var todayLocal=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      var tStr=pad(todayLocal.getDate())+'-'+pad(todayLocal.getMonth()+1)+'-'+String(todayLocal.getFullYear()).padStart(4,'0');
      var qp=parseSearch();

      var refI=$('#ref'), refT=$('#refText'), dobI=$('#dob'), dobT=$('#dobText');
      // Ajustes para móviles: usar inputs de texto para evitar problemas del control nativo de fecha
      // y permitir años como 0001 en Fecha de referencia y Fecha de nacimiento.
      try{
        var ua = navigator.userAgent || '';
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if(isMobile){
          if(refI && !refI._mobilePatched){
            refI.type = 'text';
            if(!refI.placeholder) refI.placeholder = 'dd-mm-aaaa';
            refI._mobilePatched = true;
          }
          if(dobI && !dobI._mobilePatched){
            dobI.type = 'text';
            if(!dobI.placeholder) dobI.placeholder = 'dd-mm-aaaa';
            dobI._mobilePatched = true;
          }
        }
      }catch(e){}

      if(!init){
        if(refI && !refI.value) refI.value = (qp.ref || tStr);
        if(dobI && !dobI.value){ if(qp.dob) dobI.value = qp.dob; }
        if(refT && !refT.value && qp.ref) refT.value = qp.ref;
        if(dobT && !dobT.value && qp.dob) dobT.value = qp.dob;
      }

      var rTxt=(refT && refT.value ? refT.value : '').trim() || '';
      var dTxt=(dobT && dobT.value ? dobT.value : '').trim() || '';
      var rFrom = rTxt || (refI && refI.value ? refI.value : tStr);
      var dFrom = dTxt || (dobI && dobI.value ? dobI.value : '');

      var Rf = flex(rFrom); if(!Rf){ var t = Date.parse(rFrom); if(!isNaN(t)){ var tmp=new Date(t); Rf={y:tmp.getUTCFullYear(), m:tmp.getUTCMonth()+1, d:tmp.getUTCDate()}; } else { var tl=todayLocal; Rf={y:tl.getUTCFullYear(), m:tl.getUTCMonth()+1, d:tl.getUTCDate()}; } }
      var Db = flex(dFrom); if(!Db){ var tdv = Date.parse(dFrom); if(!isNaN(tdv)){ var tmpd=new Date(tdv); Db={y:tmpd.getUTCFullYear(), m:tmpd.getUTCMonth()+1, d:tmpd.getUTCDate()}; } else { Db=null; } }

      var ref = dt(Rf.y, Rf.m, Rf.d);
      var dob = (Db?dt(Db.y, Db.m, Db.d):null);

      
      // Anillo de Fuego: días lógicos 353–365
      // Mapas gregorianos:
      // - Años no bisiestos:
      //     353 → 19/12
      //     354 → 20/12
      //     355 → 21/12
      //     356 → 22/12
      //     357 → 23/12
      //     358 → 24/12
      //     359 → 25/12
      //     360 → 26/12
      //     361 → 27/12
      //     362 → 28/12
      //     363 → 29/12
      //     364 → 30/12
      //     365 → 31/12
      // - Años bisiestos:
      //     353 → 18/12
      //     354 → 19/12
      //     355 → 20/12
      //     356 → 21/12
      //     357 → 22/12
      //     358 → 23/12
      //     359 → 24/12
      //     360 → 25/12
      //     361 → 26/12
      //     362 → 27/12
      //     363 → 28/12
      //     364 → 29/12
      //     365 → 30/12
      (function(){
        var cardPlane = document.getElementById('cardinalPlane');
        var anilloPlane = document.getElementById('anilloPlane');
        if(!cardPlane || !anilloPlane) return;

        var y = ref.getUTCFullYear();
        var m = ref.getUTCMonth() + 1;
        var d = ref.getUTCDate();
        var leap = isL(y);

        var showAnillo = false;
        var logicalDay = null;

        // Mapas gregorianos para el tramo 353–365 del Anillo de Fuego:
        if(m === 12){
          if(!leap){
            if(d === 19){ showAnillo = true; logicalDay = 353; }
            else if(d === 20){ showAnillo = true; logicalDay = 354; }
            else if(d === 21){ showAnillo = true; logicalDay = 355; }
            else if(d === 22){ showAnillo = true; logicalDay = 356; }
            else if(d === 23){ showAnillo = true; logicalDay = 357; }
            else if(d === 24){ showAnillo = true; logicalDay = 358; }
            else if(d === 25){ showAnillo = true; logicalDay = 359; }
            else if(d === 26){ showAnillo = true; logicalDay = 360; }
            else if(d === 27){ showAnillo = true; logicalDay = 361; }
            else if(d === 28){ showAnillo = true; logicalDay = 362; }
            else if(d === 29){ showAnillo = true; logicalDay = 363; }
            else if(d === 30){ showAnillo = true; logicalDay = 364; }
            else if(d === 31){ showAnillo = true; logicalDay = 365; }
          }else{
            if(d === 18){ showAnillo = true; logicalDay = 353; }
            else if(d === 19){ showAnillo = true; logicalDay = 354; }
            else if(d === 20){ showAnillo = true; logicalDay = 355; }
            else if(d === 21){ showAnillo = true; logicalDay = 356; }
            else if(d === 22){ showAnillo = true; logicalDay = 357; }
            else if(d === 23){ showAnillo = true; logicalDay = 358; }
            else if(d === 24){ showAnillo = true; logicalDay = 359; }
            else if(d === 25){ showAnillo = true; logicalDay = 360; }
            else if(d === 26){ showAnillo = true; logicalDay = 361; }
            else if(d === 27){ showAnillo = true; logicalDay = 362; }
            else if(d === 28){ showAnillo = true; logicalDay = 363; }
            else if(d === 29){ showAnillo = true; logicalDay = 364; }
            else if(d === 30){ showAnillo = true; logicalDay = 365; }
            else if(d === 31){ showAnillo = true; logicalDay = 366; }
          }
        }

        if(showAnillo){
          cardPlane.style.display = 'none';
          anilloPlane.style.display = '';

          // Ocultar elementos de vuelta detallada durante el Anillo de Fuego
          var calTurnRange = document.getElementById('calTurnRange');
          var turnProgressInner = document.getElementById('turnProgressInner');
          var turnDaySpan = document.getElementById('turnDay');
          var blockDaySpan = document.getElementById('blockDay');
          if(calTurnRange){
            calTurnRange.style.display = 'none';
          }
          if(turnProgressInner && turnProgressInner.parentElement){
            turnProgressInner.parentElement.style.display = 'none';
          }
          if(turnDaySpan && turnDaySpan.parentElement){
            turnDaySpan.parentElement.style.display = 'none';
          }
          if(blockDaySpan && blockDaySpan.parentElement){
            blockDaySpan.parentElement.style.display = 'none';
          }
// Render por cajas (como PDF): 353 al centro, 354 arriba (Día 2), etc.
var grid = document.getElementById('anilloGrid');
if(grid){
  var dowMap = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
  var startDay = leap ? 18 : 19;            // 353 (Día 1) arranca 18/12 si bisiesto, 19/12 si no
  var maxSeq = (logicalDay == null ? 0 : (logicalDay - 352));  // 353->1 ... 365->13

  // JDN del 0001-01-01 (Juliano) para convertir a Día Solar (misma convención del header)
  var jJulEpochLocal = jdnJ(1,1,1);

  grid.querySelectorAll('.anBox[data-seq]').forEach(function(box){
    var seq = parseInt(box.getAttribute('data-seq')||'0',10);
    if(!seq) return;

    // Fecha gregoriana dentro del tramo del Anillo
    var date = dt(y, 12, startDay + (seq-1)); // UTC
    var mm = String(date.getUTCMonth()+1).padStart(2,'0');
    var dd = String(date.getUTCDate()).padStart(2,'0');
    var dm = dd + '/' + mm;

    // Día solar para esa fecha (Gregoriano moderno)
    var jdn = jdnG(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate());
    var solar = jdn - jJulEpochLocal + 1;

    // Header
    var lbl = box.querySelector('.anBoxHead .lbl');
    var dmEl = box.querySelector('.anBoxHead .dm');
    var solEl = box.querySelector('.anBoxHead .solar');
    var dowEl = box.querySelector('.anBoxHead .dow');
    if(lbl) lbl.textContent = 'Día ' + seq + ':';
    if(dmEl) dmEl.textContent = dm;
    if(solEl) solEl.textContent = String(solar);
    if(dowEl) dowEl.textContent = dowMap[date.getUTCDay()] || '';

    // Frecuencia en grande: se “desbloquea” al transitar esa fecha
    var freq = 352 + seq;
    var freqEl = box.querySelector('.anBoxFreq');
    if(freqEl){
      freqEl.textContent = (seq <= maxSeq ? String(freq) : '—');
    }

    // Estados visuales
    box.classList.remove('anBox--active','anBox--future');
    if(seq === maxSeq) box.classList.add('anBox--active');
    if(seq > maxSeq) box.classList.add('anBox--future');
  // Caja extra (solo años bisiestos): Día 14 (31/12) · Frecuencia 366
  var leapWrap = document.getElementById('anilloLeapWrap');
  var leapBox  = document.getElementById('anilloLeapBox');
  if(leapWrap && leapBox){
    if(leap){
      leapWrap.style.display = 'flex';
      var date14 = dt(y, 12, 31);
      var mm14 = String(date14.getUTCMonth()+1).padStart(2,'0');
      var dd14 = String(date14.getUTCDate()).padStart(2,'0');
      var dm14 = dd14 + '/' + mm14;

      var jdn14 = jdnG(date14.getUTCFullYear(), date14.getUTCMonth()+1, date14.getUTCDate());
      var solar14 = jdn14 - jJulEpochLocal + 1;

      var lbl14 = leapBox.querySelector('.anBoxHead .lbl');
      var dmEl14 = leapBox.querySelector('.anBoxHead .dm');
      var solEl14 = leapBox.querySelector('.anBoxHead .solar');
      var dowEl14 = leapBox.querySelector('.anBoxHead .dow');
      if(lbl14) lbl14.textContent = 'Día 14:';
      if(dmEl14) dmEl14.textContent = dm14;
      if(solEl14) solEl14.textContent = String(solar14);
      if(dowEl14) dowEl14.textContent = dowMap[date14.getUTCDay()] || '';

      var freqEl14 = leapBox.querySelector('.anBoxFreq');
      if(freqEl14){
        freqEl14.textContent = (maxSeq >= 14 ? '366' : '—');
      }

      leapBox.classList.remove('anBox--active','anBox--future');
      if(maxSeq === 14) leapBox.classList.add('anBox--active');
      if(maxSeq < 14)  leapBox.classList.add('anBox--future');
    }else{
      leapWrap.style.display = 'none';
    }
  }


  });

  // Zoom en celular: tocar una caja abre el detalle completo (encabezado + frecuencia)
  var modal = document.getElementById('anilloModal');
  if(modal && !modal.dataset.bound){
    var closeBtn = modal.querySelector('.anModalClose');
    var l1 = modal.querySelector('.anModalLine1');
    var solarSpan = modal.querySelector('.anModalLine2 .solar');
    var dowSpan = modal.querySelector('.anModalLine2 .dow');
    var freqBig = modal.querySelector('.anModalFreq');

    function closeModal(){
      modal.classList.remove('isOpen');
      modal.setAttribute('aria-hidden','true');
    }

    function openFromBox(box){
      var isMobile = (window.matchMedia && window.matchMedia('(max-width: 520px)').matches);
      if(!isMobile) return;

      var lbl = (box.querySelector('.anBoxHead .lbl')||{}).textContent || '';
      var dm  = (box.querySelector('.anBoxHead .dm')||{}).textContent || '';
      var sol = (box.querySelector('.anBoxHead .solar')||{}).textContent || '';
      var dow = (box.querySelector('.anBoxHead .dow')||{}).textContent || '';
      var freq= (box.querySelector('.anBoxFreq')||{}).textContent || '';

      if(l1) l1.textContent = (lbl.trim() + ' ' + dm.trim()).trim();
      if(solarSpan) solarSpan.textContent = sol.trim();
      if(dowSpan) dowSpan.textContent = dow.trim();
      if(freqBig) freqBig.textContent = freq.trim();

      modal.classList.add('isOpen');
      modal.setAttribute('aria-hidden','false');
    }

    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){
      if(e.target === modal || (e.target && e.target.classList && e.target.classList.contains('anModalBackdrop'))){
        closeModal();
      }
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeModal();
    });

    grid.addEventListener('click', function(e){
      var box = e.target && e.target.closest ? e.target.closest('.anBox') : null;
      if(!box) return;
      openFromBox(box);
    });
    // También permitir "zoom" tocando la caja extra (Día 14 / 366)
    var leapBox2 = document.getElementById('anilloLeapBox');
    if(leapBox2){
      leapBox2.addEventListener('click', function(e){
        e.stopPropagation();
        openFromBox(leapBox2);
      });
    }



    modal.dataset.bound = '1';
  }

}
}else{
          // Cerrar modal si salimos del Anillo
          var _am = document.getElementById('anilloModal');
          if(_am){ _am.classList.remove('isOpen'); _am.setAttribute('aria-hidden','true'); }
          cardPlane.style.display = '';
          anilloPlane.style.display = 'none';

          // Restaurar elementos de vuelta detallada fuera del Anillo
          var calTurnRange = document.getElementById('calTurnRange');
          var turnProgressInner = document.getElementById('turnProgressInner');
          var turnDaySpan = document.getElementById('turnDay');
          var blockDaySpan = document.getElementById('blockDay');
          if(calTurnRange){
            calTurnRange.style.display = '';
          }
          if(turnProgressInner && turnProgressInner.parentElement){
            turnProgressInner.parentElement.style.display = '';
          }
          if(turnDaySpan && turnDaySpan.parentElement){
            turnDaySpan.parentElement.style.display = '';
          }
          if(blockDaySpan && blockDaySpan.parentElement){
            blockDaySpan.parentElement.style.display = '';
          }
        }
      })();;
var tz = (Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || 'local';
      var nowLbl = now.toLocaleDateString();
      var nowTZ = $('#nowTZ'); if(nowTZ) nowTZ.textContent='Ahora: '+nowLbl+' · '+tz;
      var refLabel=$('#refLabel'); if(refLabel) refLabel.textContent=(Rf? (String(Rf.d).padStart(2,'0')+'-'+String(Rf.m).padStart(2,'0')+'-'+String(Rf.y).padStart(4,'0')) : '0');

      var doyVal=dOY(ref);
      var y = ref.getUTCFullYear();
      var m = ref.getUTCMonth() + 1;
      var d = ref.getUTCDate();
      var leap = isL(y);
      var showAnillo = false;
      var logicalDay = null;
      if(m === 12){
        if(!leap){
          if(d === 19){ showAnillo = true; logicalDay = 353; }
          else if(d === 20){ showAnillo = true; logicalDay = 354; }
          else if(d === 21){ showAnillo = true; logicalDay = 355; }
          else if(d === 22){ showAnillo = true; logicalDay = 356; }
          else if(d === 23){ showAnillo = true; logicalDay = 357; }
          else if(d === 24){ showAnillo = true; logicalDay = 358; }
          else if(d === 25){ showAnillo = true; logicalDay = 359; }
          else if(d === 26){ showAnillo = true; logicalDay = 360; }
          else if(d === 27){ showAnillo = true; logicalDay = 361; }
          else if(d === 28){ showAnillo = true; logicalDay = 362; }
          else if(d === 29){ showAnillo = true; logicalDay = 363; }
          else if(d === 30){ showAnillo = true; logicalDay = 364; }
          else if(d === 31){ showAnillo = true; logicalDay = 365; }
        }else{
          if(d === 18){ showAnillo = true; logicalDay = 353; }
          else if(d === 19){ showAnillo = true; logicalDay = 354; }
          else if(d === 20){ showAnillo = true; logicalDay = 355; }
          else if(d === 21){ showAnillo = true; logicalDay = 356; }
          else if(d === 22){ showAnillo = true; logicalDay = 357; }
          else if(d === 23){ showAnillo = true; logicalDay = 358; }
          else if(d === 24){ showAnillo = true; logicalDay = 359; }
          else if(d === 25){ showAnillo = true; logicalDay = 360; }
          else if(d === 26){ showAnillo = true; logicalDay = 361; }
          else if(d === 27){ showAnillo = true; logicalDay = 362; }
          else if(d === 28){ showAnillo = true; logicalDay = 363; }
          else if(d === 29){ showAnillo = true; logicalDay = 364; }
          else if(d === 30){ showAnillo = true; logicalDay = 365; }
          else if(d === 31){ showAnillo = true; logicalDay = 366; }
        }
      }
      var idx=((doyVal-1)%16);
      var CARD_MAP=['SO','SO','SO','SO','NE','NE','NE','NE','NO','NO','NO','NO','SE','SE','SE','SE'];
      var day=idx+1;
      var card=CARD_MAP[idx];
      var step=(idx%4)+1;
      var blk=Math.floor(idx/4)+1;
      var mem=(card==='SO')?(['','RAM','REM','ROM','RUM'][step]):'0';

      var el;
      el=$('#calDay'); if(el) el.textContent=day;
      el=$('#calCard'); if(el) el.textContent=card;
      el=$('#calStep'); if(el) el.textContent=(['Lógica','Inhumano','Humano','Contexto'][step-1]);
      el=$('#calMem'); if(el) el.textContent=mem;
      var memBlock=$('#calMemBlock'); if(memBlock) memBlock.style.display=(card==='SO')?'':'none';
      plane(card);
      var ks=['NE','NO','SE','SO']; for(var i3=0;i3<ks.length;i3++){ var cell=$('#cell'+ks[i3]); if(cell){ var ls=cell.querySelectorAll('.cStep'); for(var j=0;j<ls.length;j++){ ls[j].classList.remove('active'); } } }
      var activeCell=$('#cell'+card); if(activeCell){ var elStep=activeCell.querySelector('.cStep[data-step="'+step+'"]'); if(elStep){ elStep.classList.add('active'); } }
      var memTags=document.querySelectorAll('.memTag'); for(var mI=0;mI<memTags.length;mI++){ memTags[mI].classList.remove('active'); }
      if(card==='SO'){ var map=['','RAM','REM','ROM','RUM']; var tmem=map[step]; var soCell=$('#cellSO'); if(soCell){ var tag=soCell.querySelector('.memTag[data-mem="'+tmem+'"]'); if(tag) tag.classList.add('active'); } }

      var y=ref.getUTCFullYear(), yl=yLen(y), doy=doyVal;
      var totalTurns = Math.ceil(yl/16);
      var turn = Math.floor((doy-1)/16)+1;
      var startDoy = (turn-1)*16+1, endDoy = Math.min(turn*16, yl);
      var turnLen = (turn<totalTurns)?16:(yl - (totalTurns-1)*16);
      var dayInTurn = (doy - startDoy) + 1;
      var yearStart = dt(y,1,1);
      var startDate = addDays(yearStart, startDoy-1);
      var endDate = addDays(yearStart, endDoy-1);
      el=$('#calTurn'); if(el) el.textContent = 'Nº '+turn+' de 22';
      el=$('#calTurnRange'); if(el) el.textContent = 'inicio: '+fmtDate(startDate)+' · fin: '+fmtDate(endDate)+' · extensión: '+turnLen;
      el=$('#turnDay'); if(el) el.textContent = (dayInTurn+' / '+turnLen);
      el=$('#turnProgressInner'); if(el) el.style.width = Math.round(100*dayInTurn/turnLen)+'%';
      el=$('#blockDay'); if(el) el.textContent = ((day-1)%4)+1;

      
      // Ajustes de encabezado para el Anillo de Fuego
      if(showAnillo && logicalDay != null){
        var isLeapYear = isL(Rf.y);
	        var isLastLeapDay = isLeapYear && Rf.m===12 && Rf.d===31;

	        // Ocultar el bloque superior "Frecuencia / Día" (antes era Paso + valor)
	        // porque ahora esa info vive dentro de cada cuadro del Anillo.
	        var calDayLabelEl = $('#calDayLabel');
	        if(calDayLabelEl && calDayLabelEl.parentElement){
	          calDayLabelEl.parentElement.style.display='none';
	        }
	        // Ocultar también el bloque "Día" superior del Anillo (ya está en los cuadros)
	        var anilloDayBlock = $('#anilloDayBlock');
	        if(anilloDayBlock) anilloDayBlock.style.display='none';

        // Ocultar bloques de Cardinalidad / Columna / Memoria
        var cardBlock=$('#calCardBlock');
        var stepBlock=$('#calStepBlock');
        var memBlock=$('#calMemBlock');
        if(cardBlock) cardBlock.style.display='none';
        if(stepBlock) stepBlock.style.display='none';
        if(memBlock) memBlock.style.display='none';

        // Ajustar vuelta: fija como Nº 23 de 23 durante el Anillo
        var cycleLabel=$('#calCycleLabel');
        if(cycleLabel) cycleLabel.textContent='';

        var turnBlock=$('#calTurnBlock');
        if(turnBlock) turnBlock.style.display='';

        // Texto principal de Vuelta
        el=$('#calTurn');
        if(el){
          el.textContent='Nº 23 de 23';
        }

        // Rango del Anillo de Fuego según sea bisiesto o no
        var startDayAnillo = isLeapYear ? 18 : 19;
        var startDateAnillo = dt(Rf.y, 12, startDayAnillo);
        var endDateAnillo = dt(Rf.y, 12, 31);
        var lenAnillo = isLeapYear ? 14 : 13;

        var turnRangeEl = $('#calTurnRange');
        if(turnRangeEl){
          turnRangeEl.style.display='';
          turnRangeEl.textContent = 'inicio: '+fmtDate(startDateAnillo)+' · fin: '+fmtDate(endDateAnillo)+' · extensión: '+lenAnillo;
        }

        // Reset de progreso de vuelta y día de bloque para el contexto del Anillo
        el=$('#turnDay'); if(el) el.textContent='—';
        el=$('#turnProgressInner'); if(el) el.style.width='0%';
        el=$('#blockDay'); if(el) el.textContent='—';
      }else{
        // Fuera del Anillo: restaurar etiqueta y ocultar bloque Día del Anillo
        el=$('#calDayLabel'); if(el) el.textContent='Paso';
	        // Re-mostrar el bloque de Paso (calDayLabel + calDay)
	        var calDayLabelEl2 = $('#calDayLabel');
	        if(calDayLabelEl2 && calDayLabelEl2.parentElement){
	          calDayLabelEl2.parentElement.style.display='';
	        }
        var anilloDayBlock2=$('#anilloDayBlock');
        if(anilloDayBlock2) anilloDayBlock2.style.display='none';
        var cardBlock2=$('#calCardBlock');
        var stepBlock2=$('#calStepBlock');
        var memBlock2=$('#calMemBlock');
        if(cardBlock2) cardBlock2.style.display='';
        if(stepBlock2) stepBlock2.style.display='';
        if(memBlock2){
          var cardText=$('#calCard') ? $('#calCard').textContent : '';
          memBlock2.style.display=(cardText==='SO')?'':'none';
        }
        var cycleLabel2=$('#calCycleLabel');
        if(cycleLabel2) cycleLabel2.textContent='';
        // Asegurar que el rango de vuelta vuelva a mostrarse fuera del Anillo
        var turnRangeEl2 = $('#calTurnRange');
        if(turnRangeEl2) turnRangeEl2.style.display='';
      }
var isGregorian = (Rf.y>1582) || (Rf.y===1582 && (Rf.m>10 || (Rf.m===10 && Rf.d>=15)));
      var jJulEpoch = jdnJ(1,1,1);
      var j=0, gFrom=0;
      if(isGregorian){ j = jdnG(Rf.y,Rf.m,Rf.d); var GREG0 = jdnG(1582,10,15); gFrom = Math.max(0, (j - GREG0 + 1)); }
      else { j = jdnJ(Rf.y,Rf.m,Rf.d); gFrom = 0; }
      var totalSolar = j - jJulEpoch + 1;
      el=$('#solarDays'); if(el) el.textContent=totalSolar;
      el=$('#sb_total'); if(el) el.textContent=totalSolar;
      el=$('#sb_jul'); if(el) el.textContent=577737;
      el=$('#sb_greg'); if(el) el.textContent=Math.max(0,gFrom-1);
      el=$('#sb_greg_jdn_b'); if(el) el.textContent=j;
      el=$('#sb_greg_alt'); if(el) el.textContent=Math.max(0,gFrom-1);
      var Q=dt(2012,10,14), qd=Math.floor((ref-Q)/ms), qI=Math.floor((qd-1)/39)+1, qD=((qd-1)%39)+1;
      var bricks = qd>0 ? Math.floor((qd-1)/3)+1 : 0;
      el=$('#qDays'); if(el) el.textContent=qd;
      el=$('#qBricks'); if(el) el.textContent=bricks>0?bricks:'—';
      el=$('#qNumber'); if(el) el.textContent='#'+qI;
      el=$('#qIdx'); if(el) el.textContent=qI;
      el=$('#qDay'); if(el) el.textContent=qD;
      el=$('#brickIdx'); if(el) el.textContent=Math.floor((qD-1)/3)+1;
      el=$('#brickDay'); if(el) el.textContent=((qD-1)%3)+1;

      // *** CHANGE: life days computed vs reference date Rf (not today) ***
      el=$('#lifeDays'); 
      if(el){
        if(dob){
          var refUTC = Date.UTC(Rf.y, Rf.m-1, Rf.d);
          var dobUTC = Date.UTC(Db.y, Db.m-1, Db.d);
          el.textContent = Math.max(0, Math.floor((refUTC - dobUTC) / ms));
        } else {
          el.textContent = '0';
        }
      }

      // Día solar nativo: día solar correspondiente a la fecha de nacimiento
      el=$('#nativeSolarDay');
      if(el){
        if(Db){
          var isGregorianDob = (Db.y>1582) || (Db.y===1582 && (Db.m>10 || (Db.m===10 && Db.d>=15)));
          var jDob = isGregorianDob ? jdnG(Db.y, Db.m, Db.d) : jdnJ(Db.y, Db.m, Db.d);
          var nativeSolar = jDob - jJulEpoch + 1;
          el.textContent = nativeSolar;
        } else {
          el.textContent = '—';
        }
      }

      el=$('#doy'); if(el) el.textContent=fmtDate(ref);
      el=$('#ylen'); if(el) el.textContent=yl;
      el=$('#freqYearPos'); if(el) el.textContent='+'+doy;
      el=$('#freqYearNeg'); if(el) el.textContent='−'+(yl-doy);
      el=$('#annYear'); if(el) el.textContent=(doy-(yl-doy));
      el=$('#yearProgressInner'); if(el) el.style.width=Math.round(100*doy/yl)+'%';

      var apIndexVal = Math.floor((y-1)/4)+1;
      var aStartY = y - ((y-1)%4);
      var aPos = Math.floor((ref - dt(aStartY,1,1))/ms)+1;
      var aNeg = 1461 - aPos;
      el=$('#apIndex'); if(el) el.textContent=apIndexVal;
      el=$('#apStart'); if(el) el.textContent=fmtDate(dt(aStartY,1,1));
      el=$('#freqAppPos'); if(el) el.textContent='+'+aPos;
      el=$('#freqAppNeg'); if(el) el.textContent='−'+aNeg;
      el=$('#annApp'); if(el) el.textContent=(aPos-aNeg);
      el=$('#appProgressInner'); if(el) el.style.width=Math.round(100*aPos/1461)+'%';
      var yearPhase = Math.max(1, Math.min(4, y - aStartY + 1));
      var PHASES = ['0','Asume','Asimila','Desafía','Decide'];
      var apBadge = document.getElementById('apPhaseBadge'); if(apBadge){ apBadge.textContent = 'Aparato Nº '+apIndexVal+' · Año '+yearPhase+' — '+PHASES[yearPhase]; }

      // Marcas LGC: calcula automáticamente leyendo data-date-iso del DOM (soporta fechas pasadas y futuras)
      function parseISODate(iso){
        if(!iso) return null;
        var m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(iso));
        if(!m) return null;
        return dt(parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10));
      }
      function fmtSigned(n){
        if(!isFinite(n)) return '—';
        if(n===0) return '0';
        return n<0 ? ('−'+Math.abs(n)) : String(n);
      }
      function updateAnchors(refDate){
        var grid = document.getElementById('anchorsGrid');
        if(!grid) return;

        // Orden cronológico (más antiguo → más reciente)
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.a-card'));
        var items = cards.map(function(card){
          var valEl = card.querySelector('[data-date-iso]');
          var iso = valEl ? valEl.getAttribute('data-date-iso') : null;
          var d = parseISODate(iso);
          return {card:card, valEl:valEl, date:d, time:d ? d.getTime() : Number.POSITIVE_INFINITY};
        });
        items.sort(function(a,b){ return a.time - b.time; });
        items.forEach(function(it){ grid.appendChild(it.card); });

        // Conteo: pasado positivo, futuro negativo (evita -0)
        items.forEach(function(it){
          if(!it.valEl || !it.date) return;
          var diff = Math.floor((refDate - it.date)/ms);
          if(diff===0) diff = 0;
          it.valEl.textContent = fmtSigned(diff);
          it.valEl.title = diff<0 ? ('Faltan '+Math.abs(diff)+' días') : '';
        });
      }
      updateAnchors(ref);


      // Calendario lógico: slider de años a futuro (desde 2028)
      var futureYears = 0;
      var calogRange = document.getElementById('calogFuture');
      if(calogRange){
        futureYears = parseInt(calogRange.value||'0',10) || 0;
        var vEl = document.getElementById('calogFutureVal'); if(vEl) vEl.textContent = futureYears;
        var toEl = document.getElementById('calogFutureTo'); if(toEl) toEl.textContent = '→ ' + (2028 + futureYears);
      }
      buildCalog(ref, futureYears);
      init=true;
      status('ok: '+(String(Rf.y).padStart(4,'0')+'-'+pad(Rf.m)+'-'+pad(Rf.d)), true);
    }
    window.addEventListener('error', function(e){ status('error: '+e.message, false); });
    
document.addEventListener('DOMContentLoaded', function(){
  // Defer the first heavy update to allow the first paint (helps mobile FCP/LCP)
  if (window.requestAnimationFrame) {
    requestAnimationFrame(function(){ setTimeout(up, 0); });
  } else {
    setTimeout(up, 0);
  }

  function debounce(fn, wait){
    var t;
    return function(){
      var ctx=this, args=arguments;
      clearTimeout(t);
      t=setTimeout(function(){ fn.apply(ctx, args); }, wait);
    };
  }
  var upDebounced = debounce(up, 250);
  var ids=['ref','refText','dob','dobText','calogFuture'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', upDebounced);
    el.addEventListener('change', up);
  });

  function readRefParts(){
    var refI=document.getElementById('ref');
    var refT=document.getElementById('refText');
    var raw=((refT && refT.value)?refT.value:((refI && refI.value)?refI.value:''));
    raw=(raw||'').trim();

    // Fallback: hoy (local)
    if(!raw){
      var now=new Date();
      raw=String(now.getFullYear()).padStart(4,'0')+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    }

    var p=flex(raw);
    if(p) return p;
    var t=Date.parse(raw);
    if(!isNaN(t)){
      var tmp=new Date(t);
      return {y:tmp.getUTCFullYear(), m:tmp.getUTCMonth()+1, d:tmp.getUTCDate()};
    }
    var now2=new Date();
    return {y:now2.getFullYear(), m:now2.getMonth()+1, d:now2.getDate()};
  }

  function setRefInputsFromUTCDate(d){
    var refI=document.getElementById('ref');
    var refT=document.getElementById('refText');
    var y=d.getUTCFullYear();
    var m=d.getUTCMonth()+1;
    var da=d.getUTCDate();

    // Si el input es de tipo "date": yyyy-mm-dd. Si es texto: dd-mm-aaaa.
    var iso=String(y).padStart(4,'0')+'-'+pad(m)+'-'+pad(da);
    var dmY=pad(da)+'-'+pad(m)+'-'+String(y).padStart(4,'0');

    if(refI){
      refI.value = (refI.type === 'date') ? iso : dmY;
    }
    if(refT){
      refT.value = (refT.type === 'date') ? iso : dmY;
    }

    // Notificar cambios programáticos (para badges/links y listeners de input/change)
    var target = refI || refT;
    if(target){
      try{
        target.dispatchEvent(new Event('input', {bubbles:true}));
        target.dispatchEvent(new Event('change', {bubbles:true}));
      }catch(e){}
    }
  }

  function shiftRefBy(deltaDays){
    var p=readRefParts();
    var base=dt(p.y,p.m,p.d);
    var moved=addDays(base, deltaDays);
    setRefInputsFromUTCDate(moved);
  }

  var btnToday=document.getElementById('btnToday');
  if(btnToday){
    btnToday.addEventListener('click', function(){
      var now=new Date();
      var today=dt(now.getFullYear(), now.getMonth()+1, now.getDate());
      setRefInputsFromUTCDate(today);
    });
  }

  var btnPrev=document.getElementById('btnPrevDay');
  if(btnPrev){
    btnPrev.addEventListener('click', function(){
      shiftRefBy(-1);
    });
  }

  var btnNext=document.getElementById('btnNextDay');
  if(btnNext){
    btnNext.addEventListener('click', function(){
      shiftRefBy(1);
    });
  }
}, {once:true});

  }catch(e){
    status('error init: '+e.message, false);
  }
})();