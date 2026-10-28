(function(){'use strict';var d=document,w=window;w.dataLayer=w.dataLayer||[];
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
var burger=d.querySelector('.burger'),nav=d.getElementById('nav');
burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false')});
nav.addEventListener('click',function(e){if(e.target.closest('a')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false')}});
d.addEventListener('click',function(e){var a=e.target.closest('a[data-wa]');if(a)w.dataLayer.push({event:'whatsapp_click',section:a.dataset.wa,pagina:location.pathname})});
var box=d.getElementById('consent');
function loadGTM(){if(w.__gtm)return;w.__gtm=1;w.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=GTM-5H2NS7RF';d.head.appendChild(s)}
var c=store('consent');if(c==='yes')loadGTM();else if(c!=='no')box.classList.add('show');
box.addEventListener('click',function(e){var b=e.target.closest('[data-consent]');if(!b)return;store('consent',b.dataset.consent);box.classList.remove('show');if(b.dataset.consent==='yes')loadGTM()});
var bs=d.querySelectorAll('.filters button'),cs=d.querySelectorAll('.pcard');
bs.forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.filter;bs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});cs.forEach(function(k){k.hidden=!(f==='todos'||k.dataset.cat===f)})})});
})();
