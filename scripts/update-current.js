const fs = require("fs");

const data = {
  date: new Date().toISOString().slice(0,10),
  brief: "Today's UPSSC Intelligence Brief",
  articles: [
    {
      id: 1,
      title: "Demo Auto News 1",
      gs: "GS2",
      source: "AI",
      summary: "Automatic workflow working successfully.",
      prelims: [
        "Point 1",
        "Point 2",
        "Point 3"
      ],
      mains: "Use in GS2 answers."
    },
    {
      id: 2,
      title: "Demo Auto News 2",
      gs: "GS3",
      source: "AI",
      summary: "Second automatic news generated.",
      prelims: [
        "Point A",
        "Point B",
        "Point C"
      ],
      mains: "Use in GS3 answers."
    }
  ]
};

fs.writeFileSync(
  "data/current-affairs.json",
  JSON.stringify(data, null, 2)
);

console.log("Current affairs updated.");
