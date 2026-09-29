// ===== FATEH27 PROGRESS ENGINE v3 =====

const Progress = {

KEY:"FATEH27_PROGRESS",

get(){

return JSON.parse(localStorage.getItem(this.KEY)||JSON.stringify({

xp:0,
streak:1,
solved:0,

gs1:0,
gs2:0,
gs3:0,
gs4:0,

lastActivity:"",
done:{},
badges:[]

}));

},

save(d){

localStorage.setItem(this.KEY,JSON.stringify(d));

},

rank(x){

if(x>=1500) return "🏆 Officer";
if(x>=800) return "⚔ Warrior";
if(x>=300) return "🥈 Aspirant";
return "🟢 Recruit";

},

toast(msg){

if(window.Telegram?.WebApp){

Telegram.WebApp.showAlert(msg);

}else{

alert(msg);

}

},

levelPopup(rank){

this.toast("LEVEL UP!\n"+rank);

},

badge(name){

const d=this.get();

if(!d.badges.includes(name)){

d.badges.push(name);
this.save(d);
this.toast("🏅 Achievement Unlocked\n"+name);

}

},

addXP(amount){

const d=this.get();

const old=this.rank(d.xp);

d.xp+=amount;

this.save(d);

const now=this.rank(d.xp);

if(old!==now){

this.levelPopup(now);

}

if(d.solved>=1) this.badge("First Blood");
if(d.solved>=10) this.badge("Speed Writer");
if(d.solved>=100) this.badge("Century");

},

addSolved(subject,questionId=""){

const d=this.get();

const key=subject+"_"+questionId;

if(questionId && d.done[key]) return;

if(questionId) d.done[key]=true;

d.solved++;

if(subject==="GS1") d.gs1++;
if(subject==="GS2") d.gs2++;
if(subject==="GS3") d.gs3++;
if(subject==="GS4") d.gs4++;

d.lastActivity=subject+" Question Completed";

this.save(d);

this.addXP(5);

},

timerCompleted(){

const d=this.get();

d.lastActivity="7/11 Min Timer Completed";

this.save(d);

this.addXP(10);

},

getProgress(){

return this.get();

}

};

window.Progress=Progress;
