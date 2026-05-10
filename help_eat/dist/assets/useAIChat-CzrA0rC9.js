import{a4 as se,i as C,q as ne,g as re}from"./index-C3VVKGRu.js";import{d as x,g as G,u as ae}from"./useUserStore-B-d3uZrU.js";import{u as oe,a as ie}from"./useIngredientStore-BuWsMMYJ.js";const Z=90,b="one-day-three-meals-v1";function ce(e){if(!e)return e;const n=Array.from(e).map(t=>String.fromCharCode(t.charCodeAt(0)^Z)).join(""),d=b+n+b;return btoa(encodeURIComponent(d))}function le(e){if(!e)return e;try{const n=decodeURIComponent(atob(e));if(!n.startsWith(b)||!n.endsWith(b))return e;const d=n.slice(b.length,-b.length);return Array.from(d).map(t=>String.fromCharCode(t.charCodeAt(0)^Z)).join("")}catch{return e}}const Y={provider:"openai",apiKey:"",baseUrl:"https://api.openai.com/v1",model:"gpt-3.5-turbo",systemPrompt:`你是一个专业的饮食健康助手，擅长：
1. 食材营养和功效分析
2. 菜谱推荐和改良
3. 季节饮食建议
4. 健康饮食指导
5. 烹饪技巧分享

请用友好、专业的语言回答用户问题。`,temperature:.7},N={async getSettings(){try{const e=await x.aiSettings.getItem("settings");return e&&e.apiKey&&(e.apiKey=le(e.apiKey)),e||Y}catch{return Y}},async saveSettings(e){const n=JSON.parse(JSON.stringify(e));n.apiKey&&(n.apiKey=ce(n.apiKey)),await x.aiSettings.setItem("settings",n)},async getAllSessions(){return await x.aiSessions.getAll()},async getSession(e){return await x.aiSessions.get(e)},async createSession(e,n){const d={id:G(),title:e,messages:[],createdAt:Date.now(),updatedAt:Date.now(),context:n};return await x.aiSessions.put(d),d},async updateSession(e){e.updatedAt=Date.now(),await x.aiSessions.put(e)},async deleteSession(e){await x.aiSessions.delete(e)},async clearAllSessions(){await x.aiSessions.clear()}},ue=se("ai",()=>{const e=C([]),n=C(null),d=C(null),t=C(!1),s=C(null),g=ne(()=>[...e.value].sort((y,w)=>w.updatedAt-y.updatedAt));async function M(){t.value=!0;try{e.value=await N.getAllSessions(),d.value=await N.getSettings()}finally{t.value=!1}}async function J(){d.value=await N.getSettings()}async function U(y){d.value=y,await N.saveSettings(y)}async function B(y,w){const S=await N.createSession(y,w);return e.value.push(S),n.value=S,S}async function F(y){const w=await N.getSession(y);w&&(n.value=w)}async function W(y,w="user"){n.value||await B("新对话");const S={id:G(),role:w,content:y,timestamp:Date.now()};return n.value.messages.push(S),await N.updateSession(n.value),S}async function z(y,w){if(!n.value)return;const S=n.value.messages.findIndex(D=>D.id===y);S!==-1&&(n.value.messages[S]={...n.value.messages[S],content:w})}async function q(y){if(!n.value)return;const w=n.value.messages.findIndex(S=>S.id===y);w!==-1&&(n.value.messages[w].isStreaming=!1,await N.updateSession(n.value)),s.value=null}async function L(y){var w;await N.deleteSession(y),e.value=e.value.filter(S=>S.id!==y),((w=n.value)==null?void 0:w.id)===y&&(n.value=null)}async function Q(){await N.clearAllSessions(),e.value=[],n.value=null}return{sessions:e,currentSession:n,settings:d,loading:t,streamingMessageId:s,sortedSessions:g,fetchAll:M,loadSettings:J,saveSettings:U,createSession:B,selectSession:F,addMessage:W,updateStreamingMessage:z,finishStreamingMessage:q,deleteSession:L,clearAllSessions:Q}});function fe(e,n,d){let t="";return e.length>0&&(t+=`【用户的食材库】
`,e.forEach((s,g)=>{t+=`${g+1}. ${s.name}`,s.effect&&(t+=` - 功效: ${s.effect}`),s.processingMethod&&(t+=` - 处理方法: ${s.processingMethod}`),t+=`
`}),t+=`
`),n.length>0&&(t+=`【用户的菜谱库】
`,n.forEach((s,g)=>{t+=`${g+1}. ${s.name}`,s.taste&&(t+=` - 口味: ${s.taste}`),s.difficulty&&(t+=` - 难度: ${s.difficulty}`),s.cookingTime&&(t+=` - 烹饪时间: ${s.cookingTime}分钟`),s.ingredients&&s.ingredients.length>0&&(t+=` - 食材: ${s.ingredients.map(M=>M.name).join(", ")}`),t+=`
`}),t+=`
`),d.length>0&&(t+=`【用户的家庭成员】
`,d.forEach((s,g)=>{t+=`${g+1}. ${s.name} - ${s.age}岁 - ${s.gender==="male"?"男":"女"}`,t+=` - 身高: ${s.height}cm - 体重: ${s.weight}kg`,s.tags&&s.tags.length>0&&(t+=` - 标签: ${s.tags.join(", ")}`),t+=`
`}),t+=`
`),t}function H(e){const n=e.weight/(e.height/100*(e.height/100));let d="";n<18.5?d="体重偏轻":n<24?d="体重正常":n<28?d="超重":d="肥胖";let t=`请为家庭成员"${e.name}"提供个性化的饮食建议，以下是该成员的完整信息：

`;return t+=`基本信息：
`,t+=`- 姓名：${e.name}
`,t+=`- 年龄：${e.age}岁
`,t+=`- 性别：${e.gender==="male"?"男":"女"}
`,t+=`- 身高：${e.height}cm
`,t+=`- 体重：${e.weight}kg
`,t+=`- BMI：${n.toFixed(1)}（${d}）

`,e.tags&&e.tags.length>0&&(t+=`重要标签（请重点关注）：
`,e.tags.forEach((s,g)=>{t+=`${g+1}. ${s}
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

请使用友好、专业的语言回答用户问题，回答要简洁明了，重点突出。`}function de(e){return`请为食材"${e}"生成以下信息，仅返回纯JSON格式，不要包含任何其他文字、markdown标记或说明：

{
  "effect": "食材的功效和营养价值（100-200字）",
  "processingMethod": "食材的处理方法和注意事项（50-100字）"
}

重要要求：
1. 不要添加任何说明文字
2. 不要使用markdown代码块标记
3. 只返回纯JSON文本
4. 确保JSON格式正确，引号使用双引号`}function he(e){return`请为菜谱"${e}"生成以下信息，仅返回纯JSON格式，不要包含任何其他文字、markdown标记或说明：

{
  "taste": "口味描述（例如：酸甜、麻辣、清淡等）",
  "difficulty": "难度，只能是 'easy'、'medium' 或 'hard' 三者之一",
  "cookingTime": "烹饪时间（分钟，数字）",
  "servings": "份量（人数，数字）",
  "steps": "详细的烹饪步骤（200-500字）",
  "ingredientNames": ["主要食材名称1", "主要食材名称2", "主要食材名称3"]
}

重要要求：
1. 不要添加任何说明文字
2. 不要使用markdown代码块标记
3. 只返回纯JSON文本
4. 确保JSON格式正确，引号使用双引号
5. difficulty只能是'easy'、'medium'或'hard'三个值之一
6. cookingTime和servings必须是数字类型，不要加引号`}function V(e,n){return`请提供关于${n==="ingredient"?"食材":"菜谱"}"${e}"的权威信息，包括：

1. 适合食用的季节和时段
2. 主要功效和营养价值
3. 食用注意事项和禁忌
4. 搭配建议

请用简洁明了的语言回答，分点说明。`}function we(){const e=ue(),n=oe(),d=ie(),t=ae(),s=C(!1);re(async()=>{await Promise.all([n.fetchAll(),d.fetchAll(),t.fetchMembers()])});const g=C(null);let M=null,J=null;function U(l,c){M=l,J=c}async function B(l){return new Promise((c,r)=>{const o=new FileReader;o.onload=i=>{var p;try{let u=(p=i.target)==null?void 0:p.result;if(l.name.endsWith(".json"))try{const a=JSON.parse(u);u=JSON.stringify(a,null,2)}catch{}c(u)}catch{r(new Error("文件读取失败"))}},o.onerror=()=>{r(new Error("文件读取失败"))},o.readAsText(l)})}function F(){const l=fe(n.ingredients,d.recipes,t.members);return ge(l)}async function W(l){var c;if(!((c=e.settings)!=null&&c.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const r={id:G(),role:"assistant",content:"",timestamp:Date.now(),isStreaming:!0};e.currentSession&&(e.currentSession.messages.push(r),e.streamingMessageId=r.id),await ee(l,r.id)}catch(r){throw g.value=r instanceof Error?r.message:"发送消息失败",r}finally{s.value=!1}}async function z(l){var c;if(!((c=e.settings)!=null&&c.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const r=de(l),o=await D(r);console.log("AI原始响应:",o);let i=o.trim();i=i.replace(/^```[\s\S]*?\n/g,""),i=i.replace(/```$/g,"");let p=i.match(/\{[\s\S]*\}/);if(!p){const a=i.indexOf("{"),f=i.lastIndexOf("}");a!==-1&&f!==-1&&f>a&&(p=[i.slice(a,f+1)])}if(!p)throw console.error("无法提取JSON，原始响应:",o),new Error("AI返回格式错误，请重试");const u=p[0].trim();console.log("尝试解析的JSON:",u);try{const a=JSON.parse(u);if(console.log("解析成功的结果:",a),!a.effect||!a.processingMethod)throw console.error("返回数据缺少必需字段:",a),new Error("AI返回的数据不完整");return a}catch(a){console.error("JSON解析失败:",a,"尝试解析的内容:",u);let f=u.replace(/,\s*}/g,"}").replace(/,\s*]/g,"]").replace(/(['"])?(\w+)(['"])?\s*:/g,'"$2":');try{const h=JSON.parse(f);if(console.log("降级解析成功的结果:",h),!h.effect||!h.processingMethod)throw new Error("AI返回的数据不完整");return h}catch{throw new Error("AI返回格式错误，请重试")}}}catch(r){throw g.value=r instanceof Error?r.message:"获取食材信息失败",r}finally{s.value=!1}}async function q(l){var c;if(!((c=e.settings)!=null&&c.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const r=he(l),o=await D(r);console.log("AI原始响应(菜谱):",o);let i=o.trim();i=i.replace(/^```[\s\S]*?\n/g,""),i=i.replace(/```$/g,"");let p=i.match(/\{[\s\S]*\}/);if(!p){const a=i.indexOf("{"),f=i.lastIndexOf("}");a!==-1&&f!==-1&&f>a&&(p=[i.slice(a,f+1)])}if(!p)throw console.error("无法提取JSON(菜谱)，原始响应:",o),new Error("AI返回格式错误，请重试");const u=p[0].trim();console.log("尝试解析的JSON(菜谱):",u);try{const a=JSON.parse(u);if(console.log("解析成功的结果(菜谱):",a),!a.taste||!a.difficulty||!a.cookingTime||!a.servings||!a.steps||!a.ingredientNames)throw console.error("返回数据缺少必需字段(菜谱):",a),new Error("AI返回的数据不完整");return a}catch(a){console.error("JSON解析失败(菜谱):",a,"尝试解析的内容:",u);let f=u.replace(/,\s*}/g,"}").replace(/,\s*]/g,"]").replace(/(['"])?(\w+)(['"])?\s*:/g,'"$2":');try{const h=JSON.parse(f);if(console.log("降级解析成功的结果(菜谱):",h),!h.taste||!h.difficulty||!h.cookingTime||!h.servings||!h.steps||!h.ingredientNames)throw new Error("AI返回的数据不完整");return h}catch{throw new Error("AI返回格式错误，请重试")}}}catch(r){throw g.value=r instanceof Error?r.message:"获取菜谱信息失败",r}finally{s.value=!1}}async function L(l,c,r){var o;if(!((o=e.settings)!=null&&o.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const i=V(l,c);await S(i,r)}catch(i){throw g.value=i instanceof Error?i.message:"查询信息失败",i}finally{s.value=!1}}async function Q(l,c){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const o=H(l);await S(o,c)}catch(o){throw g.value=o instanceof Error?o.message:"查询信息失败",o}finally{s.value=!1}}async function y(l,c){var r;if(!((r=e.settings)!=null&&r.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const o=V(l,c);return await D(o)}catch(o){throw g.value=o instanceof Error?o.message:"查询信息失败",o}finally{s.value=!1}}async function w(l){var c;if(!((c=e.settings)!=null&&c.apiKey))throw new Error("请先配置API Key");s.value=!0,g.value=null;try{const r=H(l);return await D(r)}catch(r){throw g.value=r instanceof Error?r.message:"查询信息失败",r}finally{s.value=!1}}async function S(l,c){var I,m,T,P,$;if(!e.settings)throw new Error("AI设置未配置");const{apiKey:r,baseUrl:o,model:i,temperature:p}=e.settings,u=[{role:"system",content:"你是一位专业的饮食健康助手。"},{role:"user",content:l}],a=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:i,messages:u,temperature:p,stream:!0})});if(!a.ok){let A=`请求失败: ${a.status}`;try{const O=await a.json();A+=` - ${((I=O.error)==null?void 0:I.message)||JSON.stringify(O)}`}catch{A+=` - ${a.statusText}`}throw new Error(A)}const f=(m=a.body)==null?void 0:m.getReader();if(!f)throw new Error("无法读取响应");const h=new TextDecoder("utf-8");let v="",E=0;for(;;){const{done:A,value:O}=await f.read();if(A)break;for(v+=h.decode(O,{stream:!0});v.includes(`
`);){const j=v.indexOf(`
`),k=v.slice(0,j).trim();if(v=v.slice(j+1),!k||!k.startsWith("data: "))continue;const K=k.slice(6).trim();if(K!=="[DONE]")try{const _=($=(P=(T=JSON.parse(K).choices)==null?void 0:T[0])==null?void 0:P.delta)==null?void 0:$.content;_&&(E++,await c(_))}catch{}}}}async function D(l){var f,h,v,E;if(!e.settings)throw new Error("AI设置未配置");const{apiKey:c,baseUrl:r,model:o,temperature:i}=e.settings,p=[{role:"system",content:"你是一位专业的饮食健康助手。"},{role:"user",content:l}],u=await fetch(`${r}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({model:o,messages:p,temperature:i,stream:!1})});if(!u.ok){let I=`请求失败: ${u.status}`;try{const m=await u.json();I+=` - ${((f=m.error)==null?void 0:f.message)||JSON.stringify(m)}`}catch{I+=` - ${u.statusText}`}throw new Error(I)}return((E=(v=(h=(await u.json()).choices)==null?void 0:h[0])==null?void 0:v.message)==null?void 0:E.content)||""}async function ee(l,c){var a,f,h,v,E,I;if(!e.settings)return;const{apiKey:r,baseUrl:o,model:i,temperature:p}=e.settings,u=[{role:"system",content:F()},...((a=e.currentSession)==null?void 0:a.messages.filter(m=>m.role!=="system").slice(-10).map(m=>({role:m.role,content:m.content})))||[]];try{const m=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:i,messages:u,temperature:p,stream:!0})});if(!m.ok){let O=`请求失败: ${m.status}`;try{const j=await m.json();O+=` - ${((f=j.error)==null?void 0:f.message)||JSON.stringify(j)}`}catch{O+=` - ${m.statusText}`}throw new Error(O)}const T=(h=m.body)==null?void 0:h.getReader();if(!T)throw new Error("无法读取响应");const P=new TextDecoder("utf-8");let $="",A="";for(;;){const{done:O,value:j}=await T.read();if(O)break;for(A+=P.decode(j,{stream:!0});;){const k=A.indexOf(`
`);if(k===-1)break;const K=A.slice(0,k).trim();if(A=A.slice(k+1),!K)continue;let R="";if(K.startsWith("data: "))R=K.slice(6).trim();else if(K.startsWith("data:"))R=K.slice(5).trim();else continue;if(R!=="[DONE]")try{const X=(I=(E=(v=JSON.parse(R).choices)==null?void 0:v[0])==null?void 0:E.delta)==null?void 0:I.content;X&&($+=X,e.updateStreamingMessage(c,$),M==null||M())}catch{}}}await e.finishStreamingMessage(c),J==null||J()}catch{await te(l,c),J==null||J()}}async function te(l,c){var E,I,m,T,P;if(!e.settings)return;const{apiKey:r,baseUrl:o,model:i,systemPrompt:p,temperature:u}=e.settings,a=[{role:"system",content:p},...((E=e.currentSession)==null?void 0:E.messages.filter($=>$.role!=="system").slice(-10).map($=>({role:$.role,content:$.content})))||[]],f=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:i,messages:a,temperature:u,stream:!0})});if(!f.ok){let $=`请求失败: ${f.status}`;try{const A=await f.json();$+=` - ${((I=A.error)==null?void 0:I.message)||JSON.stringify(A)}`}catch{$+=` - ${f.statusText}`}throw new Error($)}const v=((P=(T=(m=(await f.json()).choices)==null?void 0:m[0])==null?void 0:T.message)==null?void 0:P.content)||"抱歉，我无法回答这个问题。";await e.updateStreamingMessage(c,v),await e.finishStreamingMessage(c)}return{isLoading:s,error:g,sendMessage:W,setStreamCallbacks:U,fillIngredientForm:z,fillRecipeForm:q,queryInfo:y,queryMemberInfo:w,streamQueryInfo:L,streamQueryMemberInfo:Q,loadFileContent:B}}export{ue as a,we as u};
