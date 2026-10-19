import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import handler from './api/workshop.mjs';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/workshop') return handler(req,res);
  const route=url.pathname==='/'?'/index.html':url.pathname==='/host'?'/host.html':url.pathname;
  const path=resolve(root,'.'+route);
  if(!path.startsWith(root+'\\')&&!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  try { const file=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(file); }
  catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`CQ Dialogue Lab: http://localhost:${process.env.PORT||3000} · Host: /host${!process.env.HOST_PASSWORD?' · Local host password: classroom-demo':''}`));
