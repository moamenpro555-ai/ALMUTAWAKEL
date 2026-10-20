var C={"القاهرة":[30.04,31.24],"الإسكندرية":[31.20,29.92],"طنطا":[30.79,31.00],"بورسعيد":[31.26,32.30],"السويس":[29.97,32.55],"أسيوط":[27.18,31.18],"الأقصر":[25.69,32.64],"أسوان":[24.09,32.90]};
var BASE=location.origin+location.pathname.replace(/[^\/]*$/,""),D=[],KEY=sessionStorage.getItem("mwkey")||"";
function $(i){return document.getElementById(i)}
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":s;return d.innerHTML}
$("de").innerHTML=Object.keys(C).map(function(k){return"<option>"+k+"</option>"}).join("");

async function api(path,opt){
  opt=opt||{};
  opt.headers={"Content-Type":"application/json","x-admin-key":KEY};
  var r=await fetch((window.API_BASE||"")+"/api"+path,opt);
  if(r.status==401){
    KEY=prompt("أدخل كلمة سر الإدارة")||"";
    sessionStorage.setItem("mwkey",KEY);
    if(KEY)return api(path,opt);
    throw new Error("auth");
  }
  var j=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(j.error||"خطأ");
  return j;
}
var timer=null;
function tab(n){clearInterval(timer);if(n==2)timer=setInterval(load,30000);$("p1").hidden=n!=1;$("p2").hidden=n!=2;$("t1").className=n==1?"on":"";$("t2").className=n==2?"on":"";if(n==2)load()}
function km(a,b,c,d){var r=Math.PI/180,x=(c-a)*r,y=(d-b)*r*Math.cos((a+c)*r/2);return Math.round(Math.sqrt(x*x+y*y)*6371)}

async function add(){
  var n=$("n").value.trim(),p=$("ph").value.trim();
  if(!n||!p){alert("من فضلك اكتب الاسم ورقم الموبايل");return}
  try{
    var r=await api("/drivers",{method:"POST",body:JSON.stringify({name:n,phone:p,license_no:$("lic").value,plate:$("pl").value,vehicle_type:$("ty").value,destination:$("de").value})});
    ["n","ph","lic","pl"].forEach(function(i){$(i).value=""});
    $("msg").innerHTML='تم تسجيل السائق ✓ <button class="btn s" onclick="cp(\''+BASE+'driver.html?id='+r.id+'\')">نسخ رابط السائق</button>';
  }catch(e){alert(e.message)}
}
async function load(){
  try{D=await api("/fleet");draw()}catch(e){if(e.message!="auth")alert(e.message)}
}
function find(id){return D.filter(function(x){return x.id==id})[0]}
function loc(id){
  if(!navigator.geolocation){alert("المتصفح لا يدعم تحديد الموقع");return}
  navigator.geolocation.getCurrentPosition(async function(p){
    await api("/drivers/"+id+"/location",{method:"POST",body:JSON.stringify({lat:p.coords.latitude,lng:p.coords.longitude})});
    load();
  },function(){alert("لم يتم السماح بتحديد الموقع")});
}
async function sim(id){
  var d=find(id),t=C[d.destination],la=d.lat==null?30.04:d.lat,lo=d.lng==null?31.24:d.lng;
  await api("/drivers/"+id+"/location",{method:"POST",body:JSON.stringify({lat:la+(t[0]-la)*.25,lng:lo+(t[1]-lo)*.25})});
  load();
}
async function del(id){
  if(!confirm("حذف السائق؟"))return;
  await api("/drivers/"+id,{method:"DELETE"});load();
}
function pt(la,lo){return[(lo-24)/13*300,(32-la)/10*230]}
function draw(){
  var s="",run=0,arr=0,h="";
  Object.keys(C).forEach(function(k){var p=pt(C[k][0],C[k][1]);s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="var(--navy)"/><text x="'+(p[0]+5)+'" y="'+(p[1]+3)+'" font-size="8" fill="var(--mut)">'+k+'</text>'});
  D.forEach(function(d){
    var t=C[d.destination]||[30.04,31.24],has=d.lat!=null,st=d.start_km||1;
    var r=has?km(d.lat,d.lng,t[0],t[1]):st,pr=Math.max(0,Math.min(100,Math.round((1-r/st)*100)));
    if(d.status=="arrived"||(has&&r<15)){arr++;pr=100}else run++;
    if(has){var a=pt(d.lat,d.lng),b=pt(t[0],t[1]);
      s+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="var(--gold)" stroke-dasharray="4 3"/><circle cx="'+a[0]+'" cy="'+a[1]+'" r="5.5" fill="var(--gold)" stroke="var(--navy)" stroke-width="2"/>'}
    h+='<div class="row"><div><b>'+esc(d.name)+'</b> <span class="tag">'+esc(d.vehicle_type)+'</span><div class="mut">'+esc(d.phone)+' · لوحة: '+esc(d.plate||"-")+'</div><div class="mut">الوجهة: '+esc(d.destination)+' · المتبقي '+r+' كم · '+(has?d.lat.toFixed(3)+', '+d.lng.toFixed(3):"لم يتم تحديد الموقع بعد")+'</div><div class="bar"><i style="width:'+pr+'%"></i></div></div><div><button class="btn s" onclick="loc(\''+d.id+'\')">موقعي الآن</button> <button class="btn s" onclick="cp(\''+BASE+'driver.html?id='+d.id+'\')">رابط السائق</button> <button class="btn s g" onclick="sim(\''+d.id+'\')">محاكاة تقدم</button> <button class="btn s" style="background:#a33" onclick="del(\''+d.id+'\')">حذف</button></div></div>';
  });
  $("map").innerHTML=s;
  $("list").innerHTML=h||'<p class="mut">لا يوجد سائقين مسجلين بعد.</p>';
  $("s1").textContent=D.length;$("s2").textContent=run;$("s3").textContent=arr;
}
function cp(t){
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){alert("تم نسخ الرابط، ابعته للسائق على واتساب")},function(){prompt("انسخ الرابط:",t)});
  else prompt("انسخ الرابط:",t);
}
