window.SAMBHAV_CONFIG = {
  SUPABASE_URL: "https://xiluipotbpeexezybjdk.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e6YuxyuDKWidV4QQNdpyBw_vCSCYKVD"
};

/* SAMBHAV PYQ UX enhancements */
(function(){
  function ready(){
    if(!window.PYQS || !window.pyqPool) return;
    const style=document.createElement('style');
    style.textContent='.pyq-progress-wrap{margin:0 0 12px}.pyq-progress-top{display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#77796b;margin-bottom:6px}.pyq-progress{height:8px;background:#eee9cf;border-radius:99px;overflow:hidden}.pyq-progress>span{display:block;height:100%;width:0;background:#283126;border-radius:99px;transition:width .25s}.pyq-status{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin:0 0 12px}.pyq-stat{background:#fbfaf2;border:1px solid #d9d4ba;border-radius:14px;padding:9px 8px;text-align:center}.pyq-stat b{display:block;font-size:15px;color:#283126}.pyq-stat small{display:block;font-size:7px;font-weight:950;color:#77796b;text-transform:uppercase}.pyq-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.pyq-tools button{border:1px solid #d9d4ba;background:#fbfaf2;color:#283126;border-radius:14px;padding:11px 8px;font-size:9px;font-weight:950}.pyq-tools button.active{background:#283126;color:#f5f1d9}.pyq-timer{display:inline-flex;background:#283126;color:#f5f1d9;border-radius:99px;padding:7px 10px;font-size:9px;font-weight:950}.pyq-timer.warning{background:#a83b35}.pyq-translate{float:right;border:1px solid #d9d4ba;background:#fbfaf2;color:#283126;border-radius:99px;padding:7px 10px;font-size:8px;font-weight:950}';
    document.head.appendChild(style);
    const meta=document.querySelector('#pyq .pyq-meta');
    if(!meta || document.getElementById('pyqEnhancements')) return;
    const box=document.createElement('div');box.id='pyqEnhancements';
    box.innerHTML='<div class="pyq-tools"><button id="pyqAllBtn" class="active" onclick="window.sambhavPyqStatus(\'all\')">All Questions</button><button id="pyqUnBtn" onclick="window.sambhavPyqStatus(\'unattempted\')">Unattempted</button></div><div class="pyq-progress-wrap"><div class="pyq-progress-top"><span>Progress</span><span id="pyqProgressText">0%</span></div><div class="pyq-progress"><span id="pyqProgressBar"></span></div></div><div class="pyq-status"><div class="pyq-stat"><b id="pyqAttemptedX">0</b><small>Attempted</small></div><div class="pyq-stat"><b id="pyqUnattemptedX">0</b><small>Unattempted</small></div><div class="pyq-stat"><b id="pyqAccuracyX">—</b><small>Accuracy</small></div></div>';
    meta.parentNode.insertBefore(box,meta);
    let lang='en', status='all', timer=900, answered={};
    const hi={
      '2025':{q:'भारत के संविधान के संबंध में निम्नलिखित कथनों पर विचार कीजिए: 1. संविधान स्पष्ट रूप से समान नागरिक संहिता का प्रावधान करता है। 2. राज्य के नीति-निदेशक तत्व किसी भी न्यायालय द्वारा प्रवर्तनीय नहीं हैं। उपर्युक्त में से कौन-सा/से कथन सही है/हैं?',o:['केवल 1','केवल 2','1 और 2 दोनों','न तो 1, न ही 2']},
      '2024':{q:'जैव विविधता संरक्षण के संदर्भ में, निम्नलिखित में से कौन-सा इन-सीटू संरक्षण पद्धति का सर्वोत्तम वर्णन करता है?',o:['प्रजातियों का उनके प्राकृतिक आवास में संरक्षण','केवल प्रयोगशालाओं में प्रजातियों का संरक्षण','जीन बैंक में बीजों का भंडारण','प्राकृतिक आवास के बाहर कैप्टिव ब्रीडिंग']},
      '2023':{q:'निम्नलिखित कथनों पर विचार कीजिए: 1. हेडलाइन मुद्रास्फीति में खाद्य और ऊर्जा की कीमतें शामिल होती हैं। 2. कोर मुद्रास्फीति में सामान्यतः अस्थिर खाद्य और ऊर्जा घटकों को बाहर रखा जाता है। उपर्युक्त में से कौन-सा/से कथन सही है/हैं?',o:['केवल 1','केवल 2','1 और 2 दोनों','न तो 1, न ही 2']},
      '2022':{q:'भारतीय ग्रीष्मकालीन मानसून निम्नलिखित में से किस घटना से सबसे अधिक प्रभावित होता है?',o:['हवाओं का मौसमी प्रत्यावर्तन','केवल ध्रुवीय पूर्वी हवाएँ','स्थायी पछुआ हवाएँ','केवल समुद्री ज्वार']},
      '2021':{q:'औपनिवेशिक भारत के संदर्भ में “धन की निकासी” शब्द मुख्यतः किसे दर्शाता है?',o:['भारतीय पूंजी का रियासतों में स्थानांतरण','पर्याप्त आर्थिक प्रतिफल के बिना भारत से ब्रिटेन को संसाधनों का हस्तांतरण','भारतीय बंदरगाहों के बीच व्यापार','भारतीय प्रांतों के बीच राजस्व हस्तांतरण']}
    };
    function key(x){return x.y+'-'+x.s+'-'+x.t}
    function stats(){
      const total=window.PYQS.length, done=Object.keys(answered).length, pct=total?Math.round(done/total*100):0;
      const a=document.getElementById('pyqProgressBar'),p=document.getElementById('pyqProgressText');
      if(a)a.style.width=pct+'%';if(p)p.textContent=pct+'%';
      const at=document.getElementById('pyqAttemptedX'),un=document.getElementById('pyqUnattemptedX');
      if(at)at.textContent=done;if(un)un.textContent=Math.max(0,total-done);
      const acc=document.getElementById('pyqAccuracyX');
      if(acc)acc.textContent=window.pyqAttempted?Math.round(window.pyqCorrect/window.pyqAttempted*100)+'%':'—';
    }
    function decorate(){
      const item=window.pyqPool[window.pyqIndex];if(!item)return;
      const card=document.getElementById('pyqCard');if(!card)return;
      let b=card.querySelector('.pyq-translate');
      if(!b){b=document.createElement('button');b.className='pyq-translate';b.onclick=()=>{lang=lang==='en'?'hi':'en';decorate();};card.prepend(b);}
      b.textContent=lang==='en'?'हिंदी में देखें':'View English';
      const q=card.querySelector('.pyq-q'),opts=card.querySelectorAll('.pyq-opt');
      if(lang==='hi'&&hi[item.y]){q.textContent=hi[item.y].q;opts.forEach((x,i)=>{const t=x.querySelector('span:last-child');if(t)t.textContent=hi[item.y].o[i]});}
      else {q.textContent=item.q;opts.forEach((x,i)=>{const t=x.querySelector('span:last-child');if(t)t.textContent=item.o[i]});}
      stats();
    }
    const oldAnswer=window.pyqAnswer;
    window.pyqAnswer=function(i){const item=window.pyqPool[window.pyqIndex];if(item)answered[key(item)]=true;oldAnswer(i);stats();};
    const oldNext=window.pyqNext;
    window.pyqNext=function(){oldNext();decorate();};
    window.pyqFilter=function(){
      const y=document.getElementById('pyqYear').value,s=document.getElementById('pyqSubject').value;
      const base=window.PYQS.filter(x=>(y==='all'||x.y===y)&&(s==='all'||x.s===s));
      window.pyqPool=status==='unattempted'?base.filter(x=>!answered[key(x)]):base;
      window.pyqIndex=0;window.pyqAnswered=false;window.renderPyq();decorate();
    };
    window.sambhavPyqStatus=function(v){status=v;document.getElementById('pyqAllBtn').classList.toggle('active',v==='all');document.getElementById('pyqUnBtn').classList.toggle('active',v==='unattempted');window.pyqFilter();};
    const originalRender=window.renderPyq;
    window.renderPyq=function(){originalRender();setTimeout(decorate,0);};
    window.pyqFilter();decorate();
    setInterval(function(){if(timer>0)timer--;const m=Math.floor(timer/60),s=timer%60;const el=document.getElementById('pyqTimerX');if(el)el.textContent='⏱ '+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');},1000);
    const timerWrap=document.querySelector('#pyq .pyq-meta');
    if(timerWrap&&!document.getElementById('pyqTimerX')){const t=document.createElement('span');t.id='pyqTimerX';t.className='pyq-timer';t.textContent='⏱ 15:00';timerWrap.appendChild(t);}
    stats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else setTimeout(ready,0);
})();
