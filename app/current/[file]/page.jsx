export default async function Page({ params }) {

  const url =
    `https://raw.githubusercontent.com/gondaaa143-afk/fateh27-bot/main/data/${params.file}`;

  const text = await fetch(url,{cache:"no-store"}).then(r=>r.text());

  return (
    <main className="min-h-screen bg-[#071b4d] text-white p-4">

      <button
        onClick={()=>history.back()}
        className="mb-4 rounded-lg bg-green-500 px-4 py-2"
      >
        ← Back
      </button>

      <pre className="whitespace-pre-wrap text-sm leading-7">
        {text}
      </pre>

    </main>
  );
}
