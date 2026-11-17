import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { siteAreaResponse } from './server/siteArea.js';
export default defineConfig(({mode}) => {
  const env={...loadEnv(mode,process.cwd(),''),...process.env};
  function middleware(server) {
    server.middlewares.use('/api/site-area',async (req,res)=>{
      let raw='';
      try {
        for await (const chunk of req) {raw+=chunk;if(raw.length>4096) break;}
        const result=await siteAreaResponse(req.method,raw?JSON.parse(raw):{},env);
        res.statusCode=result.status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(result.body));
      } catch {res.statusCode=400;res.end(JSON.stringify({error:'잘못된 요청입니다.'}));}
    });
  }
  return {plugins:[react(),{name:'site-area-local',configureServer:middleware,configurePreviewServer:middleware}]};
});
