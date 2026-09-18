import fs from "fs";

const text = `# Daily Current Affairs

Updated: ${new Date().toISOString()}
`;

fs.writeFileSync("data/current.md", text);
console.log("Done");
