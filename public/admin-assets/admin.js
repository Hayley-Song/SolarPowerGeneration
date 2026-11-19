import {renderQr} from './qrCanvas.js';
const $=id=>document.getElementById(id);
let adminSecret='', busy=false, nextCursor='0', records=new Map(), issuedId='', qrReady=false;
const formatter=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const formatTime=value=>formatter.format(new Date(value));
const kstInput=date=>new Date(date.getTime()+9*3600000).toISOString().slice(0,16);
function kstIso(value){if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error('날짜와 시간을 입력하세요.');return new Date(`${value}:00+09:00`).toISOString();}
function setPeriod(days=5){const now=new Date();$('start').value=kstInput(now);$('end').value=kstInput(new Date(now.getTime()+days*86400000));}
function message(id,text='',error=false){const e=$(id);e.textContent=text;e.classList.toggle('error',error);}
function setBusy(value){busy=value;document.querySelectorAll('button').forEach(button=>button.disabled=value);if(!value)$('download').disabled=!qrReady;}
function clearResult(){issuedId='';qrReady=false;$('issued').hidden=true;$('empty-result').hidden=false;$('issued-url').value='';$('issued-company').textContent='';$('issued-period').textContent='';$('open').removeAttribute('href');const canvas=$('qr');canvas.width=320;canvas.height=320;canvas.hidden=true;$('download').disabled=true;message('share-message');}
function logout(reason='') {adminSecret='';records.clear();nextCursor='0';$('secret').value='';$('company').value='';$('trial-rows').replaceChildren();clearResult();$('workspace').hidden=true;$('login-panel').hidden=false;$('logout').hidden=true;message('login-message',reason,Boolean(reason));message('issue-message');message('list-message');$('secret').focus();}
async function request(method,{body,cursor,secret=adminSecret}={}){
  const headers={Authorization:`Bearer ${secret}`};if(body)headers['Content-Type']='application/json';
  const response=await fetch(`/api/admin/trials${cursor!==undefined?`?cursor=${encodeURIComponent(cursor)}`:''}`,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'same-origin',redirect:'error',referrerPolicy:'no-referrer'});
  let data;try{data=await response.json();}catch{throw Error('관리자 API 응답을 확인할 수 없습니다. Vercel 배포 주소에서 이용하세요.');}
  if(!response.ok){const err=Error(data.error||`요청 실패 (${response.status})`);err.status=response.status;throw err;}return data;
}
function failure(id,error){if(error.status===401&&adminSecret){logout('관리자 인증이 만료되었거나 변경되었습니다. 다시 인증하세요.');return;}message(id,error.message||'요청 중 오류가 발생했습니다.',true);}
function renderList(){
  const body=$('trial-rows');body.replaceChildren();
  const sorted=[...records.values()].sort((a,b)=>Date.parse(a.endAt)-Date.parse(b.endAt));
  for(const row of sorted){const tr=document.createElement('tr');for(const text of [row.company,formatTime(row.startAt),formatTime(row.endAt)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}
    const td=document.createElement('td'),badge=document.createElement('span');badge.className=`status${row.status==='scheduled'?' scheduled':''}`;badge.textContent=row.status==='scheduled'?'시작 전':'이용 중';td.append(badge);tr.append(td);
    const action=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='취소';button.disabled=busy;button.addEventListener('click',()=>revoke(row));action.append(button);tr.append(action);body.append(tr);
  }
  $('empty-list').hidden=sorted.length!==0||nextCursor!=='0';$('more').hidden=nextCursor==='0';
}
function appendList(data,reset){if(!Array.isArray(data.trials)||typeof data.nextCursor!=='string')throw Error('목록 응답 형식이 올바르지 않습니다.');if(reset)records.clear();for(const row of data.trials)records.set(row.id,row);nextCursor=data.nextCursor;renderList();}
async function refreshList(reset=true){const data=await request('GET',{cursor:reset?'0':nextCursor});appendList(data,reset);message('list-message',nextCursor==='0'?'':'다음 목록 조회 버튼으로 나머지 권한을 확인할 수 있습니다.');}
async function getHash(token){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function showResult(data){
  const url=new URL(data.url);if(url.protocol!=='https:'||!/^\/trial\/[A-Za-z0-9_-]{43}$/.test(url.pathname)||url.username||url.password||url.search||url.hash)throw Error('서버가 올바르지 않은 접속 URL을 반환했습니다.');
  $('issued-company').textContent=data.company;$('issued-period').textContent=`${formatTime(data.startAt)} ~ ${formatTime(data.endAt)} (KST)`;$('issued-url').value=url.href;$('open').href=url.href;$('empty-result').hidden=true;$('issued').hidden=false;message('share-message');
  try{issuedId=await getHash(url.pathname.split('/').pop());}catch{issuedId='';}
  try{renderQr($('qr'),url.href);$('qr').hidden=false;qrReady=true;}catch(error){$('qr').hidden=true;qrReady=false;message('share-message','링크는 발급되었지만 QR 코드 생성에 실패했습니다. URL을 복사해 주세요.',true);}
}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;const secret=$('secret').value;if(!secret)return;setBusy(true);message('login-message','인증 중…');try{const data=await request('GET',{cursor:'0',secret});appendList(data,true);adminSecret=secret;$('secret').value='';$('login-panel').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;setPeriod();message('login-message');$('company').focus();}catch(e){failure('login-message',e);}finally{setBusy(false);}});
$('logout').addEventListener('click',()=>logout());$('now').addEventListener('click',()=>{$('start').value=kstInput(new Date());});document.querySelectorAll('[data-days]').forEach(b=>b.addEventListener('click',()=>{try{$('end').value=kstInput(new Date(Date.parse(kstIso($('start').value))+Number(b.dataset.days)*86400000));}catch(e){message('issue-message',e.message,true);}}));
$('issue-form').addEventListener('submit',async event=>{event.preventDefault();if(busy||!adminSecret)return;let startAt,endAt;try{startAt=kstIso($('start').value);endAt=kstIso($('end').value);if(Date.parse(startAt)>=Date.parse(endAt)||Date.parse(endAt)<=Date.now())throw Error('종료일시는 시작일시 및 현재 시각보다 늦어야 합니다.');}catch(e){message('issue-message',e.message,true);return;}const company=$('company').value.trim();if(!company){message('issue-message','업체명을 입력하세요.',true);return;}setBusy(true);message('issue-message','발급 중…');try{const data=await request('POST',{body:{company,startAt,endAt}});clearResult();await showResult(data);message('issue-message','임시 URL을 발급했습니다.');try{await refreshList();}catch(e){failure('list-message',e);}}catch(e){failure('issue-message',e);}finally{setBusy(false);}});
$('copy').addEventListener('click',async()=>{const input=$('issued-url');try{await navigator.clipboard.writeText(input.value);message('share-message','URL을 복사했습니다.');}catch{input.focus();input.select();message('share-message','자동 복사가 제한되었습니다. Ctrl+C로 복사하세요.');}});
$('download').addEventListener('click',()=>{if(!qrReady)return;const a=document.createElement('a');a.href=$('qr').toDataURL('image/png');a.download='햇빛소득마을_임시접속_QR.png';a.click();message('share-message','QR 이미지 저장을 요청했습니다.');});
for(const [id,reset] of [['refresh',true],['more',false]])$(id).addEventListener('click',async()=>{if(busy||!adminSecret)return;setBusy(true);message('list-message','조회 중…');try{await refreshList(reset);}catch(e){failure('list-message',e);}finally{setBusy(false);}});
async function revoke(row){if(busy||!adminSecret||!window.confirm(`${row.company}의 이용 권한을 취소할까요? 기존 URL과 QR 코드로 접속할 수 없게 됩니다.`))return;setBusy(true);try{const data=await request('DELETE',{body:{id:row.id}});records.delete(row.id);renderList();if(issuedId===row.id)clearResult();message('list-message',data.message);}catch(e){failure('list-message',e);}finally{setBusy(false);}}
// No localStorage, cookies, third-party scripts or remote QR service. Clear secrets on bfcache restore.
window.addEventListener('pageshow',event=>{if(event.persisted)logout();});
