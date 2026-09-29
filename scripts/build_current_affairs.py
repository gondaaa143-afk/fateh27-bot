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


# =========================================================
# RSS / NEWS DISCOVERY SOURCES
# =========================================================

def google_news_url(domain, days=2):

    query = f"site:{domain} when:{days}d"

    return (
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode({
            "q": query,
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en"
        })
    )


SOURCES = [

    # -----------------------------------------
    # THE HINDU
    # -----------------------------------------

    {
        "name": "The Hindu",
        "url": google_news_url("thehindu.com", 1)
    },


    # -----------------------------------------
    # PIB
    # -----------------------------------------

    {
        "name": "PIB",
        "url":
        "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1"
    },

    {
        "name": "PIB Features",
        "url":
        "https://pib.gov.in/RssMain.aspx?ModId=18&Lang=1&Regid=1"
    },


    # -----------------------------------------
    # MEA
    # -----------------------------------------

    {
        "name": "MEA",
        "url":
        "https://www.mea.gov.in/rss-feeds.htm"
    },


    # -----------------------------------------
    # RBI
    # -----------------------------------------

    {
        "name": "RBI",
        "url":
        "https://www.rbi.org.in/Scripts/rss.aspx"
    },


    # -----------------------------------------
    # PRS INDIA
    # -----------------------------------------

    {
        "name": "PRS India",
        "url":
        google_news_url("prsindia.org", 2)
    },


    # -----------------------------------------
    # MOSPI
    # -----------------------------------------

    {
        "name": "MoSPI",
        "url":
        google_news_url("mospi.gov.in", 2)
    },


    # -----------------------------------------
    # NITI AAYOG
    # -----------------------------------------

    {
        "name": "NITI Aayog",
        "url":
        google_news_url("niti.gov.in", 2)
    },


    # -----------------------------------------
    # ISRO
    # -----------------------------------------

    {
        "name": "ISRO",
        "url":
        google_news_url("isro.gov.in", 2)
    },


    # -----------------------------------------
    # ENVIRONMENT
    # -----------------------------------------

    {
        "name": "MoEFCC",
        "url":
        google_news_url("moef.gov.in", 2)
    },

    {
        "name": "CPCB",
        "url":
        google_news_url("cpcb.nic.in", 2)
    },


    # -----------------------------------------
    # GLOBAL INSTITUTIONS
    # -----------------------------------------

    {
        "name": "United Nations",
        "url":
        google_news_url("un.org", 2)
    },

    {
        "name": "IMF",
        "url":
        google_news_url("imf.org", 2)
    },

    {
        "name": "World Bank",
        "url":
        google_news_url("worldbank.org", 2)
    },

    {
        "name": "WTO",
        "url":
        google_news_url("wto.org", 2)
    }
]


# =========================================================
# FETCH URL
# =========================================================

def fetch_url(url):

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent":
            "Mozilla/5.0 FATEH27 Current Affairs Bot"
        }
    )

    with urllib.request.urlopen(
        req,
        timeout=30
    ) as response:

        return response.read()


# =========================================================
# PARSE RSS / ATOM
# =========================================================

def parse_rss(source_name, url):

    try:

        data = fetch_url(url)

        root = ET.fromstring(data)

        items = []


        # -----------------------------------------
        # RSS
        # -----------------------------------------

        for item in root.findall(".//item"):

            title = item.findtext(
                "title",
                ""
            )

            link = item.findtext(
                "link",
                ""
            )

            description = item.findtext(
                "description",
                ""
            )

            pub_date = item.findtext(
                "pubDate",
                ""
            )

            if title:

                items.append({

                    "source":
                    source_name,

                    "title":
                    title.strip(),

                    "link":
                    link.strip(),

                    "description":
                    description.strip(),

                    "date":
                    pub_date.strip()

                })


        # -----------------------------------------
        # ATOM
        # -----------------------------------------

        if not items:

            ns = {
                "atom":
                "http://www.w3.org/2005/Atom"
            }


            for entry in root.findall(
                ".//atom:entry",
                ns
            ):

                title = entry.findtext(
                    "atom:title",
                    "",
                    ns
                )


                link = ""

                link_el = entry.find(
                    "atom:link",
                    ns
                )


                if link_el is not None:

                    link = link_el.attrib.get(
                        "href",
                        ""
                    )


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

                        "source":
                        source_name,

                        "title":
                        title.strip(),

                        "link":
                        link.strip(),

                        "description":
                        summary.strip(),

                        "date":
                        updated.strip()

                    })


        return items


    except Exception as e:

        print(
            f"RSS error [{source_name}]: {e}"
        )

        return []


# =========================================================
# COLLECT NEWS
# =========================================================

def collect_news():

    all_items = []


    for source in SOURCES:

        print(
            f"Fetching: {source['name']}"
        )


        items = parse_rss(
            source["name"],
            source["url"]
        )


        all_items.extend(items)


    # -----------------------------------------
    # REMOVE DUPLICATES
    # -----------------------------------------

    seen = set()

    unique = []


    for item in all_items:

        key = (
            item["title"]
            .lower()
            .strip()
        )


        if key in seen:

            continue


        seen.add(key)

        unique.append(item)


    # -----------------------------------------
    # LIMIT INPUT
    # -----------------------------------------

    return unique[:120]


# =========================================================
# OPENAI
# =========================================================

def call_openai(news_items):

    api_key = os.environ.get(
        "OPENAI_API_KEY"
    )

    model = os.environ.get(
        "OPENAI_MODEL"
    )


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


    # =====================================================
    # UPSC EDITOR PROMPT
    # =====================================================

    prompt = f"""

You are the Senior UPSC CSE Current Affairs Editor
for FATEH27.

DATE:
{TODAY}


=========================================================
MISSION
=========================================================

Create a high-quality DAILY UPSC CURRENT AFFAIRS
digest from the supplied source material.


=========================================================
TARGET
=========================================================

Generate approximately 15–25 genuinely important
UPSC-relevant items.

Do NOT fill the digest with low-value news merely
to increase the number of articles.


=========================================================
LANGUAGE
=========================================================

Primary language: Hindi.

Important technical terms should remain in English
inside brackets.

Example:

मुद्रास्फीति (Inflation)

राजकोषीय घाटा (Fiscal Deficit)


=========================================================
UPSC LEVEL
=========================================================

This is for UPSC Civil Services Examination.

Do NOT write a generic one-day examination
current-affairs summary.


Focus on:

• UPSC Prelims
• GS1
• GS2
• GS3
• GS4
• Essay
• International Relations
• Economy
• Environment
• Science & Technology
• Polity
• Governance
• Security
• Government Schemes
• Reports and Indices
• Constitutional issues
• Parliament
• Judiciary
• Social issues
• Agriculture
• Internal Security


=========================================================
SOURCE PRIORITY
=========================================================

Prefer information from:

1. Government sources
2. Constitutional/statutory institutions
3. RBI / MoSPI / NITI Aayog
4. MEA
5. ISRO
6. MoEFCC / CPCB
7. PRS
8. UN / IMF / World Bank / WTO
9. The Hindu


=========================================================
THE HINDU RULE
=========================================================

The Hindu may be available only through headline/
RSS discovery.

If the supplied material contains only a headline
or short description:

DO NOT pretend that the complete article was read.

Clearly treat it as headline-level information.

Do not invent article details.


=========================================================
FACTUAL ACCURACY
=========================================================

VERY IMPORTANT:

1. Do not invent facts.
2. Do not invent statistics.
3. Do not invent schemes.
4. Do not invent reports.
5. Do not invent dates.
6. Do not invent institutional decisions.
7. Do not invent PYQ years.
8. Do not create fake quotations.
9. Do not infer unsupported motives.
10. Do not convert opinion into fact.


=========================================================
UPSC VALUE FILTER
=========================================================

Select an item only when it has meaningful value
for at least one of:

• Prelims factual learning
• Mains analytical value
• Static-current linkage
• Government policy
• Constitutional/governance relevance
• Economy
• Environment
• Science
• International Relations
• Security
• Reports/indices
• Essay


=========================================================
CATEGORY
=========================================================

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


=========================================================
PRIORITY
=========================================================

HIGH
MEDIUM


=========================================================
FOR EACH ITEM PROVIDE
=========================================================

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


=========================================================
WHY IN NEWS
=========================================================

Explain the immediate reason the issue is relevant.


=========================================================
WHAT HAPPENED
=========================================================

Give only supported factual information.


=========================================================
BACKGROUND
=========================================================

Explain the relevant static background.

Keep it UPSC-oriented.


=========================================================
PRELIMS
=========================================================

Give factual points such as:

• Institutions
• Locations
• Acts
• Articles
• Constitutional provisions
• Species
• Geography
• Reports
• Indices
• Economic concepts
• Scientific concepts
• International organisations


=========================================================
MAINS
=========================================================

Provide analytical dimensions.

Where relevant include:

• Causes
• Impacts
• Challenges
• Opportunities
• Government response
• Way forward


=========================================================
SYLLABUS
=========================================================

Map the topic to the relevant UPSC syllabus.


=========================================================
STATIC LINK
=========================================================

Explain what static topic should be revised
alongside this current affair.


=========================================================
PYQ LINK
=========================================================

Mention the PYQ THEME that can be connected.

If exact year/question is not certain:

DO NOT INVENT IT.

Write the theme instead.


=========================================================
30 SECOND REVISION
=========================================================

Give a compact revision capsule.


=========================================================
ACTIVE RECALL
=========================================================

Create ONE conceptual question for the student.

The question should test understanding,
not simple copying.


=========================================================
NEWS DATA
=========================================================

{news_text}

"""


    # =====================================================
    # JSON SCHEMA
    # =====================================================

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

                        "headline":
                        {"type": "string"},

                        "source":
                        {"type": "string"},

                        "source_url":
                        {"type": "string"},

                        "category":
                        {"type": "string"},

                        "priority":
                        {"type": "string"},

                        "why_in_news":
                        {"type": "string"},

                        "what_happened":
                        {"type": "string"},

                        "background":
                        {"type": "string"},

                        "prelims":
                        {"type": "string"},

                        "mains":
                        {"type": "string"},

                        "syllabus":
                        {"type": "string"},

                        "static_link":
                        {"type": "string"},

                        "pyq_link":
                        {"type": "string"},

                        "thirty_second_revision":
                        {"type": "string"},

                        "active_recall":
                        {"type": "string"}

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

                    "additionalProperties":
                    False

                }

            }

        },

        "required": [
            "date",
            "items"
        ],

        "additionalProperties":
        False

    }


    # =====================================================
    # OPENAI REQUEST
    # =====================================================

    payload = {

        "model":
        model,

        "input":
        prompt,

        "text": {

            "format": {

                "type":
                "json_schema",

                "name":
                "fateh27_current_affairs",

                "strict":
                True,

                "schema":
                schema

            }

        }

    }


    request = urllib.request.Request(

        "https://api.openai.com/v1/responses",

        data=json.dumps(
            payload
        ).encode("utf-8"),

        headers={

            "Content-Type":
            "application/json",

            "Authorization":
            f"Bearer {api_key}"

        },

        method="POST"

    )


    with urllib.request.urlopen(
        request,
        timeout=240
    ) as response:

        result = json.loads(
            response
            .read()
            .decode("utf-8")
        )


    # =====================================================
    # OUTPUT
    # =====================================================

    output_text = result.get(
        "output_text"
    )


    if output_text:

        return json.loads(
            output_text
        )


    # fallback

    for output in result.get(
        "output",
        []
    ):

        for content in output.get(
            "content",
            []
        ):

            if content.get(
                "type"
            ) == "output_text":

                text = content.get(
                    "text",
                    ""
                )


                if text:

                    return json.loads(
                        text
                    )


    raise RuntimeError(
        "OpenAI returned no usable JSON response."
    )


# =========================================================
# MARKDOWN BUILDER
# =========================================================

def build_markdown(data):

    lines = []


    lines.append(
        "# FATEH27 DAILY CURRENT AFFAIRS"
    )

    lines.append("")

    lines.append(
        f"## {data.get('date', TODAY)}"
    )

    lines.append("")


    lines.append(
        "> UPSC CSE • Prelims + Mains • "
        "The Hindu + PIB + Government Sources "
        "+ Official Institutions"
    )

    lines.append("")


    items = data.get(
        "items",
        []
    )


    lines.append(
        f"**Total Important Items:** {len(items)}"
    )

    lines.append("")

    lines.append("---")

    lines.append("")


    for index, item in enumerate(
        items,
        start=1
    ):

        headline = item.get(
            "headline",
            "Untitled"
        )


        lines.append(
            f"## {index}. {headline}"
        )

        lines.append("")


        lines.append(
            f"**Source:** "
            f"{item.get('source', '')}"
        )

        lines.append("")


        url = item.get(
            "source_url",
            ""
        ).strip()


        if url:

            lines.append(
                f"**Source URL:** {url}"
            )

            lines.append("")


        lines.append(
            f"**Category:** "
            f"{item.get('category', '')}"
        )

        lines.append("")


        lines.append(
            f"**Priority:** "
            f"{item.get('priority', '')}"
        )

        lines.append("")


        sections = [

            (
                "Why in News?",
                "why_in_news"
            ),

            (
                "What Happened?",
                "what_happened"
            ),

            (
                "Background",
                "background"
            ),

            (
                "Prelims Focus",
                "prelims"
            ),

            (
                "Mains Focus",
                "mains"
            ),

            (
                "UPSC Syllabus Link",
                "syllabus"
            ),

            (
                "Static Connection",
                "static_link"
            ),

            (
                "PYQ Connection",
                "pyq_link"
            ),

            (
                "30-Second Revision",
                "thirty_second_revision"
            )

        ]


        for title, key in sections:

            lines.append(
                f"### {title}"
            )

            lines.append(
                item.get(key, "")
            )

            lines.append("")


        lines.append(
            "### Active Recall"
        )

        lines.append(
            f"**Q. "
            f"{item.get('active_recall', '')}**"
        )

        lines.append("")

        lines.append("---")

        lines.append("")


    return "\n".join(lines)


# =========================================================
# MAIN
# =========================================================

def main():

    print("=" * 60)

    print(
        "FATEH27 DAILY CURRENT AFFAIRS"
    )

    print("=" * 60)

    print(
        f"Date: {TODAY}"
    )


    news = collect_news()


    print(
        f"Collected "
        f"{len(news)} unique news items."
    )


    if not news:

        raise RuntimeError(
            "No news was collected from RSS sources."
        )


    data = call_openai(
        news
    )


    markdown = build_markdown(
        data
    )


    os.makedirs(
        "data",
        exist_ok=True
    )


    output_file = (
        "data/current.md"
    )


    with open(

        output_file,

        "w",

        encoding="utf-8"

    ) as file:

        file.write(
            markdown
        )


    print(
        f"Successfully generated: "
        f"{output_file}"
    )


    print(
        f"Items generated: "
        f"{len(data.get('items', []))}"
    )


if __name__ == "__main__":

    main()
