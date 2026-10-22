'use strict';
// Test-only static server; the pinned browser image does not require Python.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[3]);
http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){res.writeHead(404).end();return;}
   const type={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.gz':'application/gzip'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'Cache-Control':'no-store'});
   fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  });
 }catch(_){res.writeHead(400).end();}
}).listen(Number(process.argv[2]),'127.0.0.1');
