export default function handler(req,res){
 res.status(200).json([
  {year:2026,question:"Discuss India's energy transition strategy."},
  {year:2025,question:"Examine the challenges of food security."}
 ]);
}
