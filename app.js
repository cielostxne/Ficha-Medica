// ====== Teclado y pegado seguros ======
const CTRL_KEYS = new Set(['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End']);
function allowOnlyLettersSpaces(e){ const k=e.key; if(CTRL_KEYS.has(k)||e.ctrlKey||e.metaKey) return; if(/^[a-zA-ZÀ-ÿ\s]$/.test(k)) return; e.preventDefault(); }
function allowOnlyDigits(e){ const k=e.key; if(CTRL_KEYS.has(k)||e.ctrlKey||e.metaKey) return; if(/^\d$/.test(k)) return; e.preventDefault(); }
function sanitizeLettersSpaces(el){ el.value=(el.value||'').replace(/[^a-zA-ZÀ-ÿ\s]/g,''); }
function sanitizeDigits(el){ el.value=(el.value||'').replace(/\D/g,''); }
function pasteLettersSpaces(e){ e.preventDefault(); const t=(e.clipboardData||window.clipboardData).getData('text').replace(/[^a-zA-ZÀ-ÿ\s]/g,''); document.execCommand('insertText', false, t); }
function pasteDigits(e){ e.preventDefault(); const t=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,''); document.execCommand('insertText', false, t); }

// ===== Utilidades RUT (Chile) =====
const cleanRut = (rut) => (rut || '').toString().replace(/[^\dkK]/gi, '').toUpperCase();
function dvModulo11(numStr){let sum=0,mul=2;for(let i=numStr.length-1;i>=0;i--){sum+=parseInt(numStr[i],10)*mul;mul=mul===7?2:mul+1;}const res=11-(sum%11);return res===11?'0':res===10?'K':String(res);}
function validarRutValor(rutInput){const clean=cleanRut(rutInput);if(clean.length<2)return false;const body=clean.slice(0,-1);const dv=clean.slice(-1);if(!/^\d+$/.test(body))return false;return dvModulo11(body)===dv;}
function formatRut(rut){const clean=cleanRut(rut);if(clean.length<2)return rut;const body=clean.slice(0,-1);const dv=clean.slice(-1);const withDots=body.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${withDots}-${dv}`;}

// ===== Email estricto =====
function validarEmailValor(email){
  if(!email||typeof email!=='string') return false;
  if(email.includes(',')) return false;
  if(/\s/.test(email)) return false;
  if(email.split('@').length!==2) return false;
  if(email.includes('..')) return false;
  const base=/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
  if(!base.test(email)) return false;
  const [,dom]=email.split('@');
  const tld=dom.split('.').pop();
  return /^[A-Za-z]{2,}$/.test(tld);
}

// ===== Persistencia =====
function getStore(){ try{return JSON.parse(localStorage.getItem('pacientes')||'{}');}catch{return{};} }
function setStore(data){ localStorage.setItem('pacientes', JSON.stringify(data)); }

// ===== UI de error =====
function setError(inputEl,msgText){ const err=document.getElementById(`err-${inputEl.id}`); if(err) err.textContent=msgText||''; inputEl.classList.remove('valid'); if(msgText) inputEl.classList.add('invalid'); else inputEl.classList.remove('invalid'); }
function setValid(inputEl){ const err=document.getElementById(`err-${inputEl.id}`); if(err) err.textContent=''; inputEl.classList.remove('invalid'); inputEl.classList.add('valid'); }
function requiredValidator(inputEl){ if(!inputEl.value||String(inputEl.value).trim()===''){ setError(inputEl,'Campo obligatorio.'); return false; } return true; }

// ===== Validadores =====
const validators={
  rut:(el)=>{ if(!requiredValidator(el)) return false; el.value=formatRut(el.value); if(!validarRutValor(el.value)){ setError(el,'RUT inválido. Ej: 12.345.678-5'); return false; } setValid(el); return true; },
  nombres:(el)=>{ if(!requiredValidator(el)) return false; if(!/^[a-zA-ZÀ-ÿ\s]+$/.test(el.value)){ setError(el,'Solo letras y espacios.'); return false; } setValid(el); return true; },
  apellidos:(el)=>{ if(!requiredValidator(el)) return false; if(!/^[a-zA-ZÀ-ÿ\s]+$/.test(el.value)){ setError(el,'Solo letras y espacios.'); return false; } setValid(el); return true; },
  direccion:(el)=>{ if(!requiredValidator(el)) return false; setValid(el); return true; },
  ciudad:(el)=>{ if(!requiredValidator(el)) return false; if(!/^[a-zA-ZÀ-ÿ\s]+$/.test(el.value)){ setError(el,'Solo letras y espacios.'); return false; } setValid(el); return true; },
  telefono:(el)=>{ if(!requiredValidator(el)) return false; el.value=(el.value||'').replace(/\D/g,''); if(el.value.length<8){ setError(el,'Debe tener al menos 8 dígitos.'); return false; } setValid(el); return true; },
  email:(el)=>{ if(!requiredValidator(el)) return false; if(!validarEmailValor(el.value)){ setError(el,'Email inválido. Ej: nombre@dominio.com'); return false; } setValid(el); return true; },
  fechaNacimiento:(el)=>{ if(!requiredValidator(el)) return false; const hoy=new Date(); hoy.setHours(0,0,0,0); const f=new Date(el.value); if(f>hoy){ setError(el,'La fecha no puede ser futura.'); return false; } setValid(el); return true; },
  estadoCivil:(el)=>{ if(!el.value){ setError(el,'Selecciona una opción.'); return false; } setValid(el); return true; },
  comentarios:(el)=>{ setValid(el); return true; }
};

// ===== Búsqueda =====
function renderResultados(items){
  const tbody=document.querySelector('#resultados tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  if(!items.length){ tbody.innerHTML='<tr><td colspan="6">No hay resultados</td></tr>'; return; }
  for(const p of items){
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.rut}</td><td>${p.nombres}</td><td>${p.apellidos}</td><td>${p.ciudad}</td><td>${p.telefono}</td><td>${p.email}</td>`;
    tbody.appendChild(tr);
  }
}
function getByApellido(q){
  const store=getStore();
  const t=(q||'').toLowerCase();
  return Object.values(store).filter(p=>(p.apellidos||'').toLowerCase().includes(t));
}
function upsertPaciente(p){
  const store=getStore();
  const key=cleanRut(p.rut);
  const exists=!!store[key];
  store[key]={...p,rut:formatRut(p.rut),key,updatedAt:new Date().toISOString()};
  setStore(store);
  return exists;
}

// ===== Inicio =====
document.addEventListener('DOMContentLoaded',()=>{
  // 1) Bloqueo de teclas + pegado y sanitización
  const nombres=document.getElementById('nombres');
  const apellidos=document.getElementById('apellidos');
  const ciudad=document.getElementById('ciudad');
  const telefono=document.getElementById('telefono');

  [nombres,apellidos,ciudad].forEach(el=>{
    if(!el) return;
    el.addEventListener('keydown',allowOnlyLettersSpaces);
    el.addEventListener('paste',pasteLettersSpaces);
    el.addEventListener('input',()=>sanitizeLettersSpaces(el));
  });
  if(telefono){
    telefono.addEventListener('keydown',allowOnlyDigits);
    telefono.addEventListener('paste',pasteDigits);
    telefono.addEventListener('input',()=>sanitizeDigits(telefono));
  }

  // 2) Validación inline
  const ids=['rut','nombres','apellidos','direccion','ciudad','telefono','email','fechaNacimiento','estadoCivil','comentarios'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    const run=()=>validators[id]?.(el);
    el.addEventListener('input',run);
    el.addEventListener('blur',run);
  });

  // 3) Buscar
  const buscar=document.getElementById('buscarApellido');
  if(buscar) buscar.addEventListener('input',e=>renderResultados(getByApellido(e.target.value)));
  renderResultados(getByApellido(''));

  // 4) Guardar
  const btnGuardar=document.getElementById('btnGuardar');
  const msg=document.getElementById('msg');
  btnGuardar?.addEventListener('click',()=>{
    msg.className='msg'; msg.textContent='';
    let ok=true;
    ['rut','nombres','apellidos','direccion','ciudad','telefono','email','fechaNacimiento','estadoCivil']
      .forEach(id=>{ if(!validators[id](document.getElementById(id))) ok=false; });
    if(!ok){ msg.textContent='Revisa los campos marcados en rojo.'; msg.classList.add('error'); return; }

    const data={
      rut:document.getElementById('rut').value,
      nombres:document.getElementById('nombres').value,
      apellidos:document.getElementById('apellidos').value,
      direccion:document.getElementById('direccion').value,
      ciudad:document.getElementById('ciudad').value,
      telefono:document.getElementById('telefono').value,
      email:document.getElementById('email').value,
      fechaNacimiento:document.getElementById('fechaNacimiento').value,
      estadoCivil:document.getElementById('estadoCivil').value,
      comentarios:document.getElementById('comentarios').value
    };

    const key=cleanRut(data.rut);
    const exists=!!getStore()[key];
    if(exists){
      const confirmar=confirm('El RUT ya existe. ¿Deseas sobrescribir el registro?');
      if(!confirmar){ msg.textContent='No se modificó el registro.'; return; }
    }
    const wasExisting=upsertPaciente(data);
    msg.textContent=wasExisting?'Registro actualizado correctamente.':'Registro guardado correctamente.';
    msg.classList.add('ok');

    const q=buscar?.value||'';
    renderResultados(getByApellido(q));
  });

  // 5) Modal cerrar/reabrir
  const app=document.getElementById('app');
  const closed=document.getElementById('closed');
  closed?.setAttribute('hidden','');
  document.getElementById('btnCerrar')?.addEventListener('click',()=>{
    app?.setAttribute('hidden','');
    closed?.removeAttribute('hidden');
  });
  document.getElementById('reabrir')?.addEventListener('click',()=>{
    closed?.setAttribute('hidden','');
    app?.removeAttribute('hidden');
  });
});
