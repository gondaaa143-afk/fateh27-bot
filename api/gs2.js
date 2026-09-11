export default function handler(req,res){
 res.status(200).json([
  {
   year:2026,
   question:"Discuss the role of cooperative federalism."
  },
  {
   year:2025,
   question:"Examine the importance of local governance."
  }
 ]);
}
