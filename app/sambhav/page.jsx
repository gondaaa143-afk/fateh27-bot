import { redirect } from "next/navigation";

export default function SambhavPage() {
  redirect("/app-preview.html?sambhav=1");
}
