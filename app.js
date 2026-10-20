var C={"القاهرة":[30.04,31.24],"الإسكندرية":[31.20,29.92],"طنطا":[30.79,31.00],"بورسعيد":[31.26,32.30],"السويس":[29.97,32.55],"أسيوط":[27.18,31.18],"الأقصر":[25.69,32.64],"أسوان":[24.09,32.90]};
var BASE=location.origin+location.pathname.replace(/[^\/]*$/,""),D=[],KEY=sessionStorage.getItem("mwkey")||"";
function $(i){return document.getElementById(i)}
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":s;return d.innerHTML}
$("de").innerHTML=Object.keys(C).map(function(k){return"<option>"+k+"</option>"}).join("");

async function api(path,opt){
  opt=opt||{};
  opt.headers={"Content-Type":"application/json","x-admin-key":KEY};
  var ac=new AbortController(),to=setTimeout(function(){ac.abort()},75000);
  opt.signal=ac.signal;
  var r;
  try{r=await fetch((window.API_BASE||"")+"/api"+path,opt)}
  catch(e){clearTimeout(to);throw new Error(e.name=="AbortError"?"السيرفر مردش خلال 75 ثانية (غالبًا كان نايم). جرّب تاني.":"تعذر الاتصال بالسيرفر (غالبًا مشكلة CORS أو الرابط في config.js غلط أو السيرفر واقف)")}
  clearTimeout(to);
  if(r.status==401)throw new Error("auth");
  var j=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(j.error||("خطأ من السيرفر ("+r.status+")"));
  return j;
}
var timer=null;
function tab(n){clearInterval(timer);if(n==2)timer=setInterval(load,30000);$("p1").hidden=n!=1;$("p2").hidden=n!=2;$("t1").className=n==1?"on":"";$("t2").className=n==2?"on":"";if(n==2){initMap();if(map)setTimeout(function(){map.invalidateSize()},50);load()}}
function km(a,b,c,d){var r=Math.PI/180,x=(c-a)*r,y=(d-b)*r*Math.cos((a+c)*r/2);return Math.round(Math.sqrt(x*x+y*y)*6371)}

async function add(){
  var n=$("n").value.trim(),p=$("ph").value.trim();
  if(!n||!p){alert("من فضلك اكتب الاسم ورقم الموبايل");return}
  try{
    var r=await api("/drivers",{method:"POST",body:JSON.stringify({name:n,phone:p,license_no:$("lic").value,plate:$("pl").value,vehicle_type:$("ty").value,destination:$("de").value})});
    ["n","ph","lic","pl"].forEach(function(i){$(i).value=""});
    $("msg").innerHTML='تم تسجيل السائق ✓ <button class="btn s" onclick="cp(\''+BASE+'driver.html?id='+r.id+'\')">نسخ رابط السائق</button>';
  }catch(e){if(e.message=="auth"){alert("لازم تدخل كلمة سر الإدارة الأول من تبويب الأسطول والخريطة");tab(2)}else alert(e.message)}
}
var loaded=false;
function setKey(){KEY=$("kin").value.trim();sessionStorage.setItem("mwkey",KEY);load()}
async function load(){
  if(!loaded)$("list").innerHTML='<p class="mut">جاري الاتصال بالسيرفر... لو كان نايم ممكن ياخد لحد دقيقة.</p>';
  try{D=await api("/fleet");loaded=true;draw()}
  catch(e){
    if(e.message=="auth")$("list").innerHTML='<p><b>أدخل كلمة سر الإدارة</b></p><p><input id="kin" type="password" style="max-width:260px"> <button class="btn" onclick="setKey()">دخول</button></p>';
    else $("list").innerHTML='<p class="err" style="color:#c0392b;font-weight:700">'+esc(e.message)+'</p><p><button class="btn" onclick="load()">إعادة المحاولة</button></p>';
  }
}
function find(id){return D.filter(function(x){return x.id==id})[0]}
async function del(id){
  if(!confirm("حذف السائق؟"))return;
  await api("/drivers/"+id,{method:"DELETE"});load();
}
var map=null,layer=null,fitted=false;
function ago(t){if(!t)return"";var m=Math.round((Date.now()-new Date(t))/60000);return m<1?"الآن":m<60?"منذ "+m+" دقيقة":"منذ "+Math.round(m/60)+" ساعة"}
function initMap(){
  if(map)return;
  if(!window.L){$("map").innerHTML='<p class="mut" style="padding:16px;direction:rtl">مكتبة الخريطة (Leaflet) مش اتحمّلت. تأكد من الإنترنت أو إن cdnjs مش محجوب.</p>';return}
  map=L.map("map",{scrollWheelZoom:false}).setView([27.5,31],6);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"&copy; OpenStreetMap"}).addTo(map);
  layer=L.layerGroup().addTo(map);
}
function focusD(id){
  var d=find(id);if(!d||d.lat==null||!map)return;
  map.setView([d.lat,d.lng],11);$("map").scrollIntoView({behavior:"smooth",block:"center"});
}
function draw(){
  var run=0,arr=0,h="",pts=[];
  initMap();
  if(map){map.invalidateSize();layer.clearLayers()}
  D.forEach(function(d){
    var t=C[d.destination]||[30.04,31.24],has=d.lat!=null,st=d.start_km||1;
    var r=has?km(d.lat,d.lng,t[0],t[1]):st,pr=has?Math.max(0,Math.min(100,Math.round((1-r/st)*100))):0;
    var done=d.status=="arrived"||(has&&r<15);
    if(done){arr++;pr=100}else run++;
    if(has&&layer){
      pts.push([d.lat,d.lng]);
      L.circleMarker(t,{radius:5,color:"#1b3a6b",fillColor:"#fff",fillOpacity:1,weight:2}).bindTooltip(d.destination).addTo(layer);
      L.polyline([[d.lat,d.lng],t],{color:"#c9993a",weight:3,dashArray:"6 8"}).addTo(layer);
      L.marker([d.lat,d.lng],{icon:L.divIcon({className:"trk"+(done?" done":""),html:"🚚",iconSize:[36,36],iconAnchor:[18,18]})})
        .bindPopup("<b>"+esc(d.name)+"</b><br>"+esc(d.plate||"")+"<br>الوجهة: "+esc(d.destination)+"<br>"+(done?"وصل":"المتبقي "+r+" كم")+"<br>آخر موقع: "+ago(d.recorded_at)).addTo(layer);
    }
    h+='<div class="row"><div><b>'+esc(d.name)+'</b> <span class="tag">'+esc(d.vehicle_type)+'</span>'+(done?' <span class="tag" style="background:#2a9d5c">وصل</span>':'')+'<div class="mut">'+esc(d.phone)+' · لوحة: '+esc(d.plate||"-")+'</div><div class="mut">الوجهة: '+esc(d.destination)+' · '+(has?(done?'تم الوصول':'المتبقي '+r+' كم')+' · آخر موقع '+ago(d.recorded_at):'لم يبدأ مشاركة الموقع بعد (المسافة الكلية '+st+' كم)')+'</div><div class="bar"><i style="width:'+pr+'%"></i></div></div><div>'+(has?'<button class="btn s g" onclick="focusD(\''+d.id+'\')">على الخريطة</button> ':'')+'<button class="btn s" onclick="cp(BASE+\'driver.html?id='+d.id+'\')">رابط السائق</button> <button class="btn s" style="background:#a33" onclick="del(\''+d.id+'\')">حذف</button></div></div>';
  });
  if(map&&!fitted&&pts.length){map.fitBounds(pts,{padding:[50,50],maxZoom:10});fitted=true}
  $("list").innerHTML=h||'<p class="mut">لا يوجد سائقين مسجلين بعد.</p>';
  $("s1").textContent=D.length;$("s2").textContent=run;$("s3").textContent=arr;
}
function cp(t){
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){alert("تم نسخ الرابط، ابعته للسائق على واتساب")},function(){prompt("انسخ الرابط:",t)});
  else prompt("انسخ الرابط:",t);
}
