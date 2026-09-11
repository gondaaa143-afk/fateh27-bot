export default function handler(req,res){
 res.status(200).json([
  {
   year:2026,
   question:"Discuss the role of Mission Mausam in climate resilience."
  },
  {
   year:2025,
   question:"How does urbanisation affect disaster management?"
  }
 ]);
}
