import QRCode from './qr/index.js';
import QRErrorCorrectLevel from './qr/QRErrorCorrectLevel.js';
export function qrMatrix(url) {
  // Trial URLs consist of ASCII host/path and base64url tokens. No external service.
  if (typeof url !== 'string' || !/^https:\/\/[\x21-\x7e]+$/.test(url) || url.length > 1024) throw new Error('QR 코드로 변환할 수 없는 주소입니다.');
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(url);
  qr.make();
  return Array.from({length:qr.getModuleCount()},(_,row)=>Array.from({length:qr.getModuleCount()},(_,col)=>qr.isDark(row,col)));
}
export function renderQr(canvas,url) {
  const modules=qrMatrix(url), quiet=4, scale=8, size=(modules.length+quiet*2)*scale;
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('QR 코드 생성에 실패했습니다.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.fillStyle='#000';
  modules.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)ctx.fillRect((x+quiet)*scale,(y+quiet)*scale,scale,scale);}));
}
