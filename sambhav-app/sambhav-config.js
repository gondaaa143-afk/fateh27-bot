window.SAMBHAV_CONFIG = {
  SUPABASE_URL: "https://xiluipotbpeexezybjdk.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e6YuxyuDKWidV4QQNdpyBw_vCSCYKVD"
};

/* SAMBHAV PYQ UX enhancements */
(function(){
  function ready(){
    const root=document.getElementById('pyq');
    if(!root||document.getElementById('pyqEnhancements'))return;
    const style=document.createElement('style');
    style.textContent='.pyq-progress-wrap{margin:0 0 12px}.pyq-progress-top{display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#77796b;margin-bottom:6px}.pyq-progress{height:8px;background:#eee9cf;border-radius:99px;overflow:hidden}.pyq-progress>span{display:block;height:100%;width:0;background:#283126;border-radius:99px;transition:width .25s}.pyq-status{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin:0 0 12px}.pyq-stat{background:#fbfaf2;border:1px solid #d9d4ba;border-radius:14px;padding:9px 8px;text-align:center}.pyq-stat b{display:block;font-size:15px;color:#283126}.pyq-stat small{display:block;font-size:7px;font-weight:950;color:#77796b;text-transform:uppercase}.pyq-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.pyq-tools button{border:1px solid #d9d4ba;background:#fbfaf2;color:#283126;border-radius:14px;padding:11px 8px;font-size:9px;font-weight:950}.pyq-tools button.active{background:#283126;color:#f5f1d9}.pyq-timer{display:inline-flex;background:#283126;color:#f5f1d9;border-radius:99px;padding:7px 10px;font-size:9px;font-weight:950}.pyq-timer.warning{background:#a83b35}.pyq-translate{float:right;border:1px solid #d9d4ba;background:#fbfaf2;color:#283126;border-radius:99px;padding:7px 10px;font-size:8px;font-weight:950}';
    document.head.appendChild(style);
    const meta=root.querySelector('.pyq-meta');
    const box=document.createElement('div');box.id='pyqEnhancements';
    box.innerHTML='<div class="pyq-tools"><button id="pyqAllBtn" class="active" onclick="sambhavPyqStatus(\'all\')">All Questions</button><button id="pyqUnBtn" onclick="sambhavPyqStatus(\'unattempted\')">Unattempted</button></div><div class="pyq-progress-wrap"><div class="pyq-progress-top"><span>Progress</span><span id="pyqProgressText">0%</span></div><div class="pyq-progress"><span id="pyqProgressBar"></span></div></div><div class="pyq-status"><div class="pyq-stat"><b id="pyqAttemptedX">0</b><small>Attempted</small></div><div class="pyq-stat"><b id="pyqUnattemptedX">0</b><small>Unattempted</small></div><div class="pyq-stat"><b id="pyqAccuracyX">—</b><small>Accuracy</small></div></div>';
    meta.parentNode.insertBefore(box,meta);
    const attempted={};let status='all',timer=900;
    const hindi={
      'Consider the following statements regarding the Constitution of India: 1. The Constitution explicitly provides for a uniform civil code. 2. Directive Principles of State Policy are not enforceable by any court. Which of the statements given above is/are correct?':['भारत के संविधान के संबंध में निम्नलिखित कथनों पर विचार कीजिए: 1. संविधान स्पष्ट रूप से समान नागरिक संहिता का प्रावधान करता है। 2. राज्य के नीति-निदेशक तत्व किसी भी न्यायालय द्वारा प्रवर्तनीय नहीं हैं। उपर्युक्त में से कौन-सा/से कथन सही है/हैं?',['केवल 1','केवल 2','1 और 2 दोनों','न तो 1, न ही 2']],
      'With reference to biodiversity conservation, which one of the following best describes an in-situ conservation approach?':['जैव विविधता संरक्षण के संदर्भ में, निम्नलिखित में से कौन-सा इन-सीटू संरक्षण पद्धति का सर्वोत्तम वर्णन करता है?',['प्रजातियों का उनके प्राकृतिक आवास में संरक्षण','केवल प्रयोगशालाओं में प्रजातियों का संरक्षण','जीन बैंक में बीजों का भंडारण','प्राकृतिक आवास के बाहर कैप्टिव ब्रीडिंग']],
      'Consider the following statements: 1. Headline inflation includes food and energy prices. 2. Core inflation generally excludes volatile food and energy components. Which of the statements given above is/are correct?':['निम्नलिखित कथनों पर विचार कीजिए: 1. हेडलाइन मुद्रास्फीति में खाद्य और ऊर्जा की कीमतें शामिल होती हैं। 2. कोर मुद्रास्फीति में सामान्यतः अस्थिर खाद्य और ऊर्जा घटकों को बाहर रखा जाता है। उपर्युक्त में से कौन-सा/से कथन सही है/हैं?',['केवल 1','केवल 2','1 और 2 दोनों','न तो 1, न ही 2']],
      'The Indian summer monsoon is strongly influenced by which of the following phenomena?':['भारतीय ग्रीष्मकालीन मानसून निम्नलिखित में से किस घटना से सबसे अधिक प्रभावित होता है?',['हवाओं का मौसमी प्रत्यावर्तन','केवल ध्रुवीय पूर्वी हवाएँ','स्थायी पछुआ हवाएँ','केवल समुद्री ज्वार']],
      'The term “Drain of Wealth” in the context of colonial India primarily refers to:':['औपनिवेशिक भारत के संदर्भ में “धन की निकासी” शब्द मुख्यतः किसे दर्शाता है?',['भारतीय पूंजी का रियासतों में स्थानांतरण','पर्याप्त आर्थिक प्रतिफल के बिना भारत से ब्रिटेन को संसाधनों का हस्तांतरण','भारतीय बंदरगाहों के बीच व्यापार','भारतीय प्रांतों के बीच राजस्व हस्तांतरण']]
    };
    function currentText(){const q=root.querySelector('.pyq-q');return q?q.textContent.trim():''}
    function stats(){
      const total=5,done=Object.keys(attempted).length,pct=Math.round(done/total*100);
      root.querySelector('#pyqProgressBar').style.width=pct+'%';root.querySelector('#pyqProgressText').textContent=pct+'%';
      root.querySelector('#pyqAttemptedX').textContent=done;root.querySelector('#pyqUnattemptedX').textContent=total-done;
      const a=root.querySelector('#pyqAccuracyX');a.textContent=window.pyqAttempted?Math.round(window.pyqCorrect/window.pyqAttempted*100)+'%':'—';
    }
    function decorate(){
      const q=root.querySelector('.pyq-q');if(!q)return;
      let b=root.querySelector('.pyq-translate');
      if(!b){b=document.createElement('button');b.className='pyq-translate';b.onclick=function(){toggleLanguage()};root.querySelector('.pyq-card').prepend(b)}
      const en=q.dataset.en||q.textContent.trim();q.dataset.en=en;
      const data=hindi[en];
      if(b.dataset.lang==='hi'&&data){q.textContent=data[0];root.querySelectorAll('.pyq-opt span:last-child').forEach((x,i)=>x.textContent=data[1][i])}
      else{b.dataset.lang='en';q.textContent=en;const itemOptions=Object.keys(hindi).indexOf(en)>=0?hindi[en][1]:null;if(itemOptions)root.querySelectorAll('.pyq-opt span:last-child').forEach((x,i)=>x.textContent=Object.values(hindi).find(v=>v[0]===q.textContent)?.[1][i]||x.textContent)}
      b.textContent=b.dataset.lang==='hi'?'View English':'हिंदी में देखें';stats();
    }
    function toggleLanguage(){
      const q=root.querySelector('.pyq-q');if(!q)return;const en=q.dataset.en||q.textContent.trim(),data=hindi[en],b=root.querySelector('.pyq-translate');
      if(!data)return;
      if(b.dataset.lang==='hi'){b.dataset.lang='en';q.textContent=en;root.querySelectorAll('.pyq-opt span:last-child').forEach((x,i)=>x.textContent=window._sambhavOriginalOptions[i]||x.textContent);b.textContent='हिंदी में देखें'}
      else{window._sambhavOriginalOptions=[...root.querySelectorAll('.pyq-opt span:last-child')].map(x=>x.textContent);b.dataset.lang='hi';q.textContent=data[0];root.querySelectorAll('.pyq-opt span:last-child').forEach((x,i)=>x.textContent=data[1][i]);b.textContent='View English'}
    }
    const originalAnswer=window.pyqAnswer;
    window.pyqAnswer=function(i){const before=currentText();attempted[before]=true;originalAnswer(i);stats()};
    const originalRender=window.renderPyq;
    window.renderPyq=function(){originalRender();setTimeout(decorate,0)};
    const originalFilter=window.pyqFilter;
    window.pyqFilter=function(){status='all';originalFilter();decorate()};
    window.sambhavPyqStatus=function(v){
      status=v;root.querySelector('#pyqAllBtn').classList.toggle('active',v==='all');root.querySelector('#pyqUnBtn').classList.toggle('active',v==='unattempted');
      originalFilter();decorate();
      if(v==='unattempted'){
        let guard=0;while(attempted[currentText()]&&guard<10){originalRender();window.pyqNext();guard++}
        decorate();
      }
    };
    const oldNext=window.pyqNext;
    window.pyqNext=function(){oldNext();decorate()};
    meta.innerHTML='<span id="pyqCount">Question</span><span id="pyqTimerX" class="pyq-timer">⏱ 15:00</span>';
    setInterval(function(){if(timer>0)timer--;const el=root.querySelector('#pyqTimerX');if(el){const m=Math.floor(timer/60),s=timer%60;el.textContent='⏱ '+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');el.classList.toggle('warning',timer<=60)}} ,1000);
    decorate();stats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else setTimeout(ready,0);
})();
