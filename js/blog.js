(function(){'use strict';var d=document,w=window;w.dataLayer=w.dataLayer||[];
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
var burger=d.querySelector('.burger'),nav=d.getElementById('nav');
burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false')});
nav.addEventListener('click',function(e){if(e.target.closest('a')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false')}});
d.addEventListener('click',function(e){var a=e.target.closest('a[data-wa]');if(a)w.dataLayer.push({event:'whatsapp_click',section:a.dataset.wa,pagina:location.pathname})});
var box=d.getElementById('consent');
  if(box){var bp=box.querySelector('p');if(bp)bp.textContent='Uso cookies de medição (Google Tag Manager e Microsoft Clarity) para entender como o site é usado, incluindo mapas de calor e gravações anônimas de sessão. Você pode recusar sem perder nenhum conteúdo.'}
function loadClarity(){if(w.__clr)return;w.__clr=1;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(w,d,'clarity','script','z6lw4hqz32')}
  function loadGTM(){if(w.__gtm)return;w.__gtm=1; loadClarity();w.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=GTM-5H2NS7RF';d.head.appendChild(s)}
var c=store('consent');if(c==='yes')loadGTM();else if(c!=='no')box.classList.add('show');
box.addEventListener('click',function(e){var b=e.target.closest('[data-consent]');if(!b)return;store('consent',b.dataset.consent);box.classList.remove('show');if(b.dataset.consent==='yes')loadGTM()});
var bs=d.querySelectorAll('.filters button'),cs=d.querySelectorAll('.pcard');
bs.forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.filter;bs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});cs.forEach(function(k){k.hidden=!(f==='todos'||k.dataset.cat===f)})})});
})();
