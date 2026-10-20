/* Ouverture : jouée une fois par visite, désactivée si l'utilisateur limite les animations */
(function(){
  var d=document.documentElement, el=document.getElementById("intro"), seen=false;
  try{ seen=sessionStorage.getItem("izr-intro")==="1"; sessionStorage.setItem("izr-intro","1"); }catch(e){}
  if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches){ el.remove(); return; }
  d.classList.add("intro-on");
  function fit(){ /* la lumière suit exactement le tracé, quelle que soit la taille de l'écran */
    var svg=el.querySelector("svg"), p=el.querySelector(".line"), dot=document.getElementById("introDot");
    var w=innerWidth,h=innerHeight,s=Math.max(w/1200,h/700),ox=(w-1200*s)/2,oy=(h-700*s)/2;
    var src=p.getAttribute("d").replace(/(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)/g,function(m,x,_,y){return (ox+x*s).toFixed(1)+" "+(oy+y*s).toFixed(1);});
    dot.style.offsetPath="path('"+src+"')";
  }
  fit();
  function done(){ if(el.parentNode) el.remove(); }
  function skip(){ if(!el.parentNode||el.classList.contains("out")) return; d.classList.add("intro-fast"); el.classList.add("out"); setTimeout(done,650); }
  document.getElementById("introSkip").addEventListener("click",skip);
  el.addEventListener("click",skip);
  addEventListener("keydown",function k(e){ if(e.key==="Escape"||e.key==="Enter"||e.key===" "){ skip(); removeEventListener("keydown",k);} });
  addEventListener("wheel",skip,{once:true,passive:true});
  setTimeout(done,1950);
  setTimeout(function(){ d.classList.remove("intro-on","intro-fast"); },2700);
})();
