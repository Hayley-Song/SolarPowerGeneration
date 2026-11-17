import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupSite, geometryArea, siteAreaResponse } from '../server/siteArea.js';
import { estimateCapacity,regionFromAddress } from '../src/utils/siteArea.js';
const polygon=(x,y,d)=>({type:'Polygon',coordinates:[[[x,y],[x+d,y],[x+d,y+d],[x,y+d],[x,y]]]});
const parcel=polygon(128.6,35.8,.001),building=polygon(128.6002,35.8002,.0001), pnu='2711010100100010000';
const fixture=(buildingError=false)=>async url=>{
  const path=url.pathname;
  const data=path==='/req/address'?{response:{status:'OK',refined:{text:'대구광역시 중구 예시동 1'},result:{point:{x:'128.6003',y:'35.8003'}}}}:path==='/req/data'?{response:{status:'OK',result:{featureCollection:{features:[{geometry:parcel,properties:{pnu}}]}}}}:path.includes('ladfrlList')?{ladfrlList:{field:[{pnu,lndpclAr:'1000'}]}}:{type:'FeatureCollection',features:[{geometry:building,properties:{pnu}},{geometry:building,properties:{pnu}}]};
  return {ok:!(buildingError&&path.includes('getBldgisSpceWFS')),status:403,json:async()=>data};
};
test('지적대장 면적 우선, 건물 중복 제거, 지역 매핑',async()=>{
  const r=await lookupSite('대구광역시 중구 예시동 1',{key:'test',fetcher:fixture()});
  assert.equal(r.landArea,1000);assert.equal(r.region,'경상북도');assert.equal(r.buildingGeometries.length,1);assert.ok(r.buildingArea>90&&r.buildingArea<110);assert.equal(r.buildingStatus,'ok');
});
test('건물 API 실패 시 토지 조회 유지, 건물 선택 불가',async()=>{
  const r=await lookupSite('대구광역시 중구 예시동 1',{key:'test',fetcher:fixture(true)});assert.equal(r.landArea,1000);assert.equal(r.buildingArea,null);assert.equal(r.buildingStatus,'error');
});
test('면적 환산과 지역 매핑',()=>{
  assert.equal(estimateCapacity(1320,13.2),100);assert.equal(estimateCapacity(660,6.6),100);assert.equal(estimateCapacity(null,6.6),0);assert.equal(estimateCapacity(500,0),0);assert.equal(regionFromAddress('인천광역시 연수구'),'서울경기');assert.equal(regionFromAddress('전북특별자치도 전주시'),'전라북도');assert.equal(regionFromAddress('세종특별자치시'),'충청남도');assert.equal(regionFromAddress('대구광역시'),'경상북도');assert.ok(geometryArea(parcel)>9000);
});
test('API 키 미설정 및 유효하지 않은 요청',async()=>{
  assert.equal((await siteAreaResponse('GET',{},{})).status,405);assert.equal((await siteAreaResponse('POST',{address:'가'},{})).status,400);assert.equal((await siteAreaResponse('POST',{address:'대구광역시 중구 예시동'},{})).status,502);
});
