
export default function handler(req, res) {
  res.status(200).json({
    app: "Fateh27",
    status: "working",
    message: "Mini App connected"
  });
}
