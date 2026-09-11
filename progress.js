const KEY="fateh27_progress";

const DEFAULT={
 xp:2450,
 streak:12,
 gs1:0,
 gs2:0,
 gs3:0,
 gs4:0
};

function loadProgress(){
 const p=JSON.parse(localStorage.getItem(KEY)||"null")||DEFAULT;
 localStorage.setItem(KEY,JSON.stringify(p));
 return p;
}

function saveProgress(p){
 localStorage.setItem(KEY,JSON.stringify(p));
}

function getRank(xp){
 if(xp>=5000) return "IAS Officer";
 if(xp>=1000) return "Deputy Collector";
 if(xp>=500) return "Captain";
 if(xp>=200) return "Lieutenant";
 return "Cadet";
}

window.Progress={
 get(){
   return loadProgress();
 },

 addXP(value){
   const p=loadProgress();
   p.xp+=value;
   saveProgress(p);
   return p;
 },

 addSolved(paper){
   const p=loadProgress();

   if(paper==="GS1") p.gs1++;
   if(paper==="GS2") p.gs2++;
   if(paper==="GS3") p.gs3++;
   if(paper==="GS4") p.gs4++;

   saveProgress(p);
   return p;
 },

 rank(){
   return getRank(loadProgress().xp);
 }
};
