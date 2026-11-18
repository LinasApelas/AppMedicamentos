/* global __dirname */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
function load(name,imports={},globals={}) {
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:false,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:n=>imports[n],setTimeout,clearTimeout,AbortController,URL,...globals});
 return exports;
}
test('áudio único, parada durante preparação e segundo plano',async()=>{
 const players=[];let resolveMode;
 const state={currentState:'active'};
 const audio={setAudioModeAsync:async mode=>{assert.equal(mode.playsInSilentMode,false);assert.equal(mode.shouldPlayInBackground,false)},createAudioPlayer:()=>{const p={playing:false,removed:false,play(){this.playing=true},pause(){this.playing=false},remove(){this.removed=true}};players.push(p);return p}};
 const service=load('alertaPrimeiroPlano',{'react-native':{AppState:state,Platform:{OS:'ios'},Vibration:{vibrate(){},cancel(){}}},'expo-audio':audio,'../../assets/sounds/syncmed-alarme.wav':1});
 await service.iniciarAlerta();assert.equal(players[0].playing,true);assert.equal(players[0].loop,true);
 await service.iniciarAlerta();assert.equal(players[0].removed,true);assert.equal(players[1].playing,true);
 service.pararAlerta();assert.equal(players[1].playing,false);
 audio.setAudioModeAsync=()=>new Promise(resolve=>resolveMode=resolve);
 const pending=service.iniciarAlerta();await new Promise(resolve=>setImmediate(resolve));service.pararAlerta();resolveMode();await pending;assert.equal(players.length,2);
 state.currentState='background';await service.iniciarAlerta();assert.equal(players.length,2);
});
test('confirmação usa o endereço completo configurado da API',async()=>{
 const seen=[];const config={ENDPOINTS:{LOGIN:'http://api.test:8085/usuarios/login',SESSAO:'http://api.test:8085/usuarios/me',HISTORICOS:'http://api.test:8085/historicos'}};
 const {apiService}=load('api',{'./config':{API_CONFIG:config},'./session-storage':{sessionStorage:{logoutPendente:async()=>false}}},{fetch:async(url)=>{seen.push(url);return (url.endsWith('login') || url.endsWith('/me'))?Response.json({id:7,nome:'Teste',email:'teste@example.com'}):new Response('OK')}});
 await apiService.fazerLogin({email:'teste@example.com',senha:'fixture'});
 await apiService.confirmarLembrete({medicamentoId:1,ocorrencia:'1:100',prevista:'2026-11-18T10:00:00',realizada:'2026-11-18T10:01:00'});
 assert.equal(seen.at(-1),'http://api.test:8085/historicos/lembretes');
});
test('API configurável para iPhone, Android e navegador',()=>{
 const config=(platform,host,env,window)=>load('config',{'expo-constants':{default:{expoConfig:{hostUri:host}}},'react-native':{Platform:{OS:platform}}},{process:{env:{EXPO_PUBLIC_API_URL:env}},window}).API_CONFIG.BASE_URL;
 assert.equal(config('ios','192.0.2.1:8081','http://api.test:8085/'),'http://api.test:8085');
 assert.equal(config('ios','192.0.2.1:8081'),'http://192.0.2.1:8080');
 assert.equal(config('android',undefined),'http://10.0.2.2:8080');
 assert.equal(config('web',undefined,undefined,{location:{hostname:'localhost'}}),'http://localhost:8080');
});
