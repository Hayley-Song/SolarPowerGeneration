import React, { useState } from 'react';
import { AREA_PER_KW, TYPE_LABEL, estimateCapacity } from '../utils/siteArea.js';
const fmt = v => Number.isFinite(v) ? v.toLocaleString('ko-KR',{maximumFractionDigits:1})+' ㎡' : '조회 불가';
const polys = g => g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
const project = ([lon,lat],z) => { const n=256*2**z, r=lat*Math.PI/180; return [(lon+180)/360*n,(1-Math.asinh(Math.tan(r))/Math.PI)/2*n]; };
function SiteMap({site,selected}) {
  const [failed,setFailed]=useState(false);
  const key=import.meta.env.VITE_VWORLD_MAP_KEY;
  const w=320,h=230;
  const all=[site.parcelGeometry,...site.buildingGeometries].flatMap(g=>polys(g).flat(1).flat(1));
  let z=19,cx,cy;
  for(;z>=6;z--) {
    const pts=[[site.lon,site.lat],...all].map(p=>project(p,z));
    const [minX,minY,maxX,maxY]=pts.reduce(([a,b,c,d],[x,y])=>[Math.min(a,x),Math.min(b,y),Math.max(c,x),Math.max(d,y)],[Infinity,Infinity,-Infinity,-Infinity]);
    cx=(minX+maxX)/2;cy=(minY+maxY)/2;
    if(z===6 || (maxX-minX<w-44 && maxY-minY<h-44)) break;
  }
  const left=cx-w/2,top=cy-h/2;
  const pos=p=>{const [x,y]=project(p,z);return [x-left,y-top];};
  const tiles=[];
  for(let x=Math.floor(left/256);x<=Math.floor((left+w)/256);x++) for(let y=Math.floor(top/256);y<=Math.floor((top+h)/256);y++) tiles.push({x,y});
  const path=g=>polys(g).map(poly=>poly.map(r=>r.map((p,i)=>`${i?'L':'M'}${pos(p).join(' ')}`).join(' ')+' Z').join(' ')).join(' ');
  const [px,py]=pos([site.lon,site.lat]);
  return <div>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="조회 필지 및 건물 위치 지도" className="w-full rounded-lg bg-stone-200 overflow-hidden" style={{display:'block'}}>
      <rect width={w} height={h} fill="#e7e5e4"/>
      {key&&!failed&&tiles.map(({x,y})=><image key={`${x}/${y}`} href={`https://api.vworld.kr/req/wmts/1.0.0/${encodeURIComponent(key)}/Satellite/${z}/${y}/${x}.jpeg`} x={x*256-left} y={y*256-top} width="256" height="256" onError={()=>setFailed(true)}/>)}
      <path d={path(site.parcelGeometry)} fill={selected==='land'?'#fbbf2455':'#fbbf2420'} stroke="#fbbf24" strokeWidth="2.5" fillRule="evenodd"/>
      {site.buildingGeometries.map((g,i)=><path key={i} d={path(g)} fill={selected==='roof'?'#38bdf877':'#38bdf833'} stroke="#38bdf8" strokeWidth="2" fillRule="evenodd"/>)}
      <circle cx={px} cy={py} r="5" fill="#dc2626" stroke="white" strokeWidth="2"/>
      <rect x="0" y={h-18} width={w} height="18" fill="#0009"/><text x="6" y={h-5} fontSize="10" fill="white">© 국토교통부 · VWorld</text>
    </svg>
    {(!key||failed)&&<p className="text-xs text-amber-800 mt-1">{!key?'지도 인증키 미설정: 경계만 표시합니다.':'항공사진을 불러오지 못해 경계만 표시합니다.'}</p>}
    <p className="text-[11px] text-stone-600 mt-1">노란색: 필지 경계 · 하늘색: 건물 경계 · 빨간 점: 검색 위치</p>
  </div>;
}
export default function SiteAreaLookup({onApply}) {
  const [address,setAddress]=useState('');
  const [site,setSite]=useState(null);
  const [selected,setSelected]=useState('');
  const [ratios,setRatios]=useState(AREA_PER_KW);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [applied,setApplied]=useState('');
  const area=selected==='land'?site?.landArea:selected==='roof'?site?.buildingArea:null;
  const capacity=estimateCapacity(area,Number(ratios[selected]));
  async function search(e) {
    e.preventDefault();if(busy||!address.trim())return;
    setBusy(true);setError('');setSite(null);setSelected('');setApplied('');
    try {
      const token = /^\/trial\/([A-Za-z0-9_-]{43})\/?$/.exec(window.location.pathname)?.[1];
      const headers={'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})};
      const response=await fetch('/api/site-area',{method:'POST',headers,body:JSON.stringify({address:address.trim()})});
      let result;try{result=await response.json();}catch{throw new Error('주소 조회 API에 연결되지 않았습니다. 개발 서버 또는 Vercel 배포를 확인하세요.');}
      if(!response.ok)throw new Error(result.error||'조회 실패');
      setSite(result);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  function apply() {
    if(!site||!selected||capacity<1||!site.region)return;
    onApply({capacity,region:site.region,installType:TYPE_LABEL[selected]});
    setApplied(`${capacity.toLocaleString()}kW · ${site.region} · ${TYPE_LABEL[selected]} 적용 완료`);
  }
  return <div id="site-area-panel" className="border border-stone-200 rounded-xl bg-stone-50 p-3 space-y-3">
    <form onSubmit={search} className="space-y-2">
      <label htmlFor="site-address" className="block text-xs font-bold text-mainText">설치 예정 주소</label>
      <div className="flex gap-1.5">
        <input id="site-address" value={address} onChange={e=>{setAddress(e.target.value);setSite(null);setSelected('');setApplied('');setError('');}} placeholder="도로명 또는 지번주소" disabled={busy} required maxLength={150} className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm"/>
        <button type="submit" disabled={busy||!address.trim()} className="shrink-0 rounded-lg bg-primary text-white text-xs font-bold px-3 disabled:opacity-50">{busy?'조회 중':'조회'}</button>
      </div>
    </form>
    {busy&&<p role="status" className="text-xs text-stone-600">주소·토지·건물 정보를 조회하고 있습니다.</p>}
    {error&&<p role="alert" className="text-xs text-red-700 break-keep">{error}</p>}
    {site&&<>
      <p className="text-xs font-semibold break-words">{site.address}</p>
      <SiteMap key={site.pnu} site={site} selected={selected}/>
      <h3 className="text-xs font-bold">조회 결과</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border rounded-lg p-2 min-w-0"><div className="text-[11px] text-stone-600">토지 면적</div><div className="font-bold text-sm break-words">{fmt(site.landArea)}</div><div className="text-[10px] text-stone-500">{site.landSource}</div></div>
        <div className="bg-white border rounded-lg p-2 min-w-0"><div className="text-[11px] text-stone-600">건물 면적 (추정)</div><div className="font-bold text-sm break-words">{site.buildingStatus==='empty'?'조회된 건물 없음':fmt(site.buildingArea)}</div><div className="text-[10px] text-stone-500">건물 수평투영면적 합계</div></div>
      </div>
      <fieldset className="space-y-2"><legend className="text-xs font-bold mb-1">사용 면적 선택</legend>
        {[['land','토지 면적',site.landArea],['roof','건물 면적',site.buildingArea]].map(([type,label,value])=><label key={type} className={`flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer ${selected===type?'border-primary bg-white':'bg-white'} ${!(value>0)?'opacity-50':''}`}><input type="radio" name="site-area-type" checked={selected===type} disabled={!(value>0)} onChange={()=>{setSelected(type);setApplied('');}} className="accent-primary"/><span className="flex-1">{label}</span><span className="font-semibold">{fmt(value)}</span></label>)}
      </fieldset>
      {selected&&<div className="space-y-2 bg-white p-2 rounded-lg border">
        <label className="flex items-center justify-between gap-2 text-xs">1kW당 필요 면적(㎡)<input type="number" min="1" max="1000" step="0.1" value={ratios[selected]} onChange={e=>{setRatios({...ratios,[selected]:e.target.value});setApplied('');}} className="w-20 border rounded px-2 py-1 text-right"/></label>
        <div className="flex justify-between text-xs"><span>예상 설비 용량</span><strong>{capacity.toLocaleString()} kW</strong></div>
        <p className="text-[11px] text-stone-500">{site.region||'지역 확인 필요'} · {TYPE_LABEL[selected]} / 면적 ÷ 필요 면적, 소수점 이하 버림</p>
        <button type="button" disabled={!capacity||!site.region} onClick={apply} className="w-full rounded-lg bg-primary text-white py-2 text-xs font-bold disabled:opacity-50">변수에 적용</button>
        {applied&&<p role="status" className="text-xs text-green-700">{applied}</p>}
      </div>}
      {site.warnings.map(w=><p key={w} className="text-[11px] text-amber-800 break-keep">{w}</p>)}
      <p className="text-[11px] text-stone-500 leading-relaxed break-keep">건물 면적은 실제 지붕·옥상 유효면적이 아닌 건물 외곽의 수평투영면적입니다. 기본 면적 환산 기준은 단순 추정용이며 음영, 이격거리, 구조안전 및 인허가 조건은 반영하지 않습니다.</p>
    </>}
  </div>;
}
