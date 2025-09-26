(function(){
  var dbg=document.getElementById('rdbg');
  function status(msg, ok){ if(dbg){ dbg.textContent=msg; dbg.style.color = ok ? '#9cffd5' : '#ff9aa2'; } }
  try{
    status('estado: JS cargado', true);
    var ms=86400000;
    function isGreg(y,m,d){ return (y>1582)||(y===1582&&(m>10||(m===10&&d>=15))); }
    function jdnG(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-Math.floor(Y/100)+Math.floor(Y/400)-32045;}
    function jdnJ(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-32083;}
    function jdnMixed(Y,M,D){ return isGreg(Y,M,D) ? jdnG(Y,M,D) : jdnJ(Y,M,D); }
    function flex(str){
      if(!str) return null;
      var s=String(str).trim().replace(/\//g,'-');
      var p=s.split('-'); if(p.length!==3) return null;
      var idxY=-1; for(var i=0;i<3;i++){ if(/^\d{4,6}$/.test(p[i])){ idxY=i; break; } }
      var y,m,d;
      if(idxY>=0){ y=parseInt(p[idxY],10); var r=[]; for(i=0;i<3;i++){ if(i!==idxY) r.push(parseInt(p[i],10)); }
        if(r.length!==2||isNaN(r[0])||isNaN(r[1])) return null; if(idxY===0){ m=r[0]; d=r[1]; } else { d=r[0]; m=r[1]; } }
      else{ y=parseInt(p[0],10); m=parseInt(p[1],10); d=parseInt(p[2],10); }
      if(!(y>=1&&y<=275760&&m>=1&&m<=12&&d>=1&&d<=31)) return null;
      return {y:y,m:m,d:d};
    }

    function calc(){
      var sT=document.getElementById('startT')?.value.trim()||'';
      var eT=document.getElementById('endT')?.value.trim()||'';
      var sI=document.getElementById('start')?.value||'';
      var eI=document.getElementById('end')?.value||'';
      var S = flex(sT || sI), E = flex(eT || eI);
      var out=document.getElementById('out');
      var chipEx=document.getElementById('chipEx');
      var chipIn=document.getElementById('chipIn');
      var inclusive=document.getElementById('inclusive');
      if(S && E){
        var ex = (jdnMixed(E.y,E.m,E.d) - jdnMixed(S.y,S.m,S.d));
        var inc = ex + 1;
        if(chipEx) chipEx.textContent = 'Exclusivo: ' + ex;
        if(chipIn) chipIn.textContent = 'Inclusivo: ' + inc;
        if(inclusive && inclusive.checked){
          if(out) out.textContent = inc;
          if(chipIn) chipIn.classList.add('active'); if(chipEx) chipEx.classList.remove('active');
        }else{
          if(out) out.textContent = ex;
          if(chipEx) chipEx.classList.add('active'); if(chipIn) chipIn.classList.remove('active');
        }
        status('ok', true);
      } else {
        if(out) out.textContent='—';
        if(chipEx) { chipEx.textContent = 'Exclusivo: —'; chipEx.classList.remove('active'); }
        if(chipIn) { chipIn.textContent = 'Inclusivo: —'; chipIn.classList.remove('active'); }
        status('ok (faltan fechas)', true);
      }
    }

    function bindHandlers(){
      var ok=true, miss=[];
      var btnC=document.getElementById('calc'); if(btnC){ btnC.addEventListener('click', calc); } else { ok=false; miss.push('calc'); }
      var btnS=document.getElementById('swap'); if(btnS){ btnS.addEventListener('click', function(){ 
        var sT=document.getElementById('startT'), eT=document.getElementById('endT');
        var sI=document.getElementById('start'), eI=document.getElementById('end');
        if(sT&&eT){ var t=sT.value; sT.value=eT.value; eT.value=t; }
        if(sI&&eI){ var t2=sI.value; sI.value=eI.value; eI.value=t2; }
        calc();
      }); } else { miss.push('swap'); ok=false; }
      var btnX=document.getElementById('clear'); if(btnX){ btnX.addEventListener('click', function(){
        ['start','end','startT','endT'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.value=''; } });
        calc();
        status('ok (limpio)', true);
      }); } else { miss.push('clear'); ok=false; }
      var inc=document.getElementById('inclusive'); if(inc){ inc.addEventListener('change', calc); } else { miss.push('inclusive'); ok=false; }
      ['start','end','startT','endT'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.addEventListener('change', calc); } else { miss.push(id); ok=false; } });
      if(ok){ status('listo (handlers)', true); } else { status('handlers faltantes: '+miss.join(', '), false); }
    }

    // Intento inmediato (defer debería alcanzar)
    bindHandlers();
    // Refuerzo: al terminar de parsear DOM
    document.addEventListener('DOMContentLoaded', function(){ bindHandlers(); calc(); }, {once:true});
    // Tercer intento: pequeño retraso por seguridad
    setTimeout(function(){ bindHandlers(); }, 300);

  }catch(e){
    status('error init: '+e.message, false);
  }
})();