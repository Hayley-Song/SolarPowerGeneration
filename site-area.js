import { siteAreaResponse } from '../server/siteArea.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body);}catch{body=null;}}
  const result=await siteAreaResponse(req.method,body);
  return res.status(result.status).json(result.body);
}
