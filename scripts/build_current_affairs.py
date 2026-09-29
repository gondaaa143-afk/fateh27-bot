import os
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta


# =========================================================
# FATEH27 — DAILY UPSC CURRENT AFFAIRS BUILDER
# =========================================================

IST = timezone(timedelta(hours=5, minutes=30))
TODAY = datetime.now(IST).strftime("%d %B %Y")


# ---------------------------------------------------------
# RSS SOURCES
# ---------------------------------------------------------

SOURCES = [
    {
        "name": "The Hindu",
        "url": (
            "https://news.google.com/rss/search?"
            + urllib.parse.urlencode({
                "q": "site:thehindu.com when:1d",
                "hl": "en-IN",
                "gl": "IN",
                "ceid": "IN:en"
            })
        )
    },
    {
        "name": "PIB",
        "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1"
    },
    {
        "name": "PIB Features",
        "url": "https://pib.gov.in/RssMain.aspx?ModId=18&Lang=1&Regid=1"
    }
]


# ---------------------------------------------------------
# FETCH RSS
# ---------------------------------------------------------

def fetch_url(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 FATEH27 Current Affairs Bot"
        }
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def parse_rss(source_name, url):
    try:
        data = fetch_url(url)
        root = ET.fromstring(data)

        items = []

        # RSS
        for item in root.findall(".//item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            description = item.findtext("description", "")
            pub_date = item.findtext("pubDate", "")

            if title:
                items.append({
                    "source": source_name,
                    "title": title.strip(),
                    "link": link.strip(),
                    "description": description.strip(),
                    "date": pub_date.strip()
                })

        # Atom fallback
        if not items:
            ns = {
                "atom": "http://www.w3.org/2005/Atom"
            }

            for entry in root.findall(".//atom:entry", ns):
                title = entry.findtext("atom:title", "", ns)

                link = ""
                link_el = entry.find("atom:link", ns)

                if link_el is not None:
                    link = link_el.attrib.get("href", "")

                summary = entry.findtext(
                    "atom:summary",
                    "",
                    ns
                )

                updated = entry.findtext(
                    "atom:updated",
                    "",
                    ns
                )

                if title:
                    items.append({
                        "source": source_name,
                        "title": title.strip(),
                        "link": link.strip(),
                        "description": summary.strip(),
                        "date": updated.strip()
                    })

        return items

    except Exception as e:
        print(f"RSS error [{source_name}]: {e}")
        return []


# ---------------------------------------------------------
# COLLECT NEWS
# ---------------------------------------------------------

def collect_news():
    all_items = []

    for source in SOURCES:
        print(f"Fetching: {source['name']}")

        items = parse_rss(
            source["name"],
            source["url"]
        )

        all_items.extend(items)

    # Remove duplicate headlines
    seen = set()
    unique = []

    for item in all_items:
        key = item["title"].lower().strip()

        if key in seen:
            continue

        seen.add(key)
        unique.append(item)

    return unique[:60]


# ---------------------------------------------------------
# OPENAI
# ---------------------------------------------------------

def call_openai(news_items):

    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY secret is missing."
        )

    if not model:
        raise RuntimeError(
            "OPENAI_MODEL secret is missing."
        )

    news_text = json.dumps(
        news_items,
        ensure_ascii=False,
        indent=2
    )

    prompt = f"""
You are the senior UPSC Current Affairs editor for FATEH27.

DATE:
{TODAY}

Create a high-quality DAILY UPSC CURRENT AFFAIRS digest from the supplied news.

TARGET:
12–20 important UPSC-relevant items.

LANGUAGE:
Hindi should be the main language.
Keep important technical terms in English in brackets.

EXAM LEVEL:
UPSC CSE level.
Do NOT create a generic one-day-exam news summary.

PRIORITY:
Select issues relevant to:
- UPSC Prelims
- UPSC Mains GS1
- UPSC Mains GS2
- UPSC Mains GS3
- UPSC Mains GS4
- Essay
- International Relations
- Government schemes
- Economy
- Environment
- Science & Technology
- Polity
- Governance
- Security
- Reports and indices

VERY IMPORTANT:
1. Do not invent facts.
2. Do not invent statistics.
3. Do not invent government schemes.
4. Do not invent report names.
5. Do not claim that you read the full article if only a headline/RSS description is available.
6. For The Hindu items, if only headline/short RSS information is available, clearly treat it as headline-level information.
7. Use only information supported by the supplied material.
8. Explain static background only when it is safe and factually established.
9. Do not add political propaganda or partisan framing.
10. Give UPSC-oriented analysis, not newspaper-style storytelling.

For every selected item provide:

headline
source
source_url
category
priority
why_in_news
what_happened
background
prelims
mains
syllabus
static_link
pyq_link
thirty_second_revision
active_recall

CATEGORY must be one of:
GS1
GS2
GS3
GS4
IR
ECONOMY
ENVIRONMENT
SCIENCE
GOVERNANCE
SECURITY
REPORTS
ESSAY

PRIORITY must be:
HIGH
MEDIUM

PRELIMS:
Give important factual points.

MAINS:
Give analytical points suitable for answer writing.

SYLLABUS:
Mention the relevant UPSC syllabus area.

STATIC_LINK:
Explain the static concept connected with the news.

PYQ_LINK:
Mention the type/theme of UPSC PYQ that can be connected.
Do not invent an exact PYQ year/question if you are not certain.

THIRTY_SECOND_REVISION:
Give a very short revision capsule.

ACTIVE_RECALL:
Create one question that tests the student.

NEWS DATA:
{news_text}
"""

    schema = {
        "type": "object",
        "properties": {
            "date": {
                "type": "string"
            },
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "headline": {"type": "string"},
                        "source": {"type": "string"},
                        "source_url": {"type": "string"},
                        "category": {"type": "string"},
                        "priority": {"type": "string"},
                        "why_in_news": {"type": "string"},
                        "what_happened": {"type": "string"},
                        "background": {"type": "string"},
                        "prelims": {"type": "string"},
                        "mains": {"type": "string"},
                        "syllabus": {"type": "string"},
                        "static_link": {"type": "string"},
                        "pyq_link": {"type": "string"},
                        "thirty_second_revision": {"type": "string"},
                        "active_recall": {"type": "string"}
                    },
                    "required": [
                        "headline",
                        "source",
                        "source_url",
                        "category",
                        "priority",
                        "why_in_news",
                        "what_happened",
                        "background",
                        "prelims",
                        "mains",
                        "syllabus",
                        "static_link",
                        "pyq_link",
                        "thirty_second_revision",
                        "active_recall"
                    ],
                    "additionalProperties": False
                }
            }
        },
        "required": [
            "date",
            "items"
        ],
        "additionalProperties": False
    }

    payload = {
        "model": model,
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "fateh27_current_affairs",
                "strict": True,
                "schema": schema
            }
        }
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.loads(
            response.read().decode("utf-8")
        )

    # Responses API output_text
    output_text = result.get("output_text")

    if output_text:
        return json.loads(output_text)

    # Fallback parser
    for output in result.get("output", []):
        for content in output.get("content", []):
            if content.get("type") == "output_text":
                text = content.get("text", "")
                if text:
                    return json.loads(text)

    raise RuntimeError(
        "OpenAI returned no usable JSON response."
    )


# ---------------------------------------------------------
# MARKDOWN BUILDER
# ---------------------------------------------------------

def build_markdown(data):

    lines = []

    lines.append("# FATEH27 DAILY CURRENT AFFAIRS")
    lines.append("")
    lines.append(f"## {data.get('date', TODAY)}")
    lines.append("")
    lines.append(
        "> UPSC CSE • Prelims + Mains • "
        "The Hindu + PIB based daily digest"
    )
    lines.append("")

    items = data.get("items", [])

    lines.append(f"**Total Important Items:** {len(items)}")
    lines.append("")
    lines.append("---")
    lines.append("")

    for index, item in enumerate(items, start=1):

        headline = item.get("headline", "Untitled")

        lines.append(
            f"## {index}. {headline}"
        )
        lines.append("")

        lines.append(
            f"**Source:** {item.get('source', '')}"
        )
        lines.append("")

        url = item.get("source_url", "").strip()

        if url:
            lines.append(
                f"**Source URL:** {url}"
            )
            lines.append("")

        lines.append(
            f"**Category:** {item.get('category', '')}"
        )
        lines.append("")

        lines.append(
            f"**Priority:** {item.get('priority', '')}"
        )
        lines.append("")

        lines.append("### Why in News?")
        lines.append(
            item.get("why_in_news", "")
        )
        lines.append("")

        lines.append("### What Happened?")
        lines.append(
            item.get("what_happened", "")
        )
        lines.append("")

        lines.append("### Background")
        lines.append(
            item.get("background", "")
        )
        lines.append("")

        lines.append("### Prelims Focus")
        lines.append(
            item.get("prelims", "")
        )
        lines.append("")

        lines.append("### Mains Focus")
        lines.append(
            item.get("mains", "")
        )
        lines.append("")

        lines.append("### UPSC Syllabus Link")
        lines.append(
            item.get("syllabus", "")
        )
        lines.append("")

        lines.append("### Static Connection")
        lines.append(
            item.get("static_link", "")
        )
        lines.append("")

        lines.append("### PYQ Connection")
        lines.append(
            item.get("pyq_link", "")
        )
        lines.append("")

        lines.append("### 30-Second Revision")
        lines.append(
            item.get("thirty_second_revision", "")
        )
        lines.append("")

        lines.append("### Active Recall")
        lines.append(
            f"**Q. {item.get('active_recall', '')}**"
        )
        lines.append("")

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    print("=" * 60)
    print("FATEH27 DAILY CURRENT AFFAIRS")
    print("=" * 60)

    print(f"Date: {TODAY}")

    news = collect_news()

    print(
        f"Collected {len(news)} unique news items."
    )

    if not news:
        raise RuntimeError(
            "No news was collected from RSS sources."
        )

    data = call_openai(news)

    markdown = build_markdown(data)

    os.makedirs("data", exist_ok=True)

    output_file = "data/current.md"

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:
        file.write(markdown)

    print(
        f"Successfully generated: {output_file}"
    )

    print(
        f"Items generated: {len(data.get('items', []))}"
    )


if __name__ == "__main__":
    main()
