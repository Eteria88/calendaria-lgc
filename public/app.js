(function(){
  var dbg=document.getElementById('dbg');
  function status(msg, ok){ if(dbg){ dbg.textContent=msg; dbg.style.color = ok ? '#9cffd5' : '#ff9aa2'; } }
  try{
    status('estado: JS cargado', true);
    function $(s){return document.querySelector(s);} 
    var ms=86400000;
    function dt(y,m,d){return new Date(Date.UTC(y,m-1,d));}
    function isL(y){return (y%4===0)&&((y%100)!==0||y%400===0);}
    function yLen(y){return isL(y)?366:365;}
    function dOY(d){var y=d.getUTCFullYear();return Math.floor((d-dt(y,1,1))/ms)+1;}
    function addDays(d,n){return new Date(d.getTime()+n*ms);}
    function pad(n){n=String(n); return n.length<2?('0'+n):n;}

    function flex(str){
      if(!str) return null;
      var s=String(str).trim().replace(/\//g,'-');
      var p=s.split('-'); if(p.length!==3) return null;
      var idxY=-1; for(var i=0;i<3;i++){ if(/^\d{4}$/.test(p[i])){ idxY=i; break; } }
      var y,m,d;
      if(idxY>=0){
        y=parseInt(p[idxY],10);
        var r=[]; for(i=0;i<3;i++){ if(i!==idxY) r.push(parseInt(p[i],10)); }
        if(r.length!==2||isNaN(r[0])||isNaN(r[1])) return null;
        if(idxY===0){ m=r[0]; d=r[1]; } else { d=r[0]; m=r[1]; }
      }else{ y=parseInt(p[0],10); m=parseInt(p[1],10); d=parseInt(p[2],10); }
      if(!(y>=1&&y<=9999&&m>=1&&m<=12&&d>=1&&d<=31)) return null;
      return {y:y,m:m,d:d};
    }
    function jdnG(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-Math.floor(Y/100)+Math.floor(Y/400)-32045;}
    function jdnJ(y,m,d){var a=Math.floor((14-m)/12);var Y=y+4800-a;var M=m+12*a-3;return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-32083;}

    function apIdx(y){return Math.floor((y-1)/4)+1;}
    function plane(card){
      var ks=['NE','NO','SE','SO']; for(var i=0;i<ks.length;i++){var el=$('#cell'+ks[i]); if(!el) continue; if(ks[i]===card) el.classList.add('active'); else el.classList.remove('active');}
    }
    function buildCalog(ref){
      var tbl=$('#calog'); if(!tbl) return;
      var tbody=tbl.querySelector('tbody'); if(!tbody) return;
      tbody.innerHTML='';
      var y0=2012,y1=2028,yr=ref.getUTCFullYear(),LGC=dt(2015,10,15),INS=dt(2012,10,14),C={};
      C[2012]=Math.floor((LGC-INS)/ms); C[2013]=Math.floor((dt(2016,1,1)-LGC)/ms);
      for(var y=2014;y<=y1;y++){ C[y]=C[y-1]+yLen(y-1); }
      var V={}, d=dOY(ref); V[yr]=d; for(y=yr-1;y>=2013;y--){ V[y]=V[y+1]+yLen(y); } if(yr>=2013) V[2012]=V[2013]-1018;
      var s=0;
      for(y=y1;y>=y0;y--){
        var tr=document.createElement('tr');
        var cells=[''+y, (V.hasOwnProperty(y)?V[y]:''), (C[y]||0), apIdx(y)];
        for(var i2=0;i2<cells.length;i2++){ var td=document.createElement('td'); td.textContent=cells[i2]; tr.appendChild(td); }
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
      var tStr=todayLocal.getFullYear()+'-'+pad(todayLocal.getMonth()+1)+'-'+pad(todayLocal.getDate());
      var qp=parseSearch();

      var refI=$('#ref'), refT=$('#refText'), dobI=$('#dob'), dobT=$('#dobText');
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
          }
        }

        if(showAnillo){
          cardPlane.style.display = 'none';
          anilloPlane.style.display = '';

          // 353 permanece estático en el centro.
          // Las marcas 354–365 se van activando progresivamente
          // y, una vez activadas (día lógico alcanzado), quedan visibles.
          var maxDay = (logicalDay == null ? 0 : logicalDay);
          var ticks = anilloPlane.querySelectorAll('.anilloTick[data-day]');
          ticks.forEach(function(el){
            var dayAttr = el.getAttribute('data-day');
            var day = dayAttr ? parseInt(dayAttr, 10) : 0;
            if(day && day <= maxDay){
              el.classList.remove('anilloTick--inactive');
            }else{
              el.classList.add('anilloTick--inactive');
            }
            if(day && day === maxDay){
              el.classList.add('anilloTick--active');
            }else{
              el.classList.remove('anilloTick--active');
            }
          });

          var lines = anilloPlane.querySelectorAll('.anilloLine[data-day]');
          lines.forEach(function(el){
            var dayAttr = el.getAttribute('data-day');
            var day = dayAttr ? parseInt(dayAttr, 10) : 0;
            if(day && day <= maxDay){
              el.classList.remove('anilloLine--inactive');
            }else{
              el.classList.add('anilloLine--inactive');
            }
          });
        }else{
          cardPlane.style.display = '';
          anilloPlane.style.display = 'none';
        }
      })();;
var tz = (Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || 'local';
      var nowLbl = now.toLocaleDateString();
      var nowTZ = $('#nowTZ'); if(nowTZ) nowTZ.textContent='Ahora: '+nowLbl+' · '+tz;
      var refLabel=$('#refLabel'); if(refLabel) refLabel.textContent=(Rf? (String(Rf.y).padStart(4,'0')+'-'+String(Rf.m).padStart(2,'0')+'-'+String(Rf.d).padStart(2,'0')) : '0');

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
      el=$('#calTurn'); if(el) el.textContent = 'Nº '+turn+' / '+totalTurns;
      el=$('#calTurnRange'); if(el) el.textContent = 'inicio: '+startDate.toISOString().slice(0,10)+' · fin: '+endDate.toISOString().slice(0,10)+' · len: '+turnLen;
      el=$('#turnDay'); if(el) el.textContent = (dayInTurn+' / '+turnLen);
      el=$('#turnProgressInner'); if(el) el.style.width = Math.round(100*dayInTurn/turnLen)+'%';
      el=$('#blockDay'); if(el) el.textContent = ((day-1)%4)+1;

      
      // Ajustes de encabezado para el Anillo de Fuego
      if(showAnillo && logicalDay != null){
        el=$('#calDay'); if(el) el.textContent = logicalDay;
        var cardBlock=$('#calCardBlock');
        var stepBlock=$('#calStepBlock');
        var memBlock=$('#calMemBlock');
        if(cardBlock) cardBlock.style.display='none';
        if(stepBlock) stepBlock.style.display='none';
        if(memBlock) memBlock.style.display='none';
        var cycleLabel=$('#calCycleLabel');
        if(cycleLabel) cycleLabel.textContent='Calendaria · Anillo de fuego 13 días';
        var turnBlock=$('#calTurnBlock');
        if(turnBlock) turnBlock.style.display='';
        el=$('#calTurn'); if(el) el.textContent='23/23';
        el=$('#calTurnRange'); if(el) el.style.display='none';
        el=$('#turnDay'); if(el) el.textContent='—';
        el=$('#turnProgressInner'); if(el) el.style.width='0%';
        el=$('#blockDay'); if(el) el.textContent='—';
      }else{
        var cardBlock2=$('#calCardBlock');
        var stepBlock2=$('#calStepBlock');
        var memBlock2=$('#calMemBlock');
        if(cardBlock2) cardBlock2.style.display='';
        if(stepBlock2) stepBlock2.style.display='';
        if(memBlock2) memBlock2.style.display='';
        var cycleLabel2=$('#calCycleLabel');
        if(cycleLabel2) cycleLabel2.textContent='Calendaria · ciclo de 16 días';
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
      el=$('#sb_greg'); if(el) el.textContent=gFrom;
      el=$('#sb_greg_jdn_b'); if(el) el.textContent=j;
      el=$('#sb_greg_alt'); if(el) el.textContent=Math.max(0,gFrom-1);

      var Q=dt(2012,10,14), qd=Math.floor((ref-Q)/ms), qI=Math.floor((qd-1)/39)+1, qD=((qd-1)%39)+1;
      el=$('#qDays'); if(el) el.textContent=qd;
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

      el=$('#doy'); if(el) el.textContent=doy;
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
      el=$('#apStart'); if(el) el.textContent=aStartY+'-01-01';
      el=$('#freqAppPos'); if(el) el.textContent='+'+aPos;
      el=$('#freqAppNeg'); if(el) el.textContent='−'+aNeg;
      el=$('#annApp'); if(el) el.textContent=(aPos-aNeg);
      el=$('#appProgressInner'); if(el) el.style.width=Math.round(100*aPos/1461)+'%';
      var yearPhase = Math.max(1, Math.min(4, y - aStartY + 1));
      var PHASES = ['0','Asume','Asimila','Desafía','Decide'];
      var apBadge = document.getElementById('apPhaseBadge'); if(apBadge){ apBadge.textContent = 'Aparato Nº '+apIndexVal+' · Año '+yearPhase+' — '+PHASES[yearPhase]; }

      var A={d_mendeleev:dt(1834,2,8),d_calendaria_web:dt(2025,9,9),d_lgc_inicio:dt(2015,10,15),d_toganesos:dt(2024,1,10),d_rupert:dt(1942,6,28),d_hamer:dt(1935,5,17),d_alcides:dt(1857,8,13),d_quinta:dt(2016,8,28),d_eje258:dt(2017,8,26),d_penta:dt(2022,1,7),d_patrono:dt(1971,8,15),d_uit:dt(1865,5,17),d_google:dt(1899,12,30),d_leapsec:dt(1972,6,30),d_admin:dt(2024,8,12),d_mac:dt(1969,12,6)};
      for(var key in A){ var el2=document.getElementById(key); if(el2) el2.textContent=Math.max(0,Math.floor((ref-A[key])/ms)); }

      buildCalog(ref);
      init=true;
      status('ok: '+(String(Rf.y).padStart(4,'0')+'-'+pad(Rf.m)+'-'+pad(Rf.d)), true);
    }
    window.addEventListener('error', function(e){ status('error: '+e.message, false); });
    
document.addEventListener('DOMContentLoaded', function(){
  up();
  var ids=['ref','refText','dob','dobText'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', up);
    el.addEventListener('change', up);
  });
  var btn=document.getElementById('btnToday');
  if(btn){
    btn.addEventListener('click', function(){
      var now=new Date();
      var iso=String(now.getFullYear()).padStart(4,'0')+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
      var refI=document.getElementById('ref');
      var refT=document.getElementById('refText');
      if(refI) refI.value=iso;
      if(refT) refT.value=iso;
      up();
    });
  }
}, {once:true});

  }catch(e){
    status('error init: '+e.message, false);
  }
})();