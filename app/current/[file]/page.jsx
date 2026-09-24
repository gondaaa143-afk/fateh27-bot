export default async function Page({ params }) {
  const file = params.file;

  const url = `https://raw.githubusercontent.com/gondaaa143-afk/fateh27-bot/main/data/${file}`;

  const res = await fetch(url, { cache: "no-store" });

  const text = res.ok ? await res.text() : "आज का Current Affairs उपलब्ध नहीं है।";

  return (
    <main className="min-h-screen bg-[#071b4d] text-white p-5">
      <a
        href="/current"
        className="inline-block mb-5 rounded-lg bg-green-500 px-4 py-2 font-semibold"
      >
        ← Back
      </a>

      <pre className="whitespace-pre-wrap text-sm leading-7">
        {text}
      </pre>
    </main>
  );
}
