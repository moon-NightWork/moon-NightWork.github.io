import{a4 as se,i as k,q as ne,g as ae}from"./index-CooFRSVd.js";import{d as x,g as G,u as re}from"./useUserStore-CIDVWhwT.js";import{u as oe,a as ie}from"./useIngredientStore-Cnr80_Ls.js";const Z=90,R="one-day-three-meals-v1";function ce(e){if(!e)return e;const n=Array.from(e).map(t=>String.fromCharCode(t.charCodeAt(0)^Z)).join(""),l=R+n+R;return btoa(encodeURIComponent(l))}function le(e){if(!e)return e;try{const n=decodeURIComponent(atob(e));if(!n.startsWith(R)||!n.endsWith(R))return e;const l=n.slice(R.length,-R.length);return Array.from(l).map(t=>String.fromCharCode(t.charCodeAt(0)^Z)).join("")}catch{return e}}const Y={provider:"openai",apiKey:"",baseUrl:"https://api.openai.com/v1",model:"gpt-3.5-turbo",systemPrompt:`你是一个专业的饮食健康助手，擅长：
1. 食材营养和功效分析
2. 菜谱推荐和改良
3. 季节饮食建议
4. 健康饮食指导
5. 烹饪技巧分享

请用友好、专业的语言回答用户问题。`,temperature:.7},C={async getSettings(){try{const e=await x.aiSettings.getItem("settings");return e&&e.apiKey&&(e.apiKey=le(e.apiKey)),e||Y}catch{return Y}},async saveSettings(e){const n=JSON.parse(JSON.stringify(e));n.apiKey&&(n.apiKey=ce(n.apiKey)),await x.aiSettings.setItem("settings",n)},async getAllSessions(){return await x.aiSessions.getAll()},async getSession(e){return await x.aiSessions.get(e)},async createSession(e,n){const l={id:G(),title:e,messages:[],createdAt:Date.now(),updatedAt:Date.now(),context:n};return await x.aiSessions.put(l),l},async updateSession(e){e.updatedAt=Date.now(),await x.aiSessions.put(e)},async deleteSession(e){await x.aiSessions.delete(e)},async clearAllSessions(){await x.aiSessions.clear()}},ue=se("ai",()=>{const e=k([]),n=k(null),l=k(null),t=k(!1),s=k(null),c=ne(()=>[...e.value].sort((g,d)=>d.updatedAt-g.updatedAt));async function K(){t.value=!0;try{e.value=await C.getAllSessions(),l.value=await C.getSettings()}finally{t.value=!1}}async function O(){l.value=await C.getSettings()}async function B(g){l.value=g,await C.saveSettings(g)}async function U(g,d){const y=await C.createSession(g,d);return e.value.push(y),n.value=y,y}async function W(g){const d=await C.getSession(g);d&&(n.value=d)}async function z(g,d="user"){n.value||await U("新对话");const y={id:G(),role:d,content:g,timestamp:Date.now()};return n.value.messages.push(y),await C.updateSession(n.value),y}async function q(g,d){if(!n.value)return;const y=n.value.messages.findIndex(b=>b.id===g);y!==-1&&(n.value.messages[y]={...n.value.messages[y],content:d})}async function L(g){if(!n.value)return;const d=n.value.messages.findIndex(y=>y.id===g);d!==-1&&(n.value.messages[d].isStreaming=!1,await C.updateSession(n.value)),s.value=null}async function Q(g){var d;await C.deleteSession(g),e.value=e.value.filter(y=>y.id!==g),((d=n.value)==null?void 0:d.id)===g&&(n.value=null)}async function _(){await C.clearAllSessions(),e.value=[],n.value=null}return{sessions:e,currentSession:n,settings:l,loading:t,streamingMessageId:s,sortedSessions:c,fetchAll:K,loadSettings:O,saveSettings:B,createSession:U,selectSession:W,addMessage:z,updateStreamingMessage:q,finishStreamingMessage:L,deleteSession:Q,clearAllSessions:_}});function fe(e,n,l){let t="";return e.length>0&&(t+=`【用户的食材库】
`,e.forEach((s,c)=>{t+=`${c+1}. ${s.name}`,s.effect&&(t+=` - 功效: ${s.effect}`),s.processingMethod&&(t+=` - 处理方法: ${s.processingMethod}`),t+=`
`}),t+=`
`),n.length>0&&(t+=`【用户的菜谱库】
`,n.forEach((s,c)=>{t+=`${c+1}. ${s.name}`,s.taste&&(t+=` - 口味: ${s.taste}`),s.difficulty&&(t+=` - 难度: ${s.difficulty}`),s.cookingTime&&(t+=` - 烹饪时间: ${s.cookingTime}分钟`),s.ingredients&&s.ingredients.length>0&&(t+=` - 食材: ${s.ingredients.map(K=>K.name).join(", ")}`),t+=`
`}),t+=`
`),l.length>0&&(t+=`【用户的家庭成员】
`,l.forEach((s,c)=>{t+=`${c+1}. ${s.name} - ${s.age}岁 - ${s.gender==="male"?"男":"女"}`,t+=` - 身高: ${s.height}cm - 体重: ${s.weight}kg`,s.tags&&s.tags.length>0&&(t+=` - 标签: ${s.tags.join(", ")}`),t+=`
`}),t+=`
`),t}function H(e){const n=e.weight/(e.height/100*(e.height/100));let l="";n<18.5?l="体重偏轻":n<24?l="体重正常":n<28?l="超重":l="肥胖";let t=`请为家庭成员"${e.name}"提供个性化的饮食建议，以下是该成员的完整信息：

`;return t+=`基本信息：
`,t+=`- 姓名：${e.name}
`,t+=`- 年龄：${e.age}岁
`,t+=`- 性别：${e.gender==="male"?"男":"女"}
`,t+=`- 身高：${e.height}cm
`,t+=`- 体重：${e.weight}kg
`,t+=`- BMI：${n.toFixed(1)}（${l}）

`,e.tags&&e.tags.length>0&&(t+=`重要标签（请重点关注）：
`,e.tags.forEach((s,c)=>{t+=`${c+1}. ${s}
`}),t+=`
`),t+=`请提供以下建议：
`,t+=`1. 适合该成员的日常饮食原则
`,t+=`2. 推荐多吃的食材和需要避免的食材
`,t+=`3. 适合的菜谱类型和口味偏好
`,t+=`4. 根据BMI给出的体重管理建议
`,t+=`5. 基于标签的特殊注意事项（如果有标签）
`,t}function ge(e){return`你是一位专业的饮食健康助手，擅长食材营养分析、菜谱推荐和个性化饮食建议。

你的职责：
1. 基于用户的数据提供个性化的健康饮食建议
2. 回答关于食材功效、烹饪方法的问题
3. 推荐适合用户家庭成员的健康菜谱
4. 根据季节和用户的食材库存给出实用建议

${e||"用户还没有添加食材、菜谱或家庭成员数据。"}

请使用友好、专业的语言回答用户问题，回答要简洁明了，重点突出。`}function de(e){return`请为食材"${e}"生成以下信息，返回JSON格式：

{
  "effect": "食材的功效和营养价值（100-200字）",
  "processingMethod": "食材的处理方法和注意事项（50-100字）"
}

请直接返回JSON，不要包含其他文字。`}function ye(e){return`请为菜谱"${e}"生成以下信息，返回JSON格式：

{
  "taste": "口味描述（例如：酸甜、麻辣、清淡等）",
  "difficulty": "难度，只能是 'easy'、'medium' 或 'hard' 三者之一",
  "cookingTime": "烹饪时间（分钟，数字）",
  "servings": "份量（人数，数字）",
  "steps": "详细的烹饪步骤（200-500字）",
  "ingredientNames": ["主要食材名称1", "主要食材名称2", "主要食材名称3"]
}

请直接返回JSON，不要包含其他文字。`}function V(e,n){return`请提供关于${n==="ingredient"?"食材":"菜谱"}"${e}"的权威信息，包括：

1. 适合食用的季节和时段
2. 主要功效和营养价值
3. 食用注意事项和禁忌
4. 搭配建议

请用简洁明了的语言回答，分点说明。`}function we(){const e=ue(),n=oe(),l=ie(),t=re(),s=k(!1);ae(async()=>{await Promise.all([n.fetchAll(),l.fetchAll(),t.fetchMembers()])});const c=k(null);let K=null,O=null;function B(i,r){K=i,O=r}async function U(i){return new Promise((r,a)=>{const o=new FileReader;o.onload=u=>{var I;try{let h=(I=u.target)==null?void 0:I.result;if(i.name.endsWith(".json"))try{const p=JSON.parse(h);h=JSON.stringify(p,null,2)}catch{}r(h)}catch{a(new Error("文件读取失败"))}},o.onerror=()=>{a(new Error("文件读取失败"))},o.readAsText(i)})}function W(){const i=fe(n.ingredients,l.recipes,t.members);return ge(i)}async function z(i){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const a={id:G(),role:"assistant",content:"",timestamp:Date.now(),isStreaming:!0};e.currentSession&&(e.currentSession.messages.push(a),e.streamingMessageId=a.id),await ee(i,a.id)}catch(a){throw c.value=a instanceof Error?a.message:"发送消息失败",a}finally{s.value=!1}}async function q(i){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const a=de(i),u=(await b(a)).match(/\{[\s\S]*\}/);if(!u)throw new Error("AI返回格式错误，请重试");return JSON.parse(u[0])}catch(a){throw c.value=a instanceof Error?a.message:"获取食材信息失败",a}finally{s.value=!1}}async function L(i){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const a=ye(i),u=(await b(a)).match(/\{[\s\S]*\}/);if(!u)throw new Error("AI返回格式错误，请重试");return JSON.parse(u[0])}catch(a){throw c.value=a instanceof Error?a.message:"获取菜谱信息失败",a}finally{s.value=!1}}async function Q(i,r,a){var o;if(!((o=e.settings)!=null&&o.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const u=V(i,r);await y(u,a)}catch(u){throw c.value=u instanceof Error?u.message:"查询信息失败",u}finally{s.value=!1}}async function _(i,r){var a;if(!((a=e.settings)!=null&&a.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const o=H(i);await y(o,r)}catch(o){throw c.value=o instanceof Error?o.message:"查询信息失败",o}finally{s.value=!1}}async function g(i,r){var a;if(!((a=e.settings)!=null&&a.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const o=V(i,r);return await b(o)}catch(o){throw c.value=o instanceof Error?o.message:"查询信息失败",o}finally{s.value=!1}}async function d(i){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,c.value=null;try{const a=H(i);return await b(a)}catch(a){throw c.value=a instanceof Error?a.message:"查询信息失败",a}finally{s.value=!1}}async function y(i,r){var A,f,T,J,S;if(!e.settings)throw new Error("AI设置未配置");const{apiKey:a,baseUrl:o,model:u,temperature:I}=e.settings;console.log("[streamCallAI] 开始流式请求:",{baseUrl:o,model:u,temperature:I,stream:!0});const h=[{role:"system",content:"你是一位专业的饮食健康助手。"},{role:"user",content:i}],p=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({model:u,messages:h,temperature:I,stream:!0})});if(console.log("[streamCallAI] 响应状态:",p.status),console.log("[streamCallAI] Content-Type:",p.headers.get("content-type")),!p.ok){let v=`请求失败: ${p.status}`;try{const E=await p.json();console.log("[streamCallAI] 错误响应:",E),v+=` - ${((A=E.error)==null?void 0:A.message)||JSON.stringify(E)}`}catch{v+=` - ${p.statusText}`}throw new Error(v)}const w=(f=p.body)==null?void 0:f.getReader();if(!w)throw new Error("无法读取响应");const N=new TextDecoder("utf-8");let m="",$=0;for(;;){const{done:v,value:E}=await w.read();if(v){console.log("[streamCallAI] 流式响应完成，共处理",$,"个数据块"),m.trim()&&console.log("[streamCallAI] 处理剩余buffer:",m);break}for(m+=N.decode(E,{stream:!0});m.includes(`
`);){const P=m.indexOf(`
`),j=m.slice(0,P).trim();if(m=m.slice(P+1),!j||!j.startsWith("data: "))continue;const M=j.slice(6).trim();if(M==="[DONE]"){console.log("[streamCallAI] 收到[DONE]标记");continue}try{const F=(S=(J=(T=JSON.parse(M).choices)==null?void 0:T[0])==null?void 0:J.delta)==null?void 0:S.content;F&&($++,$<=5&&console.log("[streamCallAI] 收到数据块",$,":",JSON.stringify(F)),await r(F))}catch(D){console.log("[streamCallAI] 解析数据失败:",D,"dataStr:",M)}}}}async function b(i){var w,N,m,$;if(!e.settings)throw new Error("AI设置未配置");const{apiKey:r,baseUrl:a,model:o,temperature:u}=e.settings,I=[{role:"system",content:"你是一位专业的饮食健康助手。"},{role:"user",content:i}],h=await fetch(`${a}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:o,messages:I,temperature:u,stream:!0})});if(!h.ok){let A=`请求失败: ${h.status}`;try{const f=await h.json();A+=` - ${((w=f.error)==null?void 0:w.message)||JSON.stringify(f)}`}catch{A+=` - ${h.statusText}`}throw new Error(A)}return(($=(m=(N=(await h.json()).choices)==null?void 0:N[0])==null?void 0:m.message)==null?void 0:$.content)||""}async function ee(i,r){var p,w,N,m,$,A;if(!e.settings)return;const{apiKey:a,baseUrl:o,model:u,temperature:I}=e.settings,h=[{role:"system",content:W()},...((p=e.currentSession)==null?void 0:p.messages.filter(f=>f.role!=="system").slice(-10).map(f=>({role:f.role,content:f.content})))||[]];try{const f=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({model:u,messages:h,temperature:I,stream:!0})});if(!f.ok){let E=`请求失败: ${f.status}`;try{const P=await f.json();E+=` - ${((w=P.error)==null?void 0:w.message)||JSON.stringify(P)}`}catch{E+=` - ${f.statusText}`}throw new Error(E)}const T=(N=f.body)==null?void 0:N.getReader();if(!T)throw new Error("无法读取响应");const J=new TextDecoder("utf-8");let S="",v="";for(;;){const{done:E,value:P}=await T.read();if(E)break;for(v+=J.decode(P,{stream:!0});;){const j=v.indexOf(`
`);if(j===-1)break;const M=v.slice(0,j).trim();if(v=v.slice(j+1),!M)continue;let D="";if(M.startsWith("data: "))D=M.slice(6).trim();else if(M.startsWith("data:"))D=M.slice(5).trim();else continue;if(D!=="[DONE]")try{const X=(A=($=(m=JSON.parse(D).choices)==null?void 0:m[0])==null?void 0:$.delta)==null?void 0:A.content;X&&(S+=X,e.updateStreamingMessage(r,S),K==null||K())}catch{}}}await e.finishStreamingMessage(r),O==null||O()}catch(f){console.error("[streamChat] 流式请求失败，回退到非流式:",f),await te(i,r),O==null||O()}}async function te(i,r){var $,A,f,T,J;if(!e.settings)return;const{apiKey:a,baseUrl:o,model:u,systemPrompt:I,temperature:h}=e.settings,p=[{role:"system",content:I},...(($=e.currentSession)==null?void 0:$.messages.filter(S=>S.role!=="system").slice(-10).map(S=>({role:S.role,content:S.content})))||[]],w=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({model:u,messages:p,temperature:h,stream:!0})});if(!w.ok){let S=`请求失败: ${w.status}`;try{const v=await w.json();S+=` - ${((A=v.error)==null?void 0:A.message)||JSON.stringify(v)}`}catch{S+=` - ${w.statusText}`}throw new Error(S)}const m=((J=(T=(f=(await w.json()).choices)==null?void 0:f[0])==null?void 0:T.message)==null?void 0:J.content)||"抱歉，我无法回答这个问题。";await e.updateStreamingMessage(r,m),await e.finishStreamingMessage(r)}return{isLoading:s,error:c,sendMessage:z,setStreamCallbacks:B,fillIngredientForm:q,fillRecipeForm:L,queryInfo:g,queryMemberInfo:d,streamQueryInfo:Q,streamQueryMemberInfo:_,loadFileContent:U}}export{ue as a,we as u};
