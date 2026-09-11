import { currentAffairs } from "./currentData";

export default function handler(req, res) {
  res.status(200).json(currentAffairs[0]);
}
