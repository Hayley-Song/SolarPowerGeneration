import { regionFromAddress } from '../src/utils/siteArea.js';
const BASE = 'https://api.vworld.kr';
const R = 6371008.8;
export function polygons(g) {
  return g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
}
export function geometryArea(g) {
  const rad = Math.PI / 180;
  function ringArea(ring) {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x,y] = ring[i], [nx,ny] = ring[(i+1)%ring.length];
      if (![x,y,nx,ny].every(Number.isFinite) || Math.abs(x)>180 || Math.abs(y)>90) throw new Error('공간정보 좌표계 오류');
      sum += (nx-x)*rad*(Math.sin(y*rad)+Math.sin(ny*rad));
    }
    return Math.abs(sum*R*R/2);
  }
  return polygons(g).reduce((total, poly) => total + Math.max(0,ringArea(poly[0]) - poly.slice(1).reduce((a,r)=>a+ringArea(r),0)),0);
}
function field(obj, key) { return Object.entries(obj || {}).find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1]; }
function pnuOf(f) { return String(field(f.properties,'pnu') ?? field(f.properties,'a1') ?? ''); }
function records(obj, predicate, out=[]) {
  if (obj && typeof obj === 'object') {
    if (predicate(obj)) out.push(obj);
    for (const v of Object.values(obj)) records(v,predicate,out);
  }
  return out;
}
function featureList(json) {
  const c = json?.response?.result?.featureCollection ?? json?.featureCollection ?? json;
  if (!Array.isArray(c?.features)) throw new Error('공간정보 응답 형식이 올바르지 않습니다.');
  return c.features;
}
function makeClient({key,domain,fetcher}) {
  return async (path, params) => {
    const url = new URL(path, BASE);
    Object.entries({...params,key,...(domain?{domain}:{})}).forEach(([k,v])=>url.searchParams.set(k,String(v)));
    const response = await fetcher(url,{signal:AbortSignal.timeout(9000),headers:domain?{Referer:domain}: {}});
    if (!response.ok) throw new Error(`브이월드 요청 실패 (HTTP ${response.status})`);
    let json;
    try { json = await response.json(); } catch { throw new Error('브이월드 응답을 읽을 수 없습니다. 인증키 및 API 사용 권한을 확인하세요.'); }
    const status = json?.response?.status;
    if (status && !['OK','NOT_FOUND'].includes(status)) throw new Error('브이월드 API 오류. 인증키·도메인·서비스 권한을 확인하세요.');
    if (json?.exceptions || json?.exception || json?.error || json?.ExceptionReport) throw new Error('브이월드 공간정보 API 오류');
    return json;
  };
}
export async function lookupSite(address, {key,domain,fetcher=fetch}={}) {
  if (!key) throw new Error('VWORLD_API_KEY 환경변수를 설정하세요.');
  const req = makeClient({key,domain,fetcher});
  let geo;
  for (const type of ['road','parcel']) {
    const j = await req('/req/address',{service:'address',request:'getcoord',version:'2.0',crs:'EPSG:4326',type,format:'json',address});
    if (j.response?.status === 'OK' && j.response.result?.point) {geo=j.response; break;}
  }
  if (!geo) throw new Error('주소를 찾지 못했습니다. 시·군·구와 도로명 건물번호 또는 지번까지 입력하세요.');
  const lon = Number(geo.result.point.x), lat = Number(geo.result.point.y);
  if (!(lon>=124 && lon<=132 && lat>=32 && lat<=39)) throw new Error('국내 주소 좌표를 확인할 수 없습니다.');
  const normalized = geo.refined?.text || address;
  const landJson = await req('/req/data',{service:'data',request:'GetFeature',version:'2.0',data:'LP_PA_CBND_BUBUN',geomFilter:`POINT(${lon} ${lat})`,crs:'EPSG:4326',geometry:true,attribute:true,size:10,format:'json'});
  if (landJson.response?.status==='NOT_FOUND') throw new Error('해당 좌표의 필지를 찾지 못했습니다. 지번주소로 다시 검색하세요.');
  const parcels = featureList(landJson).filter(f=>polygons(f.geometry).length && /^\d{19}$/.test(pnuOf(f)));
  if (!parcels.length) throw new Error('해당 좌표의 필지고유번호 또는 경계를 확인할 수 없습니다.');
  if (new Set(parcels.map(pnuOf)).size !== 1) throw new Error('여러 필지가 조회되었습니다. 지번주소로 다시 검색하세요.');
  const parcel=parcels[0], pnu=pnuOf(parcel);
  const warnings=[];
  const [official, buildings] = await Promise.allSettled([
    req('/ned/data/ladfrlList',{pnu,format:'json',numOfRows:10,pageNo:1}),
    req('/ned/wfs/getBldgisSpceWFS',{pnu,maxFeatures:1000,srsName:'EPSG:4326',output:'application/json'}),
  ]);
  let landArea=geometryArea(parcel.geometry), landSource='연속지적도 경계 계산(추정)';
  if (official.status==='fulfilled') {
    const row=records(official.value, o=>String(field(o,'pnu'))===pnu && Number(field(o,'lndpclAr'))>0)[0];
    if(row) {landArea=Number(field(row,'lndpclAr'));landSource='토지·임야대장 면적';}
  }
  if (landSource.includes('추정')) warnings.push('토지대장 면적을 확인하지 못해 지적도 경계로 추정했습니다.');
  let buildingArea=null, buildingGeometries=[], buildingStatus='error';
  if(buildings.status==='fulfilled') {
    try {
      const j=buildings.value;
      const fs=j.response?.status==='NOT_FOUND'?[]:featureList(j);
      if(fs.length>=1000 || Number(j.totalFeatures)>fs.length) throw new Error('건물 조회 결과가 잘렸습니다.');
      const unique=new Map();
      for (const f of fs) {
        if (!polygons(f.geometry).length) continue;
        const fp=pnuOf(f);
        if (/^\d{19}$/.test(fp) && fp!==pnu) continue;
        const a=geometryArea(f.geometry);
        if(a>0) unique.set(JSON.stringify(f.geometry),f.geometry);
      }
      buildingGeometries=[...unique.values()];
      buildingArea=buildingGeometries.reduce((a,g)=>a+geometryArea(g),0);
      buildingStatus=buildingArea>0?'ok':'empty';
      if(fs.length && !buildingGeometries.length) {buildingArea=null;buildingStatus='error';}
    } catch { buildingArea=null;buildingGeometries=[];buildingStatus='error'; }
  }
  if(buildingStatus==='error') warnings.push('건물 공간정보 조회 실패: 인증키의 GIS건물통합정보 권한 또는 서비스 상태를 확인하세요.');
  if(buildingStatus==='empty') warnings.push('해당 필지에 조회된 건물 경계가 없습니다. 실제 건물이 없다는 의미는 아닙니다.');
  const region=regionFromAddress(normalized,pnu);
  if(!region) warnings.push('지역 자동 매칭 불가: 지역을 직접 선택하세요.');
  return {address:normalized,pnu,lon,lat,region,landArea:Math.round(landArea*10)/10,landSource,buildingArea:buildingArea===null?null:Math.round(buildingArea*10)/10,buildingStatus,buildingGeometries,parcelGeometry:parcel.geometry,warnings};
}
export async function siteAreaResponse(method,body,env=process.env) {
  if(method!=='POST') return {status:405,body:{error:'POST 요청만 허용합니다.'}};
  const address=typeof body?.address==='string'?body.address.trim():'';
  if(address.length<5 || address.length>150) return {status:400,body:{error:'주소를 5~150자로 입력하세요.'}};
  try {return {status:200,body:await lookupSite(address,{key:env.VWORLD_API_KEY,domain:env.VWORLD_DOMAIN})};}
  catch(e){return {status:502,body:{error:e.name==='TimeoutError'?'공간정보 조회 시간이 초과되었습니다. 다시 시도하세요.':e.message.includes('fetch failed')?'공간정보 서버 연결에 실패했습니다.':e.message}};}
}
