import { PYQS } from "./pyqsData.js";

export default function handler(req,res){
  res.status(200).json(PYQS.filter(q=>q.paper==="GS2"));
}
