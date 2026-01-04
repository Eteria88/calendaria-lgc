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
  function setActive(el, on){ if(el){ el.classList.toggle('active', !!on); } }

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

    function calcPotenciales(baseA, baseB){
      return {
        A: baseA,
        B: baseB,
        sum: baseA + baseB,
        delta: baseB - baseA
      };
    }

    function calcConstante(baseA, baseB){
      var sum = baseA + baseB;
      var mod = ((sum % 369) + 369) % 369; // siempre positivo
      return { value: sum, sum: sum, mod369: mod };
    }

    function bandaEtaria(dias){
      var bandas = [
        { n: 1, desde: 0,     hasta: 5777,  nextStart: 5778 },
        { n: 2, desde: 5778,  hasta: 11554, nextStart: 11555 },
        { n: 3, desde: 11555, hasta: 17331, nextStart: 17332 },
        { n: 4, desde: 17332, hasta: 23108, nextStart: 23109 },
        { n: 5, desde: 23109, hasta: 28885, nextStart: 28886 }
      ];
      var b = null;
      for(var i=0;i<bandas.length;i++){
        if(dias >= bandas[i].desde && dias <= bandas[i].hasta){ b = bandas[i]; break; }
      }
      if(!b) return { ok:false, msg:'Fuera de rango (0–28885).' };

      return {
        ok:true,
        banda: b.n,
        desde: b.desde,
        hasta: b.hasta,
        falta: (b.n < 5) ? (b.nextStart - dias) : null,
        proxima: (b.n < 5) ? b.nextStart : null
      };
    }

    function calc(){
      var sI = $('start') ? $('start').value : '';
      var eI = $('end') ? $('end').value : '';
      var S = flex(sI), E = flex(eI);

      var out = $('out');
      var yearsOut = $('yearsOut');
      var inclusive = $('inclusive');

      // Defaults de salida
      function clearAll(){
        if(out) out.textContent = '—';
        if(yearsOut) yearsOut.textContent = '—';
        setText('chipEx', 'Exclusivo: —');
        setText('chipIn', 'Inclusivo: —');

        setText('potA', '—'); setText('potB', '—'); setText('potSum', '—'); setText('potDelta', '—');
        setText('constOut', '—'); setText('constAplusB', 'A + B: —'); setText('constMod369', '(A + B) mod 369: —');
        setText('ageDays', '—'); setText('bandName', '—'); setText('bandRange', '—'); setText('bandRemaining', '—');
      }

      if(!(S && E)){
        clearAll();
        status('ok (faltan fechas)', true);
        return;
      }

      var baseA = jdnMixed(S.y,S.m,S.d);
      var baseB = jdnMixed(E.y,E.m,E.d);

      var ex = (baseB - baseA);
      var inc = ex + 1;

      // --- Diferencial ---
      setText('chipEx', 'Exclusivo: ' + ex);
      setText('chipIn', 'Inclusivo: ' + inc);

      // Estado activo visual de chips
      var useInc = inclusive && inclusive.checked;
      if(out) out.textContent = useInc ? inc : ex;

      // Years (aprox. tropical)
      if(yearsOut){
        var years = ex / 365.2425;
        yearsOut.textContent = String(Math.floor(years));
      }

      setActive($('chipEx'), !useInc);
      setActive($('chipIn'), useInc);

      // --- Potenciales ---
      var pot = calcPotenciales(baseA, baseB);
      setText('potA', String(pot.A));
      setText('potB', String(pot.B));
      setText('potSum', String(pot.sum));
      setText('potDelta', String(pot.delta));

      // --- Constante ---
      var con = calcConstante(baseA, baseB);
      setText('constOut', String(con.value));
      setText('constAplusB', 'A + B: ' + con.sum);
      setText('constMod369', '(A + B) mod 369: ' + con.mod369);

      // --- Banda etaria ---
      // Días de vida: (B - A) exclusivo. Día 0 = mismo día.
      setText('ageDays', String(ex));
      if(ex < 0){
        setText('bandName', '—');
        setText('bandRange', '—');
        setText('bandRemaining', 'Fecha B < Fecha A');
      }else{
        var b = bandaEtaria(ex);
        if(!b.ok){
          setText('bandName', '—');
          setText('bandRange', '—');
          setText('bandRemaining', b.msg);
        }else{
          setText('bandName', b.banda + 'ª');
          setText('bandRange', b.desde + '–' + b.hasta);
          if(b.banda >= 5){
            setText('bandRemaining', 'Última banda (sin próxima)');
          }else{
            setText('bandRemaining', b.falta + ' días (próxima en ' + b.proxima + ')');
          }
        }
      }

      status('ok', true);
    }

    function setTab(key){
      // botones
      var btns = document.querySelectorAll('[data-tabbtn]');
      btns.forEach(function(b){
        setActive(b, b.getAttribute('data-tabbtn') === key);
      });
      // paneles
      var tabs = document.querySelectorAll('[data-tab]');
      tabs.forEach(function(t){
        t.classList.toggle('show', t.getAttribute('data-tab') === key);
      });
    }

    function bindHandlers(){
      var btnC = $('calc'); if(btnC){ btnC.addEventListener('click', calc); }
      var btnX = $('clear'); if(btnX){
        btnX.addEventListener('click', function(){
          ['start','end'].forEach(function(id){ var el=$(id); if(el) el.value=''; });
          var inc = $('inclusive'); if(inc) inc.checked = false;
          calc();
          status('ok (limpio)', true);
        });
      }

      var inc = $('inclusive'); if(inc){ inc.addEventListener('change', calc); }

      ['start','end'].forEach(function(id){
        var el = $(id);
        if(el){ el.addEventListener('change', calc); el.addEventListener('input', calc); }
      });

      // Chips exclus/inclus: click para alternar
      var chipEx = $('chipEx');
      var chipIn = $('chipIn');
      if(chipEx){
        chipEx.addEventListener('click', function(){
          var inc = $('inclusive'); if(inc){ inc.checked = false; calc(); }
        });
      }
      if(chipIn){
        chipIn.addEventListener('click', function(){
          var inc = $('inclusive'); if(inc){ inc.checked = true; calc(); }
        });
      }

      // Tabs
      var tabBtns = document.querySelectorAll('[data-tabbtn]');
      tabBtns.forEach(function(b){
        b.addEventListener('click', function(){
          setTab(b.getAttribute('data-tabbtn'));
        });
      });

      // Tab default
      setTab('diff');
    }

    // Intento inmediato (defer debería alcanzar)
    bindHandlers();
    // Refuerzo: al terminar de parsear DOM
    document.addEventListener('DOMContentLoaded', function(){ bindHandlers(); calc(); }, {once:true});
    // Tercer intento: pequeño retraso por seguridad
    setTimeout(function(){ bindHandlers(); }, 300);

  }catch(e){
    status('error init: ' + e.message, false);
  }
})();