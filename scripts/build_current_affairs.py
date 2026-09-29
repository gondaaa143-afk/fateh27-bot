import os
import json
import re
import time
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta


# =========================================================
# FATEH27 DAILY CURRENT AFFAIRS
# SOURCE ENGINE v3
# =========================================================

IST = timezone(timedelta(hours=5, minutes=30))
TODAY = datetime.now(IST).strftime("%d %B %Y")


# =========================================================
# GOOGLE NEWS RSS
# =========================================================

def google_news_url(query, days=2):

    full_query = f"({query}) when:{days}d"

    return (
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode({
            "q": full_query,
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en"
        })
    )


# =========================================================
# SOURCES
#
# IMPORTANT:
# Google News requests are grouped so that we don't make
# 10-15 separate requests and trigger HTTP 429.
# =========================================================

SOURCES = [

    # -----------------------------
    # THE HINDU
    # -----------------------------

    {
        "name": "The Hindu",
        "type": "google",
        "url": google_news_url(
            "site:thehindu.com",
            1
        )
    },


    # -----------------------------
    # PIB
    # -----------------------------

    {
        "name": "PIB",
        "type": "rss",
        "url":
        "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1"
    },

    {
        "name": "PIB Features",
        "type": "rss",
        "url":
        "https://pib.gov.in/RssMain.aspx?ModId=18&Lang=1&Regid=1"
    },


    # -----------------------------
    # RBI
    # -----------------------------

    {
        "name": "RBI",
        "type": "rss",
        "url":
        "https://www.rbi.org.in/Scripts/rss.aspx"
    },


    # -----------------------------
    # INDIAN OFFICIAL SOURCES
    # -----------------------------

    {
        "name": "Indian Official Sources",
        "type": "google",
        "url": google_news_url(
            "site:mea.gov.in OR "
            "site:prsindia.org OR "
            "site:mospi.gov.in OR "
            "site:niti.gov.in OR "
            "site:isro.gov.in OR "
            "site:moef.gov.in OR "
            "site:cpcb.nic.in",
            2
        )
    },


    # -----------------------------
    # INTERNATIONAL SOURCES
    # -----------------------------

    {
        "name": "International Institutions",
        "type": "google",
        "url": google_news_url(
            "site:un.org OR "
            "site:imf.org OR "
            "site:worldbank.org OR "
            "site:wto.org",
            2
        )
    }
]


# =========================================================
# ALLOWED OFFICIAL DOMAINS
# Used to prevent unrelated Google News results.
# =========================================================

ALLOWED_DOMAINS = {

    "thehindu.com": "The Hindu",

    "pib.gov.in": "PIB",

    "rbi.org.in": "RBI",

    "mea.gov.in": "MEA",

    "prsindia.org": "PRS India",

    "mospi.gov.in": "MoSPI",

    "niti.gov.in": "NITI Aayog",

    "isro.gov.in": "ISRO",

    "moef.gov.in": "MoEFCC",

    "cpcb.nic.in": "CPCB",

    "un.org": "United Nations",

    "imf.org": "IMF",

    "worldbank.org": "World Bank",

    "wto.org": "WTO"
}


# =========================================================
# DOMAIN NORMALIZATION
# =========================================================

def normalize_domain(url):

    if not url:
        return ""

    try:

        parsed = urllib.parse.urlparse(
            url
        )

        domain = parsed.netloc.lower()

        if domain.startswith("www."):
            domain = domain[4:]

        return domain

    except Exception:
        return ""


# =========================================================
# DETECT OFFICIAL SOURCE
# =========================================================

def detect_source_from_url(url):

    domain = normalize_domain(url)

    for allowed, name in ALLOWED_DOMAINS.items():

        if (
            domain == allowed
            or domain.endswith("." + allowed)
        ):
            return name

    return None


# =========================================================
# FETCH WITH RETRY + 429 HANDLING
# =========================================================

def fetch_url(
    url,
    timeout=30,
    retries=3
):

    last_error = None


    for attempt in range(
        1,
        retries + 1
    ):

        try:

            print(
                f"  Fetch attempt "
                f"{attempt}/{retries}"
            )


            req = urllib.request.Request(

                url,

                headers={

                    "User-Agent":
                    (
                        "Mozilla/5.0 "
                        "(compatible; FATEH27/3.0; "
                        "+https://github.com/)"
                    ),

                    "Accept":
                    (
                        "application/rss+xml,"
                        "application/atom+xml,"
                        "application/xml,"
                        "text/xml,"
                        "text/html;q=0.9,*/*;q=0.8"
                    ),

                    "Accept-Language":
                    "en-IN,en;q=0.9"
                }
            )


            with urllib.request.urlopen(
                req,
                timeout=timeout
            ) as response:

                return response.read()


        except urllib.error.HTTPError as error:

            last_error = error


            # -------------------------------------
            # 429 RATE LIMIT
            # -------------------------------------

            if error.code == 429:

                retry_after = (
                    error.headers.get(
                        "Retry-After"
                    )
                    if error.headers
                    else None
                )


                try:

                    wait_seconds = int(
                        retry_after
                    )

                except Exception:

                    wait_seconds = (
                        8 * attempt
                    )


                # Don't wait absurdly long
                wait_seconds = min(
                    max(wait_seconds, 5),
                    30
                )


                print(
                    f"  HTTP 429 rate limit. "
                    f"Waiting {wait_seconds}s..."
                )


                time.sleep(
                    wait_seconds
                )

                continue


            # -------------------------------------
            # TEMPORARY SERVER ERRORS
            # -------------------------------------

            if error.code in (
                500,
                502,
                503,
                504
            ):

                wait_seconds = 5 * attempt

                print(
                    f"  HTTP {error.code}. "
                    f"Waiting {wait_seconds}s..."
                )

                time.sleep(
                    wait_seconds
                )

                continue


            # -------------------------------------
            # OTHER HTTP ERRORS
            # -------------------------------------

            print(
                f"  HTTP {error.code}: "
                f"{error.reason}"
            )

            break


        except (
            urllib.error.URLError,
            TimeoutError
        ) as error:

            last_error = error

            wait_seconds = 3 * attempt

            print(
                f"  Network error: {error}"
            )

            print(
                f"  Waiting {wait_seconds}s..."
            )

            time.sleep(
                wait_seconds
            )


        except Exception as error:

            last_error = error

            print(
                f"  Unexpected error: {error}"
            )

            break


    print(
        f"  FAILED after {retries} attempts: "
        f"{last_error}"
    )

    return None


# =========================================================
# CLEAN HTML
# =========================================================

def clean_text(text):

    if not text:
        return ""

    text = re.sub(
        r"<[^>]+>",
        " ",
        text
    )

    text = re.sub(
        r"&nbsp;",
        " ",
        text,
        flags=re.I
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# PARSE RSS / ATOM
# =========================================================

def parse_feed(
    source_name,
    url
):

    raw = fetch_url(
        url
    )


    if not raw:

        return []


    try:

        root = ET.fromstring(
            raw
        )

    except Exception as error:

        print(
            f"  XML parse failed: {error}"
        )

        return []


    items = []


    # =====================================================
    # RSS ITEMS
    # =====================================================

    for item in root.findall(
        ".//item"
    ):

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


        # Google News RSS has <source>
        source_element = item.find(
            "source"
        )


        detected_source = None
        source_home = ""


        if source_element is not None:

            source_text = clean_text(
                source_element.text or ""
            )

            source_url = (
                source_element.attrib.get(
                    "url",
                    ""
                )
            )

            detected_source = (
                detect_source_from_url(
                    source_url
                )
            )


            if detected_source:

                source_name_final = (
                    detected_source
                )

            elif source_text:

                source_name_final = (
                    source_text
                )

            else:

                source_name_final = (
                    source_name
                )


            source_home = source_url


        else:

            source_name_final = (
                source_name
            )


        # For grouped Google News feeds,
        # reject unrelated publishers.

        if (
            source_name == "Indian Official Sources"
            or
            source_name == "International Institutions"
        ):

            if not detected_source:

                continue


        if not title:

            continue


        items.append({

            "source":
            source_name_final,

            "title":
            clean_text(title),

            "link":
            link.strip(),

            "description":
            clean_text(description),

            "date":
            pub_date.strip(),

            "source_home":
            source_home

        })


    # =====================================================
    # ATOM
    # =====================================================

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


            link = ""

            link_element = entry.find(
                "atom:link",
                ns
            )


            if link_element is not None:

                link = (
                    link_element.attrib.get(
                        "href",
                        ""
                    )
                )


            if not title:

                continue


            items.append({

                "source":
                source_name,

                "title":
                clean_text(title),

                "link":
                link,

                "description":
                clean_text(summary),

                "date":
                updated,

                "source_home":
                ""

            })


    return items


# =========================================================
# COLLECT ALL NEWS
# =========================================================

def collect_news():

    all_items = []

    source_stats = {}


    print("")
    print("=" * 70)
    print("COLLECTING CURRENT AFFAIRS")
    print("=" * 70)


    for index, source in enumerate(
        SOURCES,
        start=1
    ):

        name = source["name"]


        print("")
        print(
            f"[{index}/{len(SOURCES)}] "
            f"{name}"
        )


        items = parse_feed(
            name,
            source["url"]
        )


        source_stats[name] = len(
            items
        )


        print(
            f"  Collected: "
            f"{len(items)}"
        )


        all_items.extend(
            items
        )


        # IMPORTANT:
        # Space requests to reduce rate limits.
        if index < len(SOURCES):

            print(
                "  Waiting 3 seconds..."
            )

            time.sleep(3)


    # =====================================================
    # DEDUPLICATION
    # =====================================================

    seen_titles = set()

    unique = []


    for item in all_items:

        title = item.get(
            "title",
            ""
        )


        key = re.sub(
            r"[^a-z0-9]+",
            "",
            title.lower()
        )


        if not key:
            continue


        if key in seen_titles:
            continue


        seen_titles.add(
            key
        )


        unique.append(
            item
        )


    # =====================================================
    # SOURCE SUMMARY
    # =====================================================

    print("")
    print("=" * 70)
    print("SOURCE SUMMARY")
    print("=" * 70)


    for name, count in (
        source_stats.items()
    ):

        print(
            f"{name}: {count}"
        )


    print("")
    print(
        f"RAW ITEMS: {len(all_items)}"
    )

    print(
        f"UNIQUE ITEMS: {len(unique)}"
    )

    print(
        "=" * 70
    )


    # Keep payload manageable
    return unique[:120]


# =========================================================
# OPENAI
# =========================================================

def call_openai(
    news_items
):

    api_key = os.environ.get(
        "OPENAI_API_KEY"
    )

    model = os.environ.get(
        "OPENAI_MODEL"
    )


    if not api_key:

        raise RuntimeError(
            "OPENAI_API_KEY secret missing."
        )


    if not model:

        raise RuntimeError(
            "OPENAI_MODEL secret missing."
        )


    news_text = json.dumps(
        news_items,
        ensure_ascii=False,
        indent=2
    )


    prompt = f"""
You are the Senior UPSC CSE Current Affairs
Editor for FATEH27.

DATE:
{TODAY}


====================================================
OBJECTIVE
====================================================

Create a high-quality daily UPSC Current Affairs
digest from the supplied source material.

Select approximately 15–25 genuinely important
items.

Do NOT add low-value items merely to increase count.


====================================================
SOURCE RULE
====================================================

Use ONLY the supplied information.

Do not invent facts.

Preserve the actual source name.

If an item came from:

The Hindu
PIB
RBI
MEA
PRS India
MoSPI
NITI Aayog
ISRO
MoEFCC
CPCB
United Nations
IMF
World Bank
WTO

keep that source name.


====================================================
THE HINDU LIMITATION
====================================================

The Hindu items may be based on RSS/headline-level
information.

If the supplied information does not contain the
full article, DO NOT claim that the full article
was reviewed.

Use wording such as:

"उपलब्ध headline-level information के आधार पर..."


====================================================
LANGUAGE
====================================================

Primary language:

Hindi

Technical terms:

Hindi + English in brackets.

Example:

राजकोषीय घाटा (Fiscal Deficit)


====================================================
UPSC FOCUS
====================================================

Prioritize:

• Prelims facts
• GS1
• GS2
• GS3
• GS4
• International Relations
• Economy
• Environment
• Science & Technology
• Governance
• Security
• Agriculture
• Government Schemes
• Reports
• Indices
• Constitutional issues
• Social issues
• Essay


====================================================
CATEGORIES
====================================================

Choose one:

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


====================================================
EACH ITEM
====================================================

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


====================================================
PYQ RULE
====================================================

Do not invent exact PYQ years/questions.

If an exact PYQ cannot be established from supplied
material, write:

"Theme connection only — exact PYQ not established."


====================================================
ACTIVE RECALL
====================================================

Create one conceptual UPSC-oriented question.


====================================================
SOURCE MATERIAL
====================================================

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


    # =====================================================
    # OPENAI RETRY
    # =====================================================

    for attempt in range(
        1,
        4
    ):

        try:

            print("")
            print(
                f"OpenAI attempt "
                f"{attempt}/3"
            )


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
                timeout=300
            ) as response:

                result = json.loads(
                    response
                    .read()
                    .decode("utf-8")
                )


            output_text = result.get(
                "output_text"
            )


            if output_text:

                return json.loads(
                    output_text
                )


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
                "OpenAI returned no usable JSON."
            )


        except urllib.error.HTTPError as error:

            if error.code == 429:

                retry_after = (
                    error.headers.get(
                        "Retry-After"
                    )
                    if error.headers
                    else None
                )


                try:

                    wait_seconds = int(
                        retry_after
                    )

                except Exception:

                    wait_seconds = (
                        15 * attempt
                    )


                wait_seconds = min(
                    max(wait_seconds, 10),
                    60
                )


                print(
                    f"OpenAI HTTP 429. "
                    f"Waiting {wait_seconds}s..."
                )


                time.sleep(
                    wait_seconds
                )

                continue


            print(
                f"OpenAI HTTP error "
                f"{error.code}: "
                f"{error.reason}"
            )

            raise


        except Exception as error:

            if attempt == 3:

                raise


            print(
                f"OpenAI error: {error}"
            )

            time.sleep(
                10 * attempt
            )


    raise RuntimeError(
        "OpenAI failed after retries."
    )


# =========================================================
# BUILD MARKDOWN
# =========================================================

def build_markdown(
    data
):

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
        "The Hindu + PIB + RBI + Government "
        "+ International Institutions"
    )

    lines.append("")


    items = data.get(
        "items",
        []
    )


    lines.append(
        f"**Total Important Items:** "
        f"{len(items)}"
    )

    lines.append("")

    lines.append("---")

    lines.append("")


    for index, item in enumerate(
        items,
        start=1
    ):

        lines.append(
            f"## {index}. "
            f"{item.get('headline', 'Untitled')}"
        )

        lines.append("")


        lines.append(
            f"**Source:** "
            f"{item.get('source', '')}"
        )

        lines.append("")


        source_url = item.get(
            "source_url",
            ""
        ).strip()


        if source_url:

            lines.append(
                f"**Source URL:** "
                f"{source_url}"
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
                item.get(
                    key,
                    ""
                )
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


    return "\n".join(
        lines
    )


# =========================================================
# MAIN
# =========================================================

def main():

    print("")
    print("=" * 70)
    print("FATEH27 DAILY CURRENT AFFAIRS ENGINE v3")
    print("=" * 70)
    print(
        f"DATE: {TODAY}"
    )
    print("")


    # -----------------------------------------------------
    # COLLECT
    # -----------------------------------------------------

    news = collect_news()


    if not news:

        raise RuntimeError(
            "No current-affairs source returned usable data."
        )


    print("")
    print(
        f"Sending {len(news)} source items to OpenAI..."
    )


    # -----------------------------------------------------
    # AI
    # -----------------------------------------------------

    data = call_openai(
        news
    )


    # -----------------------------------------------------
    # MARKDOWN
    # -----------------------------------------------------

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


    print("")
    print("=" * 70)
    print("SUCCESS")
    print("=" * 70)

    print(
        f"Generated: {output_file}"
    )

    print(
        f"Final UPSC items: "
        f"{len(data.get('items', []))}"
    )

    print("=" * 70)


if __name__ == "__main__":

    main()
