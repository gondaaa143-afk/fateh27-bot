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
      const total=(window.pyqPool&&window.pyqPool.length)||0,done=Object.keys(attempted).length,pct=total?Math.round(done/total*100):0;
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
    if(!root.querySelector('#pyqTimerX')){const t=document.createElement('span');t.id='pyqTimerX';t.className='pyq-timer';t.textContent='⏱ 15:00';meta.appendChild(t);}
    setInterval(function(){if(timer>0)timer--;const el=root.querySelector('#pyqTimerX');if(el){const m=Math.floor(timer/60),s=timer%60;el.textContent='⏱ '+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');el.classList.toggle('warning',timer<=60)}} ,1000);
    decorate();stats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else setTimeout(ready,0);
})();


/* SAMBHAV PYQ v2: timer stop + previous + deep explanations */
(function(){
  function bootV2(){
    const root=document.getElementById('pyq');
    if(!root || window.__sambhavPyqV2)return;
    window.__sambhavPyqV2=true;

    const detailMap={
      'Consider the following statements regarding the Constitution of India: 1. The Constitution explicitly provides for a uniform civil code. 2. Directive Principles of State Policy are not enforceable by any court. Which of the statements given above is/are correct?':{
        why:'UPSC tests whether you can distinguish a constitutional provision from a Directive Principle and understand the enforceability of DPSPs.',
        concept:'Article 44 directs the State to endeavour to secure a Uniform Civil Code, but it is part of the Directive Principles. DPSPs are fundamental in governance but are not enforceable by courts under Article 37.',
        eliminate:'Statement 1 is incorrect because the Constitution does not make UCC an enforceable right; it directs the State to work towards it. Statement 2 is correct.',
        takeaway:'Remember the trio: Article 37 — DPSPs are non-justiciable; Article 44 — UCC; Fundamental Rights — generally enforceable through constitutional remedies.'
      },
      'With reference to biodiversity conservation, which one of the following best describes an in-situ conservation approach?':{
        why:'UPSC uses conservation terminology to test whether you understand the difference between protecting biodiversity inside its ecosystem and preserving it outside the natural habitat.',
        concept:'In-situ conservation means conserving species within their natural ecosystems. National parks, wildlife sanctuaries and biosphere reserves are common examples.',
        eliminate:'Gene banks and seed storage are ex-situ approaches. Captive breeding outside the natural habitat is also ex-situ. Therefore, natural-habitat protection is the defining clue.',
        takeaway:'In-situ = “in the original place”; Ex-situ = “outside the original place”.'
      },
      'Consider the following statements: 1. Headline inflation includes food and energy prices. 2. Core inflation generally excludes volatile food and energy components. Which of the statements given above is/are correct?':{
        why:'UPSC tests whether you understand how inflation measures are constructed and why policymakers look beyond headline inflation.',
        concept:'Headline inflation reflects the broad price basket and therefore captures volatile components such as food and energy. Core inflation commonly removes these volatile components to reveal underlying price pressure.',
        eliminate:'Do not confuse “core” with “overall”. The exclusion of volatile food and energy is the key distinction used in standard core-inflation measures.',
        takeaway:'Headline = broad consumer price movement; Core = underlying trend after commonly volatile components are excluded.'
      },
      'The Indian summer monsoon is strongly influenced by which of the following phenomena?':{
        why:'UPSC asks monsoon questions to test the atmospheric mechanism behind seasonal wind reversal rather than simple rainfall facts.',
        concept:'The Indian summer monsoon involves a seasonal reversal of winds caused primarily by differential heating of land and ocean and associated pressure changes. ITCZ movement, the Tibetan Plateau, jet streams and ocean-atmosphere interactions also influence it.',
        eliminate:'The options using “only” are too absolute. Tides do not explain the continental-scale seasonal reversal of monsoon winds.',
        takeaway:'For Prelims, connect monsoon with differential heating + pressure gradient + seasonal wind reversal, then add ITCZ and upper-air circulation as supporting controls.'
      },
      'The term “Drain of Wealth” in the context of colonial India primarily refers to:':{
        why:'UPSC tests the economic impact of colonialism and the argument developed by early nationalists such as Dadabhai Naoroji.',
        concept:'The Drain theory described a one-way transfer of Indian resources to Britain without an equivalent economic return to India. Channels included remittances, pensions, profits, interest and certain payments connected with colonial administration.',
        eliminate:'It was not ordinary inter-provincial trade or movement of capital within India. The defining feature is unilateral external transfer without adequate return.',
        takeaway:'Drain of Wealth is central to the economic critique of colonial rule and the rise of economic nationalism.'
      }
    };

    let history=[], pos=-1, answered=false;
    const oldRender=window.renderPyq, oldAnswer=window.pyqAnswer, oldNext=window.pyqNext;
    function item(){return window.pyqPool && window.pyqPool[window.pyqIndex];}
    function stopTimer(){const el=root.querySelector('#pyqTimerX'); if(el){el.textContent='⏱ Paused';el.classList.add('warning');}}
    function startTimer(){const el=root.querySelector('#pyqTimerX'); if(el){el.textContent='⏱ 15:00';el.classList.remove('warning');}}
    function renderDetails(){
      const it=item(), card=root.querySelector('.pyq-card')||root.querySelector('#pyqCard');
      if(!it||!card)return;
      const d=detailMap[it.q]; if(!d)return;
      let box=root.querySelector('.pyq-deep-explain');
      if(!box){box=document.createElement('div');box.className='pyq-deep-explain';card.appendChild(box)}
      box.innerHTML='<div class="pyq-deep-title">UPSC Analysis</div><div><b>Why UPSC asks this:</b> '+d.why+'</div><div><b>Core concept:</b> '+d.concept+'</div><div><b>Option elimination:</b> '+d.eliminate+'</div><div><b>Prelims takeaway:</b> '+d.takeaway+'</div>';
    }
    function nav(){
      let wrap=root.querySelector('.pyq-nav-v2');
      if(!wrap){
        wrap=document.createElement('div');wrap.className='pyq-nav-v2';
        wrap.innerHTML='<button id="pyqPrevV2">← Previous</button><button id="pyqNextV2">Next →</button>';
        const card=root.querySelector('.pyq-card')||root.querySelector('#pyqCard');
        const actions=root.querySelector('.pyq-actions')||root.querySelector('.pyq-meta');
        (actions||card).parentNode.insertBefore(wrap,(actions||card).nextSibling);
        wrap.querySelector('#pyqPrevV2').onclick=function(){
          if(!window.pyqPool || !window.pyqPool.length)return;
          window.pyqIndex=(window.pyqIndex-1+window.pyqPool.length)%window.pyqPool.length;
          answered=false;startTimer();oldRender();renderDetails();
        };
        wrap.querySelector('#pyqNextV2').onclick=function(){
          if(!window.pyqPool || !window.pyqPool.length)return;
          window.pyqIndex=(window.pyqIndex+1)%window.pyqPool.length;
          answered=false;startTimer();oldRender();renderDetails();
        };
      }
    }
    const s=document.createElement('style');
    s.textContent='.pyq-nav-v2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.pyq-nav-v2 button{border:1px solid #d9d4ba;background:#fbfaf2;color:#283126;border-radius:14px;padding:11px;font-size:9px;font-weight:950}.pyq-deep-explain{margin-top:12px;padding:14px;border:1px solid #d9d4ba;border-radius:16px;background:#f7f4e6;color:#3b3d35;font-size:11px;line-height:1.55}.pyq-deep-explain>div{margin-bottom:9px}.pyq-deep-explain>div:last-child{margin-bottom:0}.pyq-deep-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.5px;color:#283126}';
    document.head.appendChild(s);

    window.renderPyq=function(){oldRender();setTimeout(function(){answered=false;startTimer();nav();},0)};
    window.pyqAnswer=function(i){
      if(answered)return;
      answered=true;
      oldAnswer(i);
      stopTimer();
      setTimeout(function(){renderDetails();nav()},0);
    };
    window.pyqNext=function(){
      if(!window.pyqPool || !window.pyqPool.length)return;
      window.pyqIndex=(window.pyqIndex+1)%window.pyqPool.length;
      answered=false;startTimer();oldRender();nav();
    };
    setTimeout(function(){nav();renderDetails()},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV2);else setTimeout(bootV2,100);
})();
/* SAMBHAV PYQ V3: put Previous in the existing action row */
(function(){
  function bootV3(){
    const root=document.getElementById('pyq');
    if(!root || window.__sambhavPyqV3)return;
    window.__sambhavPyqV3=true;
    const oldRender=window.renderPyq, oldAnswer=window.pyqAnswer;
    function startTimer(){const el=root.querySelector('#pyqTimerX');if(el){el.textContent='⏱ 15:00';el.classList.remove('warning')}}
    function stopTimer(){const el=root.querySelector('#pyqTimerX');if(el){el.textContent='⏱ Paused';el.classList.add('warning')}}
    function details(){
      const it=window.pyqPool&&window.pyqPool[window.pyqIndex],card=root.querySelector('#pyqCard');if(!it||!card)return;
      const map={
       'Consider the following statements regarding the Constitution of India: 1. The Constitution explicitly provides for a uniform civil code. 2. Directive Principles of State Policy are not enforceable by any court. Which of the statements given above is/are correct?':['Why UPSC asks this','Tests the distinction between constitutional directives and enforceable Fundamental Rights.','Article 44 places UCC under the Directive Principles. Under Article 37, DPSPs are not enforceable by courts.','Statement 1 is wrong as UCC is a directive, not an enforceable constitutional right. Statement 2 is correct.','Prelims takeaway: Article 37 = non-justiciable DPSPs; Article 44 = UCC.'],
       'With reference to biodiversity conservation, which one of the following best describes an in-situ conservation approach?':['Why UPSC asks this','Tests the basic distinction between in-situ and ex-situ conservation.','In-situ means conserving species within their natural ecosystem; national parks and sanctuaries are examples.','Gene banks and captive breeding outside the natural habitat are ex-situ.','Prelims takeaway: In-situ = inside natural habitat; Ex-situ = outside it.'],
       'Consider the following statements: 1. Headline inflation includes food and energy prices. 2. Core inflation generally excludes volatile food and energy components. Which of the statements given above is/are correct?':['Why UPSC asks this','Tests inflation measurement and the distinction between headline and underlying price pressure.','Headline inflation covers the broad basket; core inflation commonly excludes volatile food and energy components.','The key clue is that core inflation removes commonly volatile components.','Prelims takeaway: Headline = broad; Core = underlying trend.'],
       'The Indian summer monsoon is strongly influenced by which of the following phenomena?':['Why UPSC asks this','Tests the mechanism behind seasonal monsoon reversal.','Differential land-ocean heating creates pressure changes and seasonal wind reversal, with ITCZ, jet streams and the Tibetan Plateau also influencing the monsoon.','Options using “only” are overly absolute; tides alone cannot explain the monsoon.','Prelims takeaway: connect monsoon with heating + pressure gradient + seasonal wind reversal.'],
       'The term “Drain of Wealth” in the context of colonial India primarily refers to:':['Why UPSC asks this','Tests the economic critique of colonial rule and economic nationalism.','Drain theory describes the one-way transfer of Indian resources to Britain without adequate economic return.','It is not ordinary internal trade; the defining feature is unilateral external transfer.','Prelims takeaway: Drain of Wealth is central to Dadabhai Naoroji’s economic critique.']
      };
      const d=map[it.q];if(!d)return;
      let box=card.querySelector('.pyq-deep-explain');if(!box){box=document.createElement('div');box.className='pyq-deep-explain';card.appendChild(box)}
      box.innerHTML='<div class="pyq-deep-title">UPSC Analysis</div><div><b>'+d[0]+':</b> '+d[1]+'</div><div><b>Core concept:</b> '+d[2]+'</div><div><b>Option elimination:</b> '+d[3]+'</div><div><b>'+d[4]+'</b></div>';
    }
    function actionRow(){
      const actions=root.querySelector('.pyq-actions');if(!actions)return;
      let p=actions.querySelector('#pyqPrevInline');
      if(!p){
        p=document.createElement('button');p.id='pyqPrevInline';p.className='pyq-secondary';p.textContent='← Previous';
        const save=actions.querySelector('.pyq-secondary');if(save)actions.insertBefore(p,save);
        else actions.insertBefore(p,actions.firstChild);
      }
      const save=actions.querySelector('.pyq-secondary:not(#pyqPrevInline)');
      const next=actions.querySelector('.pyq-next');
      if(save){save.style.order='1'} p.style.order='2';if(next)next.style.order='3';
      actions.style.gridTemplateColumns='1fr 1fr 1.35fr';
      p.onclick=function(){
        if(!window.pyqPool||!window.pyqPool.length)return;
        window.pyqIndex=(window.pyqIndex-1+window.pyqPool.length)%window.pyqPool.length;
        oldRender();startTimer();setTimeout(function(){actionRow();details()},0);
      };
    }
    window.renderPyq=function(){oldRender();setTimeout(function(){actionRow();startTimer();details()},0)};
    window.pyqAnswer=function(i){oldAnswer(i);stopTimer();setTimeout(function(){actionRow();details()},0)};
    /* Remove the separate bottom navigation created by V2. */
    function cleanup(){root.querySelectorAll('.pyq-nav-v2').forEach(x=>x.remove());actionRow()}
    const css=document.createElement('style');css.textContent='.pyq-nav-v2{display:none!important}.pyq-actions{grid-template-columns:1fr 1fr 1.35fr!important}.pyq-actions button{min-width:0}.pyq-deep-explain{margin-top:12px;padding:14px;border:1px solid #d9d4ba;border-radius:16px;background:#f7f4e6;color:#3b3d35;font-size:11px;line-height:1.55}.pyq-deep-explain>div{margin-bottom:9px}.pyq-deep-explain>div:last-child{margin-bottom:0}.pyq-deep-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.5px;color:#283126}';document.head.appendChild(css);
    setTimeout(function(){cleanup();details()},150);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV3);else setTimeout(bootV3,150);
})();
/* Load UPSC 2026 GS-I data into the existing PYQ engine */
(function(){
  const data=[
    {y:'2026',s:'History',t:'Art & Culture',q:'Which one of the following Carnatic music ragas is similar to Raga Bilawal in Hindustani music ?',o:['Nat Bhairavi','Kamavardhini','Hanumatodi','Dheera Shankarabharanam'],a:3,e:'Official UPSC 2026 GS-I Series A. Correct answer: D.'},
    {y:'2026',s:'Economy',t:'Currency & Exchange Rate',q:'The artificially fixed rupee-sterling exchange rate prescribed by the Hilton-Young Commission (1926) was adopted by the British Government for which one of the following reasons ?',o:['Aiding the flow of remittances from India and maintaining India’s creditworthiness','Providing support to Indian importers','Encouraging export of cotton produce from India','Preventing depreciation of the Rupee in terms of gold'],a:0,e:'Official UPSC 2026 GS-I Series A. Correct answer: A.'},
    {y:'2026',s:'History',t:'Ancient India',q:'Consider the following statements: I. Pali texts contain the first definite references to coins, e.g., kahapana, nikkha, kamsa, and kakanika. II. The literary evidence from Pali texts is corroborated by archaeological evidence of punch-marked coins from many sites, most of them made of silver. The above statements have been associated with which of the following ?',o:['Emergence of urban life','Transition to money economy','Both 1 and 2','Neither 1 nor 2'],a:2,e:'Official UPSC 2026 GS-I Series A. Correct answer: C.'},
    {y:'2026',s:'History',t:'Art & Culture',q:'Which of the following temples has/have a Nagara-style shikhara ? 1. Malegitti Shivalaya, Badami 2. Huchimalligudi Temple, Aihole 3. Dashavatara Temple, Deogarh 4. Virupaksha Temple, Pattadakal. Select the answer using the code given below :',o:['1 and 2','2 and 3','3 only','3 and 4'],a:1,e:'Official UPSC 2026 GS-I Series A. Correct answer: B.'},
    {y:'2026',s:'History',t:'Jainism',q:'Among the four main forms of existence of life recognized in Jainism, which one of the following is not included ?',o:['Deva (gods)','Yaksha (demi-gods)','Manushya (humans)','Tiryancha (animals and plants)'],a:1,e:'Official UPSC 2026 GS-I Series A. Correct answer: B.'},
    {y:'2026',s:'History',t:'Art & Culture',q:'The Hallisalasya painting in the Bagh Caves represents :',o:['A joyous folk dance','Buddha in a meditative pose','The depiction of Shiva and Parvati on Kailasha','Samudramanthan (Churning of the Ocean)'],a:0,e:'Official UPSC 2026 GS-I Series A. Correct answer: A.'}
  ];
  function load(){if(!window.PYQS)return setTimeout(load,100);data.forEach(x=>{if(!PYQS.some(y=>y.y===x.y&&y.q===x.q))PYQS.push(x);});if(typeof renderPyq==='function')renderPyq();}
  load();
})();


/* SAMBHAV 2026: replace demo PYQs with the complete Series-A paper */
(function(){
  function load2026(){
    if(!window.PYQS)return setTimeout(load2026,80);
    window.PYQS.length=0;
    window.pyqPool=[];
    window.pyqIndex=0;
    if(typeof window.renderPyq==='function')window.renderPyq();
    fetch('./api/upsc2026')
      .then(r=>r.json())
      .then(data=>{
        if(!data || !Array.isArray(data.questions) || data.questions.length<99) throw new Error('2026 dataset incomplete');
        data.questions.forEach(x=>window.PYQS.push(x));
        const sel=document.getElementById('pyqSubject');
        if(sel){ ['Science & Technology','Current Affairs & GK','Ancient History','Modern History','Art & Culture'].forEach(v=>{if(![...sel.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)}}); }
        window.pyqPool=window.PYQS.slice();
        window.pyqIndex=0;
        if(typeof window.renderPyq==='function')window.renderPyq();
      })
      .catch(err=>{
        console.error('SAMBHAV 2026 PYQ load failed',err);
        const card=document.getElementById('pyqCard');
        if(card)card.innerHTML='<div class="pyq-q">2026 PYQs could not be loaded right now.</div><div class="pyq-explain">Please refresh and try again.</div>';
      });
  }
  load2026();
})();
