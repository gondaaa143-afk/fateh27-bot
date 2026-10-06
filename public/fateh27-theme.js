(function(){
  "use strict";
  const KEY="fateh27_theme";
  function apply(mode){
    const dark=mode==="dark";
    document.body.classList.toggle("f27-dark",dark);
    document.documentElement.style.colorScheme=dark?"dark":"light";
    const b=document.getElementById("f27ThemeToggle");
    if(b){
      b.setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
      b.innerHTML=dark?"☀️":"☾";
      b.title=dark?"Light mode":"Dark mode";
    }
  }
  function init(){
    const saved=localStorage.getItem(KEY);
    const mode=saved==="dark"||saved==="light"?saved:"light";
    apply(mode);
    if(!document.getElementById("f27ThemeToggle")){
      const b=document.createElement("button");
      b.id="f27ThemeToggle";
      b.type="button";
      b.addEventListener("click",function(){
        const next=document.body.classList.contains("f27-dark")?"light":"dark";
        localStorage.setItem(KEY,next);
        apply(next);
      });
      document.body.appendChild(b);
      apply(mode);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
