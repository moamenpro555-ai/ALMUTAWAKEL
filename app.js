var C={"القاهرة":[30.04,31.24],"الإسكندرية":[31.20,29.92],"طنطا":[30.79,31.00],"بورسعيد":[31.26,32.30],"السويس":[29.97,32.55],"أسيوط":[27.18,31.18],"الأقصر":[25.69,32.64],"أسوان":[24.09,32.90]};
var D=[];
try{D=JSON.parse(localStorage.getItem("mw")||"[]")}catch(e){}
function save(){try{localStorage.setItem("mw",JSON.stringify(D))}catch(e){}}
function $(i){return document.getElementById(i)}
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML}
$("de").innerHTML=Object.keys(C).map(function(k){return"<option>"+k+"</option>"}).join("");
function tab(n){$("p1").hidden=n!=1;$("p2").hidden=n!=2;$("t1").className=n==1?"on":"";$("t2").className=n==2?"on":"";if(n==2)draw()}
function km(a,b,c,d){var r=Math.PI/180,x=(c-a)*r,y=(d-b)*r*Math.cos((a+c)*r/2);return Math.round(Math.sqrt(x*x+y*y)*6371)}
function add(){
var n=$("n").value.trim(),p=$("ph").value.trim();
if(!n||!p){$("msg").textContent="";alert("من فضلك اكتب الاسم ورقم الموبايل");return}
var o=C["القاهرة"];
D.push({id:Date.now(),n:n,ph:p,lic:$("lic").value,pl:$("pl").value,ty:$("ty").value,de:$("de").value,la:o[0],lo:o[1],st:km(o[0],o[1],C[$("de").value][0],C[$("de").value][1])||1});
save();["n","ph","lic","pl"].forEach(function(i){$(i).value=""});
$("msg").textContent="تم تسجيل السائق ✓";
}
function loc(id){
var d=D.filter(function(x){return x.id==id})[0];
if(!navigator.geolocation){alert("المتصفح لا يدعم تحديد الموقع");return}
navigator.geolocation.getCurrentPosition(function(p){d.la=p.coords.latitude;d.lo=p.coords.longitude;save();draw()},function(){alert("لم يتم السماح بتحديد الموقع")});
}
function sim(id){
var d=D.filter(function(x){return x.id==id})[0],t=C[d.de];
d.la+=(t[0]-d.la)*.25;d.lo+=(t[1]-d.lo)*.25;save();draw();
}
function del(id){D=D.filter(function(x){return x.id!=id});save();draw()}
function pt(la,lo){return[(lo-24)/13*300,(32-la)/10*230]}
function draw(){
var s="",run=0,arr=0;
Object.keys(C).forEach(function(k){var p=pt(C[k][0],C[k][1]);s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="var(--navy)"/><text x="'+(p[0]+5)+'" y="'+(p[1]+3)+'" font-size="8" fill="var(--mut)">'+k+'</text>'});
var h="";
D.forEach(function(d){
var t=C[d.de],r=km(d.la,d.lo,t[0],t[1]),a=pt(d.la,d.lo),b=pt(t[0],t[1]),pr=Math.max(0,Math.min(100,Math.round((1-r/d.st)*100)));
if(r<15){arr++;pr=100}else run++;
s+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="var(--gold)" stroke-dasharray="4 3"/><circle cx="'+a[0]+'" cy="'+a[1]+'" r="5.5" fill="var(--gold)" stroke="var(--navy)" stroke-width="2"/>';
h+='<div class="row"><div><b>'+esc(d.n)+'</b> <span class="tag">'+esc(d.ty)+'</span><div class="mut">'+esc(d.ph)+' · لوحة: '+esc(d.pl||"-")+'</div><div class="mut">الوجهة: '+esc(d.de)+' · المتبقي '+r+' كم · '+d.la.toFixed(3)+', '+d.lo.toFixed(3)+'</div><div class="bar"><i style="width:'+pr+'%"></i></div></div><div><button class="btn s" onclick="loc('+d.id+')">موقعي الآن</button> <button class="btn s g" onclick="sim('+d.id+')">محاكاة تقدم</button> <button class="btn s" style="background:#a33" onclick="del('+d.id+')">حذف</button></div></div>';
});
$("map").innerHTML=s;
$("list").innerHTML=h||'<p class="mut">لا يوجد سائقين مسجلين بعد.</p>';
$("s1").textContent=D.length;$("s2").textContent=run;$("s3").textContent=arr;
}
