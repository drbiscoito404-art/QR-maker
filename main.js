// QR Maker - script.js

const qrCode = new QRCodeStyling({
  width: 400,
  height: 400,
  data: "",
  image: undefined,
  dotsOptions: {color: "#0F172A", type: "rounded"},
  cornersSquareOptions: {type: "extra-rounded"},
  backgroundOptions: {color: "#ffffff"},
  margin: 10,
});

// mount
const preview = document.getElementById('qr-preview');
qrCode.append(preview);

// elements
const el = id => document.getElementById(id);
const typeEl = el('type');
const sizeEl = el('size');
const sizeVal = el('size-val');
const colorEl = el('color');
const bgcolorEl = el('bgcolor');
const dotStyleEl = el('dot-style');
const cornerStyleEl = el('corner-style');
const marginEl = el('margin');
const logoUrlEl = el('logo-url');
const logoFileEl = el('logo-file');
const logoSizeEl = el('logo-size');
const logoSizeVal = el('logo-size-val');
const showNameEl = el('show-name');
const displayNameEl = el('display-name');
const displayDescEl = el('display-desc');
const metaName = el('meta-name');
const metaType = el('meta-type');
const metaValue = el('meta-value');
const metaDesc = el('meta-desc');
const metaKey = el('meta-key');
const pixDescEl = el('pix-desc');

// update size display
sizeEl.addEventListener('input', ()=>{sizeVal.textContent = sizeEl.value});
logoSizeEl.addEventListener('input', ()=>{logoSizeVal.textContent = logoSizeEl.value});

// toggle fields by type
typeEl.addEventListener('change', updateFields);
function updateFields(){
  const val = typeEl.value;
  document.querySelectorAll('#fields .field-group').forEach(g=>{
    g.style.display = g.dataset.for === val ? 'block' : 'none';
  });
}
updateFields();

// handle file inputs (logo and image)
let uploadedLogoData = null;
logoFileEl.addEventListener('change', ev=>{
  const f = ev.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = () => { uploadedLogoData = r.result; logoUrlEl.value = ''; };
  r.readAsDataURL(f);
});

const imgFileEl = el('img-file');
let uploadedImageData = null;
if(imgFileEl){
  imgFileEl.addEventListener('change', ev=>{
    const f = ev.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => { uploadedImageData = r.result; el('img-url').value = ''; };
    r.readAsDataURL(f);
  });
}

// Generate button
el('generate').addEventListener('click', async ()=>{
  const content = buildContent();
  if(!content) return alert('Preencha os dados necessários.');

  // update QR options
  const size = parseInt(sizeEl.value,10);
  qrCode.update({width:size,height:size,margin:parseInt(marginEl.value,10)||0});

  qrCode.update({data: content});

  // dots
  const dotType = dotStyleEl.value === 'rounded' ? 'rounded' : 'square';
  qrCode.update({dotsOptions:{color: colorEl.value, type: dotType}});

  // corners
  const ctype = cornerStyleEl.value === 'extra-rounded' ? 'extra-rounded' : cornerStyleEl.value;
  qrCode.update({cornersSquareOptions:{type:ctype}});

  // background
  qrCode.update({backgroundOptions:{color: bgcolorEl.value}});

  // logo
  let logo = null;
  if(uploadedLogoData) logo = uploadedLogoData;
  else if(logoUrlEl.value) logo = logoUrlEl.value.trim();

  if(logo){
    qrCode.update({image:logo, imageOptions:{crossOrigin:"anonymous", margin:0, imageSize: parseInt(logoSizeEl.value,10)/100}});
  } else {
    qrCode.update({image:undefined});
  }

  // show meta
  if(showNameEl.checked){
    metaName.textContent = displayNameEl.value || '';
    metaDesc.textContent = displayDescEl.value || '';
  } else {
    metaName.textContent = '';
    metaDesc.textContent = '';
  }

  // type-specific meta display
  metaType.textContent = '';
  metaValue.textContent = '';
  if(typeEl.value === 'pix'){
    const key = el('pix-key').value || '';
    const desc = pixDescEl.value || '';
    const amount = el('pix-amount').value ? parseFloat(el('pix-amount').value).toFixed(2) : '';
    metaType.textContent = 'PIX';
    metaValue.textContent = amount ? `Valor: R$ ${amount}` : 'Valor não definido';
    metaKey.textContent = `Chave: ${key}`;
    if(desc){
      metaDesc.textContent = desc;
    }
  } else {
    metaKey.textContent = '';
  }

});

// Download buttons
el('download-png').addEventListener('click', ()=>{
  qrCode.download({extension: 'png'});
});
el('download-svg').addEventListener('click', ()=>{
  qrCode.download({extension: 'svg'});
});

el('reset').addEventListener('click', ()=>{
  location.reload();
});

function buildContent(){
  const t = typeEl.value;
  if(t === 'link'){
    const u = el('link-url').value.trim();
    if(!u) return null;
    return u;
  }
  if(t === 'pix'){
    const key = el('pix-key').value.trim();
    if(!key) return null;
    const keyType = el('pix-key-type').value;
    const name = (el('pix-name').value || 'PIX').toUpperCase();
    const city = (el('pix-city').value || 'BRASILIA').toUpperCase();
    const desc = (el('pix-desc').value || '').toUpperCase();
    const amount = el('pix-amount').value ? parseFloat(el('pix-amount').value).toFixed(2) : null;
    const txid = el('pix-txid').value || '';
    return generatePix({key, keyType, name, city, desc, amount, txid});
  }
  if(t === 'wifi'){
    const ssid = el('wifi-ssid').value || '';
    const pass = el('wifi-pass').value || '';
    const auth = el('wifi-auth').value || 'WPA';
    const hidden = el('wifi-hidden').checked ? 'true' : '';
    return `WIFI:T:${auth};S:${escapeSemi(ssid)};P:${escapeSemi(pass)};H:${hidden};;`;
  }
  if(t === 'contact'){
    const n = el('contact-name').value || '';
    const org = el('contact-org').value || '';
    const tel = el('contact-tel').value || '';
    const email = el('contact-email').value || '';
    const url = el('contact-url').value || '';
    // basic vCard
    const v = `BEGIN:VCARD\nVERSION:3.0\nN:${n}\nORG:${org}\nTEL:${tel}\nEMAIL:${email}\nURL:${url}\nEND:VCARD`;
    return v;
  }
  if(t === 'text'){
    return el('text-content').value || '';
  }
  if(t === 'image'){
    const url = el('img-url').value.trim();
    if(url) return url;
    if(uploadedImageData) return uploadedImageData;
    return null;
  }
  return null;
}

function escapeSemi(s){ return String(s).replace(/;/g,'\\;'); }

// PIX generator (EMV standard) - simplified builder
function generatePix({key, keyType='', name='PIX', city='-', desc='', amount=null, txid=''}){
  // helper to TLV encode
  function tlv(id, value){
    const v = String(value);
    const len = String(v.length).padStart(2,'0');
    return id + len + v;
  }

  // Payload format
  let payload = '';
  payload += tlv('00','01'); // payload format indicator
  payload += tlv('26', buildMerchantAccount());
  payload += tlv('52','0000'); // merchant category
  payload += tlv('53','986'); // BRL
  if(amount) payload += tlv('54', amount);
  payload += tlv('58','BR');
  payload += tlv('59', pad(name,25));
  payload += tlv('60', pad(city,15));

  if(txid){
    payload += tlv('62', tlv('05', txid));
  }

  payload += '6304'; // CRC field (will be appended)
  const crc = crc16(payload);
  payload += crc;
  return payload;

  function buildMerchantAccount(){
    // ID 00 - GUI
    let v = '';
    v += tlv('00','BR.GOV.BCB.PIX');
    // ID 01 - chave
    v += tlv('01', key);
    // ID 02 - descrição da transação (opcional)
    if(desc) v += tlv('02', pad(desc,25));
    return v;
  }

  function pad(s, n){
    const str = String(s||'');
    return str.substring(0,n);
  }
}

// CRC16-CCITT (0x1021)
function crc16(input){
  const buf = new TextEncoder().encode(input);
  let crc = 0xFFFF;
  for(let i=0;i<buf.length;i++){
    crc ^= (buf[i] << 8);
    for(let j=0;j<8;j++){
      if(crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}

// initial generate for default
setTimeout(()=>{ if(el('generate')) el('generate').click(); }, 300);
