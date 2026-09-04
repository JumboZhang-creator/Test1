const canvas=document.querySelector("#typhoon-map"),refresh=document.querySelector("#refresh"),locationButton=document.querySelector("#location"),refreshTime=document.querySelector("#refresh-time"),toast=document.querySelector("#toast");

function drawMap(){
  const box=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);
  const c=canvas.getContext("2d"),w=box.width,h=box.height;c.scale(dpr,dpr);
  c.beginPath();c.moveTo(0,0);c.lineTo(w*.3,0);c.bezierCurveTo(w*.27,h*.17,w*.33,h*.25,w*.25,h*.39);c.bezierCurveTo(w*.18,h*.52,w*.35,h*.61,w*.34,h*.73);c.bezierCurveTo(w*.32,h*.87,w*.43,h*.93,w*.45,h);c.lineTo(0,h);c.closePath();c.fillStyle="#c8dfd6";c.fill();
  c.beginPath();c.ellipse(w*.51,h*.82,w*.018,h*.09,.25,0,Math.PI*2);c.fillStyle="#bdd7cc";c.fill();
  const pts=[[.82,.82],[.73,.71],[.65,.60],[.58,.51],[.50,.43],[.42,.35],[.34,.29],[.27,.24]].map(([x,y])=>[x*w,y*h]),now=3,[cx,cy]=pts[now];
  [[74,"rgba(255,193,78,.13)","rgba(230,144,29,.55)"],[48,"rgba(235,80,63,.13)","rgba(220,67,54,.6)"]].forEach(([r,fill,stroke])=>{c.beginPath();c.ellipse(cx,cy,r*w/1000,r*h/380,-.18,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.setLineDash([5,5]);c.stroke()});
  function segment(start,end,color,dash){c.beginPath();c.moveTo(...pts[start]);for(let i=start+1;i<=end;i++)c.lineTo(...pts[i]);c.strokeStyle=color;c.lineWidth=3;c.lineCap="round";c.lineJoin="round";c.setLineDash(dash?[8,7]:[]);c.stroke()}
  segment(0,now,"#1998c7",false);segment(now,pts.length-1,"#ee8a2c",true);
  pts.forEach(([x,y],i)=>{c.beginPath();c.arc(x,y,i===now?10:6,0,Math.PI*2);c.fillStyle=i===now?"#e9493f":i<now?"#1998c7":"#fff";c.fill();c.strokeStyle=i===now?"#fff":i<now?"#fff":"#ee8a2c";c.lineWidth=i===now?4:2.5;c.stroke()});
  c.beginPath();c.arc(cx,cy,17,0,Math.PI*2);c.strokeStyle="rgba(233,73,63,.35)";c.lineWidth=6;c.setLineDash([]);c.stroke();
}

function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
refresh.addEventListener("click",()=>{const now=new Date();refreshTime.textContent=`页面刷新：${now.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}`;drawMap();showToast("演示页面已刷新，数据时间未改变")});
locationButton.addEventListener("click",()=>showToast("城市切换将在接入真实地区数据后开放"));
let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawMap,120)});drawMap();
