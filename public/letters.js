(function(){
  var dbg=document.getElementById('ldbg');
  function status(msg, ok){ if(dbg){ dbg.textContent=msg; dbg.style.color = ok ? '#9cffd5' : '#ff9aa2'; } }

  try{
    status('estado: JS cargado', true);

    // Mapa con Ñ=15
    var MAP = {
      'A':1,'B':2,'C':3,'D':4,'E':5,'F':6,'G':7,'H':8,'I':9,'J':10,'K':11,'L':12,'M':13,'N':14,'Ñ':15,
      'O':16,'P':17,'Q':18,'R':19,'S':20,'T':21,'U':22,'V':23,'W':24,'X':25,'Y':26,'Z':27
    };

    // Normalización de acentos (manteniendo Ñ)
    function normalizeChar(ch){
      if(!ch) return '';
      var c = ch.toUpperCase();
      if(c==='Ñ') return 'Ñ';
      // mapeo de vocales acentuadas/diacríticas a base
      if('ÁÀÂÄÃ'.indexOf(c)>=0) return 'A';
      if('ÉÈÊË'.indexOf(c)>=0) return 'E';
      if('ÍÌÎÏ'.indexOf(c)>=0) return 'I';
      if('ÓÒÔÖÕ'.indexOf(c)>=0) return 'O';
      if('ÚÙÛÜ'.indexOf(c)>=0) return 'U';
      return c;
    }

    function isLetterES(ch){
      var c = ch.toUpperCase();
      return /[A-Z]/.test(c) || c==='Ñ' || 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜ'.indexOf(c)>=0;
    }

    function tokenizarFrase(txt){
      // Palabras = secuencias de letras (incl. ñ y acentos) — ignoramos números y signos.
      var out=[];
      var curr='';
      for(var i=0;i<txt.length;i++){
        var ch=txt[i];
        if(isLetterES(ch)){ curr+=ch; }
        else{
          if(curr.length>0){ out.push(curr); curr=''; }
        }
      }
      if(curr.length>0) out.push(curr);
      return out;
    }

    function wordBreakdown(word){
      var letters = [];
      var values = [];
      var normWord = '';
      var total = 0;
      for(var i=0;i<word.length;i++){
        var n = normalizeChar(word[i]);
        if(MAP.hasOwnProperty(n)){
          letters.push(n);
          values.push(MAP[n]);
          normWord += n;
          total += MAP[n];
        } else {
          // si no es letra válida, la ignoramos en el cómputo y normalizada
        }
      }
      return {
        original: word,
        normalized: normWord,
        letters: letters,
        values: values,
        total: total
      };
    }

    function renderKB(){
      var kb=document.getElementById('kb');
      if(!kb) return;
      var order = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
      kb.innerHTML='';
      for(var i=0;i<order.length;i++){
        var k=order[i];
        var v=MAP[k];
        var div=document.createElement('div');
        div.className='key';
        div.innerHTML='<div class="k">'+k+'</div><div class="v">'+v+'</div>';
        kb.appendChild(div);
      }
    }

    function calc(){
      var phrase = (document.getElementById('phrase')?.value||'').trim();
      var tb = document.getElementById('tb');
      var lettersCount = document.getElementById('lettersCount');
      var wordsCount = document.getElementById('wordsCount');
      var totalSum = document.getElementById('totalSum');
      var tfTotal = document.getElementById('tfTotal');
      var lupaSum = document.getElementById('lupaSum');
      var tfLupa = document.getElementById('tfLupa');
      if(!tb) return;

      tb.innerHTML='';
      if(phrase===''){
        if(lettersCount) lettersCount.textContent='Letras: —';
        if(wordsCount) wordsCount.textContent='Palabras: —';
        if(totalSum) totalSum.textContent='Total frase: —';
        if(tfTotal) tfTotal.textContent='—';
        if(lupaSum) lupaSum.textContent='Lupa: —';
        if(tfLupa) tfLupa.textContent='—';
        status('ok (vacío)', true);
        return;
      }

      var words = tokenizarFrase(phrase);
      var totalFrase=0, totalLetras=0;
      for(var i=0;i<words.length;i++){
        var br = wordBreakdown(words[i]);
        totalFrase += br.total;
        totalLetras += br.letters.length;
        var tr=document.createElement('tr');
        var seq = (i+1);
        var lettersExpr = br.letters.map(function(L,idx){ return L+'('+br.values[idx]+')'; }).join(' + ');
        tr.innerHTML = '<td>'+seq+'</td>'
          + '<td>'+br.original+'</td>'
          + '<td>'+lettersExpr+'</td>'
          + '<td class="mono">'+br.total+'</td>';
        tb.appendChild(tr);
      }
      if(lettersCount) lettersCount.textContent='Letras: '+totalLetras;
      if(wordsCount) wordsCount.textContent='Palabras: '+words.length;
      if(totalSum) totalSum.textContent='Total frase: '+totalFrase;
      if(tfTotal) tfTotal.textContent=totalFrase;
      // Lupa = Total × 1,21
      var lupa = totalFrase * 1.21;
      var lupaTxt;
      try{ lupaTxt = lupa.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
      catch(e){ lupaTxt = (Math.round(lupa*100)/100).toFixed(2); }
      if(lupaSum) lupaSum.textContent='Lupa: '+lupaTxt;
      if(tfLupa) tfLupa.textContent=lupaTxt;
      status('ok', true);
    }

    function bind(){
      var ta=document.getElementById('phrase');
      if(ta){ ta.addEventListener('input', calc); }
      var cl=document.getElementById('clearBtn');
      if(cl){ cl.addEventListener('click', function(){ var ta=document.getElementById('phrase'); if(ta){ ta.value=''; } calc(); }); }
    }

    document.addEventListener('DOMContentLoaded', function(){ renderKB(); bind(); calc(); }, {once:true});
  }catch(e){
    status('error init: '+e.message, false);
  }
})();