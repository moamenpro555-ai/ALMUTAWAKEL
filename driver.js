var C={"القاهرة":[30.04,31.24],"الإسكندرية":[31.20,29.92],"طنطا":[30.79,31.00],"بورسعيد":[31.26,32.30],"السويس":[29.97,32.55],"أسيوط":[27.18,31.18],"الأقصر":[25.69,32.64],"أسوان":[24.09,32.90]};
var id=new URLSearchParams(location.search).get("id"),watch=null,last=0,lock=null,dest=null;
function $(i){return document.getElementById(i)}
function km(a,b,c,d){var r=Math.PI/180,x=(c-a)*r,y=(d-b)*r*Math.cos((a+c)*r/2);return Math.round(Math.sqrt(x*x+y*y)*6371)}

fetch((window.API_BASE||"")+"/api/drivers/"+id+"/info").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
  $("hi").textContent="أهلًا "+d.name;
  dest=d.destination;
  $("dest").textContent="الوجهة: "+(d.destination||"-")+(d.status=="arrived"?" (تم الوصول)":"");
}).catch(function(){
  $("hi").textContent="رابط غير صحيح";$("go").disabled=true;
});

function send(p){
  var t=Date.now();
  if(t-last<55000)return;
  last=t;
  fetch((window.API_BASE||"")+"/api/drivers/"+id+"/location",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lat:p.coords.latitude,lng:p.coords.longitude})})
  .then(function(r){if(!r.ok)throw 0;
    var m="آخر إرسال: "+new Date().toLocaleTimeString("ar-EG");
    if(dest&&C[dest])m+=" · المتبقي حوالي "+km(p.coords.latitude,p.coords.longitude,C[dest][0],C[dest][1])+" كم";
    $("info").textContent=m;$("err").textContent="";
  }).catch(function(){$("err").textContent="تعذر الإرسال، تأكد من الإنترنت";last=0});
}
async function wl(){try{if(navigator.wakeLock)lock=await navigator.wakeLock.request("screen")}catch(e){}}
document.addEventListener("visibilitychange",function(){if(watch!==null&&document.visibilityState=="visible")wl()});

function toggle(){
  if(watch!==null){
    navigator.geolocation.clearWatch(watch);watch=null;
    if(lock){lock.release();lock=null}
    $("dot").className="pulse off";$("st").textContent="المشاركة متوقفة";$("go").textContent="ابدأ مشاركة موقعي";return;
  }
  if(!navigator.geolocation){$("err").textContent="المتصفح لا يدعم تحديد الموقع";return}
  watch=navigator.geolocation.watchPosition(send,function(e){
    $("err").textContent=e.code==1?"لازم تسمح للمتصفح بتحديد الموقع من الإعدادات":"تعذر تحديد الموقع، تأكد إن الـ GPS شغال";
  },{enableHighAccuracy:true,maximumAge:10000,timeout:30000});
  wl();
  $("dot").className="pulse";$("st").textContent="الموقع بيتبعت للشركة";$("go").textContent="إيقاف المشاركة";
}
