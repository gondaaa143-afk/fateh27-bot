const fs=require("fs");

const today=new Date().toISOString().slice(0,10);

const data={
  date:today,
  brief:"Today's UPSC Intelligence Brief",
  articles:[
    {
      id:1,
      title:"Waiting for Daily Update",
      gs:"GS3",
      source:"AI",
      summary:"7 PM par automatic update aayega.",
      prelims:["Daily Update"],
      mains:"UPSC value addition."
    }
  ]
};

fs.mkdirSync("data",{recursive:true});
fs.writeFileSync(
  "data/current-affairs.json",
  JSON.stringify(data,null,2)
);

console.log("Current Affairs Updated");
