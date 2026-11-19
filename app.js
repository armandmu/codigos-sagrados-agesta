(()=>{'use strict';
const source=window.CS_CATALOGO||{registros:[]};
const items=source.registros||[];
const pages=window.CS_PAGINAS||[];
const perPage=24;
const storageKey='agesta-biblioteca-v1';
let state={favorites:[],progress:{},lastId:null};
try{const raw=localStorage.getItem(storageKey);if(raw){const read=JSON.parse(raw);state={favorites:Array.isArray(read.favorites)?read.favorites:[],progress:read.progress&&typeof read.progress==='object'?read.progress:{},lastId:read.lastId||null};}}catch(e){}
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const norm=t=>String(t??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const escapeHTML=t=>String(t??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const safeFilePage=n=>Number.isInteger(+n)&&+n>=1&&+n<=115?+n:1;
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(e){}};
const codesDisplay=(codes,klass='')=>codes.length?codes.map(c=>`<span>${escapeHTML(c)}</span>`).join('<span class="sep">·</span>'):`<span class="card-no-number">Texto explicativo</span>`;
const catalogNorm=items.map(it=>({...it,_index:norm([it.titulo,it.descripcion,it.codigos.join(' ')].join(' '))}));
let visibleItems=[];let pagination=1;let selectedId=state.lastId&&items.some(x=>x.id===state.lastId)?state.lastId:null;let activeView='explorar';

function switchView(view,scroll=true){
  activeView=['explorar','contador','fuente'].includes(view)?view:'explorar';
  $$('.view').forEach(el=>el.classList.toggle('is-visible',el.id===activeView));
  $$('.nav-link').forEach(btn=>{const on=btn.dataset.view===activeView;btn.classList.toggle('active',on);btn.setAttribute('aria-current',on?'page':'false');});
  if(activeView==='contador')renderPractice();
  if(activeView==='fuente')renderSourcePage();
  if(scroll)window.scrollTo({top:0,behavior:'instant'});
  try{if(location.hash!=='#vista-'+activeView)history.replaceState(null,'','#vista-'+activeView);}catch(e){}
}
function refreshCatalog(reset=true){
  if(reset)pagination=1;
  const q=norm($('#search').value),parts=q.split(/\s+/).filter(Boolean),filter=$('#filter').value,sort=$('#sort').value;
  $('#clear-search').hidden=!q;
  visibleItems=catalogNorm.filter(it=>{
    if(filter==='codigos'&&!it.codigos.length)return false;
    if(filter==='notas'&&it.codigos.length)return false;
    if(filter==='favoritos'&&!state.favorites.includes(it.id))return false;
    return parts.every(term=>it._index.includes(term));
  });
  if(sort==='az')visibleItems.sort((a,b)=>a.titulo.localeCompare(b.titulo,'es',{sensitivity:'base'}));
  if(sort==='codigo')visibleItems.sort((a,b)=>(a.codigos[0]||'zzzzzzzzzz').localeCompare(b.codigos[0]||'zzzzzzzzzz',undefined,{numeric:true}));
  renderCards();
}
function renderCards(){
  const total=visibleItems.length,totalPages=Math.max(1,Math.ceil(total/perPage));pagination=Math.max(1,Math.min(pagination,totalPages));
  $('#result-count').textContent=`${total.toLocaleString('es-ES')} ${total===1?'resultado':'resultados'}${$('#search').value?' para tu búsqueda':''}`;
  const cardHTML=visibleItems.slice((pagination-1)*perPage,pagination*perPage).map(it=>{
    const fav=state.favorites.includes(it.id),hasExtra=it.descripcion.length>250;
    const short=hasExtra?it.descripcion.slice(0,220).trim().replace(/\s+\S*$/,'')+'…':it.descripcion;
    const desc=hasExtra?`<span>${escapeHTML(short)}</span><details><summary>Leer descripción completa</summary><p>${escapeHTML(it.descripcion)}</p></details>`:`${escapeHTML(short)}`;
    return `<article class="result-card" data-id="${escapeHTML(it.id)}"><div class="card-top"><div class="card-number">${codesDisplay(it.codigos)}</div><button type="button" class="favorite-button ${fav?'is-favorite':''}" data-fav="${escapeHTML(it.id)}" aria-label="${fav?'Quitar de favoritos':'Añadir a favoritos'}" title="${fav?'Quitar de favoritos':'Guardar favorito'}">${fav?'★':'☆'}</button></div><h3 class="card-title">${escapeHTML(it.titulo||it.descripcion.slice(0,85))}</h3><div class="card-description">${desc}</div><div class="card-bottom"><a class="source-link" href="fuente.pdf#page=${safeFilePage(it.pagina)}" target="_blank" rel="noopener">PDF · pág. ${it.pagina} ↗</a>${it.codigos.length?`<button type="button" class="open-counter" data-practice="${escapeHTML(it.id)}">✧ &nbsp;Abrir rosario</button>`:`<button type="button" class="open-counter" data-read="${it.pagina}">Leer página</button>`}</div></article>`;
  }).join('');
  $('#results').innerHTML=cardHTML;
  $('#empty').hidden=!!total;
  $('#page-info').textContent=total?`Página ${pagination} de ${totalPages}`:'';
  $('#previous').disabled=pagination<=1;
  $('#next').disabled=pagination>=totalPages;
}
function setFavorites(id){
  if(state.favorites.includes(id))state.favorites=state.favorites.filter(x=>x!==id);
  else state.favorites.push(id);
  save();
  if($('#filter').value==='favoritos')refreshCatalog(false);
  else{
    const btn=$(`[data-fav="${id}"]`);
    if(btn){const fav=state.favorites.includes(id);btn.classList.toggle('is-favorite',fav);btn.textContent=fav?'★':'☆';btn.setAttribute('aria-label',fav?'Quitar de favoritos':'Añadir a favoritos');btn.title=fav?'Quitar de favoritos':'Guardar favorito';}
  }
}
function selectCode(id){
  if(!items.some(x=>x.id===id))return;
  selectedId=id;state.lastId=id;save();switchView('contador');
}
function currentEntry(){return items.find(x=>x.id===selectedId);}
function currentCount(){return selectedId?Math.max(0,Math.min(45,Math.floor(Number(state.progress[selectedId])||0))):0;}
function setCount(number){if(!selectedId)return;state.progress[selectedId]=Math.max(0,Math.min(45,Math.floor(number)));save();updateBeads();}
function buildBeads(){const container=$('#beads');if(container.childElementCount)return;
  for(let i=0;i<45;i++){
    const b=document.createElement('button');b.type='button';b.className='bead';b.dataset.bead=String(i+1);
    const deg=(-90+(i/45)*360)*Math.PI/180;
    const x=50+40.5*Math.cos(deg),y=50+40.5*Math.sin(deg);
    b.style.left=x+'%';b.style.top=y+'%';b.title=`Repetición ${i+1}`;b.setAttribute('aria-label',`Marcar hasta la repetición ${i+1}`);b.textContent=String(i+1);container.append(b);
  }
}
function updateBeads(){const count=currentCount();$('#count').textContent=count;
  $('#rosary-status').textContent=count===45?'45 de 45 · Sesión completa':count===0?'Preparado para empezar':'A tu ritmo';
  $$('.bead').forEach((bead,i)=>{const done=i<count;bead.classList.toggle('done',done);bead.classList.toggle('current',i===count&&count<45);bead.setAttribute('aria-pressed',done?'true':'false');});
  $('#increment').disabled=count===45;$('#increment').style.opacity=count===45?'.55':'1';
  $('#increment').querySelector('span:first-child').textContent=count===45?'Sesión completada':'Marcar una repetición';
  $('#decrement').disabled=count===0;
}
function renderPractice(){const item=currentEntry();
  $('#no-selection').hidden=!!item;$('#practice-content').hidden=!item;if(!item)return;
  $('#selected-title').textContent=item.titulo||item.descripcion.slice(0,80);
  $('#selected-code').innerHTML=codesDisplay(item.codigos);
  $('#selected-description').textContent=item.descripcion===item.titulo?'':item.descripcion;
  $('#multi-hint').hidden=item.codigos.length<=1;
  buildBeads();updateBeads();
}
function openPage(n){const id=String(safeFilePage(n));$('#source-page').value=id;switchView('fuente');}
function renderSourcePage(){const n=safeFilePage($('#source-page').value||2);const p=pages.find(x=>x.pagina===n);
  $('#source-text').innerHTML=`<h2>Transcripción · página ${n}</h2><pre>${escapeHTML(p?.texto||'No hay texto transcrito en esta página.')}</pre>`;
  $('#open-pdf-page').onclick=()=>window.open(`fuente.pdf#page=${n}`,'_blank','noopener');
}

$('#number-coded').textContent=items.filter(x=>x.codigos.length).length.toLocaleString('es-ES');
$$('[data-view]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.view)));
$('#search').addEventListener('input',()=>refreshCatalog());
$('#clear-search').addEventListener('click',()=>{$('#search').value='';refreshCatalog();$('#search').focus();});
$$('[data-query]').forEach(el=>el.addEventListener('click',()=>{$('#search').value=el.dataset.query;$('#filter').value='todos';refreshCatalog();$('#search').focus();}));
$('#filter').addEventListener('change',()=>refreshCatalog());
$('#sort').addEventListener('change',()=>refreshCatalog());
$('#results').addEventListener('click',e=>{const f=e.target.closest('[data-fav]');if(f){setFavorites(f.dataset.fav);return;}
const p=e.target.closest('[data-practice]');if(p){selectCode(p.dataset.practice);return;}
const r=e.target.closest('[data-read]');if(r)openPage(r.dataset.read);});
$('#previous').addEventListener('click',()=>{if(pagination>1){pagination--;renderCards();$('#catalog-title').scrollIntoView({block:'start'});}});
$('#next').addEventListener('click',()=>{if(pagination<Math.ceil(visibleItems.length/perPage)){pagination++;renderCards();$('#catalog-title').scrollIntoView({block:'start'});}});
$('#increment').addEventListener('click',()=>setCount(currentCount()+1));
$('#decrement').addEventListener('click',()=>setCount(currentCount()-1));
$('#reset').addEventListener('click',()=>{if(currentCount()===0||confirm('¿Quieres reiniciar las 45 cuentas de este código?'))setCount(0);});
$('#beads').addEventListener('click',e=>{const b=e.target.closest('[data-bead]');if(b)setCount(Number(b.dataset.bead));});
$('#choose-code').addEventListener('click',()=>switchView('explorar'));
$('#change-code').addEventListener('click',()=>{switchView('explorar');$('#search').focus();});
window.addEventListener('keydown',e=>{if(activeView!=='contador'||!selectedId||e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
const tag=e.target.tagName.toLowerCase();if(['input','textarea','select','button','a','summary'].includes(tag)||e.target.isContentEditable)return;
if(e.code==='Space'){e.preventDefault();setCount(currentCount()+1);}
});
for(let n=2;n<=114;n++){const opt=document.createElement('option');opt.value=String(n);opt.textContent='Página '+n;$('#source-page').append(opt);}
$('#source-page').value='2';$('#source-page').addEventListener('change',renderSourcePage);
refreshCatalog();switchView(location.hash.slice(1).replace(/^vista-/,'')||'explorar',false);
window.addEventListener('hashchange',()=>switchView(location.hash.slice(1).replace(/^vista-/,'')||'explorar',false));
})();
