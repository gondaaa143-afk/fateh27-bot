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
# FINAL — 15 TO 25 ARTICLES
# =========================================================

IST = timezone(timedelta(hours=5, minutes=30))
TODAY = datetime.now(IST).strftime("%d %B %Y")


# =========================================================
# SETTINGS
# =========================================================

MAX_SOURCE_ITEMS_PER_SOURCE = 5

MAX_AI_INPUT_ITEMS = 30

MIN_FINAL_ITEMS = 15

TARGET_FINAL_ITEMS = 20

MAX_FINAL_ITEMS = 25

REQUEST_DELAY = 3


# =========================================================
# SOURCE DOMAINS
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
# SOURCE GROUPS
# =========================================================

SOURCES = [

    {
        "name": "The Hindu",
        "url": google_news_url(
            "site:thehindu.com",
            1
        )
    },

    {
        "name": "Indian Government Sources",
        "url": google_news_url(
            "site:pib.gov.in OR "
            "site:rbi.org.in OR "
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

    {
        "name": "International Institutions",
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
# NORMALIZE DOMAIN
# =========================================================

def normalize_domain(url):

    if not url:
        return ""

    try:

        parsed = urllib.parse.urlparse(url)

        domain = parsed.netloc.lower()

        if domain.startswith("www."):
            domain = domain[4:]

        return domain

    except Exception:

        return ""


# =========================================================
# DETECT SOURCE
# =========================================================

def detect_source(url):

    domain = normalize_domain(url)

    for allowed_domain, source_name in ALLOWED_DOMAINS.items():

        if (
            domain == allowed_domain
            or
            domain.endswith("." + allowed_domain)
        ):

            return source_name

    return None


# =========================================================
# FETCH
# =========================================================

def fetch_url(
    url,
    timeout=30,
    retries=3
):

    last_error = None

    for attempt in range(1, retries + 1):

        try:

            print(
                f"    Fetch attempt {attempt}/{retries}"
            )

            request = urllib.request.Request(

                url,

                headers={

                    "User-Agent":
                    "Mozilla/5.0 "
                    "(compatible; FATEH27/3.0)",

                    "Accept":
                    "application/rss+xml,"
                    "application/atom+xml,"
                    "application/xml,"
                    "text/xml,"
                    "*/*",

                    "Accept-Language":
                    "en-IN,en;q=0.9"
                }
            )

            with urllib.request.urlopen(
                request,
                timeout=timeout
            ) as response:

                return response.read()

        except urllib.error.HTTPError as error:

            last_error = error

            if error.code == 429:

                wait_time = min(
                    15 * attempt,
                    60
                )

                print(
                    f"    HTTP 429. "
                    f"Waiting {wait_time}s..."
                )

                time.sleep(wait_time)

                continue

            if error.code in (
                500,
                502,
                503,
                504
            ):

                wait_time = 5 * attempt

                print(
                    f"    HTTP {error.code}. "
                    f"Waiting {wait_time}s..."
                )

                time.sleep(wait_time)

                continue

            print(
                f"    HTTP {error.code}: "
                f"{error.reason}"
            )

            break

        except (
            urllib.error.URLError,
            TimeoutError
        ) as error:

            last_error = error

            wait_time = 4 * attempt

            print(
                f"    Network error: {error}"
            )

            time.sleep(wait_time)

        except Exception as error:

            last_error = error

            print(
                f"    Unexpected error: {error}"
            )

            break

    print(
        f"    Source failed: {last_error}"
    )

    return None


# =========================================================
# CLEAN TEXT
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
# PARSE RSS
# =========================================================

def parse_rss(
    raw,
    group_name
):

    if not raw:
        return []

    try:

        root = ET.fromstring(raw)

    except Exception as error:

        print(
            f"    XML parse failed: {error}"
        )

        return []

    results = []

    for item in root.findall(".//item"):

        title = clean_text(
            item.findtext(
                "title",
                ""
            )
        )

        link = (
            item.findtext(
                "link",
                ""
            )
            or
            ""
        ).strip()

        description = clean_text(
            item.findtext(
                "description",
                ""
            )
        )

        pub_date = (
            item.findtext(
                "pubDate",
                ""
            )
            or
            ""
        ).strip()

        if not title:
            continue

        source_element = item.find(
            "source"
        )

        publisher_name = ""

        publisher_url = ""

        if source_element is not None:

            publisher_name = clean_text(
                source_element.text or ""
            )

            publisher_url = (
                source_element.attrib.get(
                    "url",
                    ""
                )
            )

        actual_source = detect_source(
            publisher_url
        )

        if group_name != "The Hindu":

            if group_name in (
                "Indian Government Sources",
                "International Institutions"
            ):

                if not actual_source:
                    continue

        if actual_source:

            final_source = actual_source

        elif publisher_name:

            final_source = publisher_name

        else:

            final_source = group_name

        results.append({

            "source": final_source,

            "title": title,

            "link": link,

            "description": description,

            "date": pub_date

        })

    return results


# =========================================================
# COLLECT SOURCE
# =========================================================

def collect_source(source):

    name = source["name"]

    print("")
    print("-" * 60)
    print(f"SOURCE: {name}")
    print("-" * 60)

    raw = fetch_url(
        source["url"]
    )

    items = parse_rss(
        raw,
        name
    )

    print(
        f"    Raw items: {len(items)}"
    )

    return items


# =========================================================
# DEDUPLICATION
# =========================================================

def deduplicate(items):

    seen = set()

    unique = []

    for item in items:

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

        if key in seen:
            continue

        seen.add(key)

        unique.append(item)

    return unique


# =========================================================
# BALANCE SOURCES
# =========================================================

def balance_sources(items):

    buckets = {}

    for item in items:

        source = item.get(
            "source",
            "Unknown"
        )

        if source not in buckets:
            buckets[source] = []

        if len(
            buckets[source]
        ) < MAX_SOURCE_ITEMS_PER_SOURCE:

            buckets[source].append(
                item
            )

    balanced = []

    while len(
        balanced
    ) < MAX_AI_INPUT_ITEMS:

        added = False

        for source_name in list(
            buckets.keys()
        ):

            bucket = buckets[
                source_name
            ]

            if bucket:

                balanced.append(
                    bucket.pop(0)
                )

                added = True

            if len(
                balanced
            ) >= MAX_AI_INPUT_ITEMS:

                break

        if not added:
            break

    return balanced


# =========================================================
# COLLECT ALL
# =========================================================

def collect_news():

    raw_items = []

    print("")
    print("=" * 65)
    print(
        "FATEH27 CURRENT AFFAIRS SOURCE COLLECTION"
    )
    print("=" * 65)

    for index, source in enumerate(
        SOURCES
    ):

        items = collect_source(
            source
        )

        raw_items.extend(
            items
        )

        if index < len(SOURCES) - 1:

            print(
                f"    Waiting {REQUEST_DELAY}s..."
            )

            time.sleep(
                REQUEST_DELAY
            )

    unique_items = deduplicate(
        raw_items
    )

    selected_items = balance_sources(
        unique_items
    )

    print("")
    print("=" * 65)
    print("SOURCE SUMMARY")
    print("=" * 65)

    source_counts = {}

    for item in unique_items:

        source = item.get(
            "source",
            "Unknown"
        )

        source_counts[source] = (
            source_counts.get(
                source,
                0
            ) + 1
        )

    for source, count in sorted(
        source_counts.items()
    ):

        print(
            f"{source}: {count}"
        )

    print("")
    print(
        f"RAW ITEMS: {len(raw_items)}"
    )

    print(
        f"UNIQUE ITEMS: {len(unique_items)}"
    )

    print(
        f"SELECTED FOR AI: "
        f"{len(selected_items)}"
    )

    print("=" * 65)

    return selected_items


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
            "OPENAI_API_KEY is missing."
        )

    if not model:

        raise RuntimeError(
            "OPENAI_MODEL is missing."
        )

    source_data = json.dumps(
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
PRIMARY OBJECTIVE
====================================================

Create a DAILY UPSC CURRENT AFFAIRS digest.

Generate between:

MINIMUM: {MIN_FINAL_ITEMS}
TARGET: {TARGET_FINAL_ITEMS}
MAXIMUM: {MAX_FINAL_ITEMS}

Prefer around {TARGET_FINAL_ITEMS} items when the
source material supports them.


====================================================
VERY IMPORTANT
====================================================

The output MUST contain at least
{MIN_FINAL_ITEMS} items if the supplied source
material contains enough distinct relevant news.

Do NOT stop at 8, 9, 10, 11, 12, 13 or 14 items
when additional relevant supplied material exists.

Select additional relevant UPSC items from the
supplied source data until at least
{MIN_FINAL_ITEMS} are reached.

Do NOT create fake news merely to reach the minimum.


====================================================
SOURCE INTEGRITY
====================================================

Use ONLY the supplied information.

Never invent:

• facts
• statistics
• dates
• schemes
• reports
• government decisions
• quotations
• PYQ years
• legal provisions


Preserve the actual source name.


====================================================
THE HINDU
====================================================

The Hindu information may be headline/RSS-level.

Do NOT claim that the complete article was read.

If information is limited, say:

"उपलब्ध headline-level information के आधार पर..."


====================================================
SOURCE DIVERSITY
====================================================

When relevant material exists, distribute coverage
across available sources.

Do not select 15–20 items from only one source if
other relevant source material is supplied.


====================================================
LANGUAGE
====================================================

Primary language:

Hindi

Technical terms:

Hindi + English in brackets.


====================================================
UPSC FOCUS
====================================================

Prioritize:

• Prelims
• GS1
• GS2
• GS3
• GS4
• International Relations
• Economy
• Environment
• Science & Technology
• Polity
• Governance
• Security
• Agriculture
• Government Schemes
• Reports
• Indices
• Social Issues
• Essay


====================================================
CATEGORY
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
EACH ITEM MUST CONTAIN
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
PRELIMS
====================================================

Give concise factual points useful for MCQs.


====================================================
MAINS
====================================================

Give analytical dimensions:

• Causes
• Impacts
• Challenges
• Government response
• Way forward


====================================================
PYQ
====================================================

Do NOT invent an exact PYQ.

If exact PYQ cannot be established:

"Theme connection only — exact PYQ not established."


====================================================
ACTIVE RECALL
====================================================

Give one conceptual UPSC question.


====================================================
SOURCE DATA
====================================================

{source_data}
"""


    schema = {

        "type":
        "object",

        "properties": {

            "date": {
                "type":
                "string"
            },

            "items": {

                "type":
                "array",

                "minItems":
                MIN_FINAL_ITEMS,

                "maxItems":
                MAX_FINAL_ITEMS,

                "items": {

                    "type":
                    "object",

                    "properties": {

                        "headline":
                        {
                            "type":
                            "string"
                        },

                        "source":
                        {
                            "type":
                            "string"
                        },

                        "source_url":
                        {
                            "type":
                            "string"
                        },

                        "category":
                        {
                            "type":
                            "string"
                        },

                        "priority":
                        {
                            "type":
                            "string"
                        },

                        "why_in_news":
                        {
                            "type":
                            "string"
                        },

                        "what_happened":
                        {
                            "type":
                            "string"
                        },

                        "background":
                        {
                            "type":
                            "string"
                        },

                        "prelims":
                        {
                            "type":
                            "string"
                        },

                        "mains":
                        {
                            "type":
                            "string"
                        },

                        "syllabus":
                        {
                            "type":
                            "string"
                        },

                        "static_link":
                        {
                            "type":
                            "string"
                        },

                        "pyq_link":
                        {
                            "type":
                            "string"
                        },

                        "thirty_second_revision":
                        {
                            "type":
                            "string"
                        },

                        "active_recall":
                        {
                            "type":
                            "string"
                        }

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

        "max_output_tokens":
        16000,

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
                f"OPENAI ATTEMPT {attempt}/3"
            )

            print(
                f"AI INPUT ITEMS: "
                f"{len(news_items)}"
            )

            request = urllib.request.Request(

                "https://api.openai.com/v1/responses",

                data=json.dumps(
                    payload
                ).encode(
                    "utf-8"
                ),

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

                response_text = (
                    response
                    .read()
                    .decode(
                        "utf-8"
                    )
                )

            result = json.loads(
                response_text
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

                    if (
                        content.get(
                            "type"
                        )
                        ==
                        "output_text"
                    ):

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

            error_body = ""

            try:

                error_body = (
                    error.read()
                    .decode(
                        "utf-8"
                    )
                )

            except Exception:
                pass

            print("")
            print(
                f"OPENAI HTTP ERROR: "
                f"{error.code}"
            )

            if error_body:

                print(
                    error_body[:2000]
                )

            if error.code == 429:

                wait_time = min(
                    15 * (2 ** (attempt - 1)),
                    60
                )

                print(
                    f"OpenAI rate limit. "
                    f"Waiting {wait_time}s..."
                )

                time.sleep(
                    wait_time
                )

                continue

            if error.code in (
                500,
                502,
                503,
                504
            ):

                wait_time = 10 * attempt

                print(
                    f"OpenAI server error. "
                    f"Waiting {wait_time}s..."
                )

                time.sleep(
                    wait_time
                )

                continue

            raise

        except Exception as error:

            print(
                f"OPENAI ERROR: {error}"
            )

            if attempt < 3:

                time.sleep(
                    10 * attempt
                )

                continue

            raise

    raise RuntimeError(
        "OpenAI failed after retries."
    )


# =========================================================
# MARKDOWN
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
            f"{item.get(
                'headline',
                'Untitled'
            )}"
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
            f"{item.get(
                'active_recall',
                ''
            )}**"
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
    print("=" * 65)
    print(
        "FATEH27 DAILY CURRENT AFFAIRS"
    )
    print(
        "FINAL 15-25 ARTICLE ENGINE"
    )
    print("=" * 65)

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
            "No usable current-affairs data collected."
        )

    print("")
    print(
        f"OPENAI INPUT LIMIT: "
        f"{MAX_AI_INPUT_ITEMS}"
    )

    print(
        f"Selected for AI: "
        f"{len(news)}"
    )

    # -----------------------------------------------------
    # AI
    # -----------------------------------------------------

    data = call_openai(
        news
    )

    # -----------------------------------------------------
    # SAFETY CHECK
    # -----------------------------------------------------

    final_count = len(
        data.get(
            "items",
            []
        )
    )

    print("")
    print(
        f"AI FINAL ITEMS: "
        f"{final_count}"
    )

    if final_count < MIN_FINAL_ITEMS:

        raise RuntimeError(
            f"AI returned only "
            f"{final_count} items. "
            f"Minimum required is "
            f"{MIN_FINAL_ITEMS}."
        )

    if final_count > MAX_FINAL_ITEMS:

        data["items"] = data["items"][
            :MAX_FINAL_ITEMS
        ]

        print(
            f"Trimmed to maximum "
            f"{MAX_FINAL_ITEMS} items."
        )

    # -----------------------------------------------------
    # BUILD MARKDOWN
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
    print("=" * 65)
    print("SUCCESS")
    print("=" * 65)

    print(
        f"Generated: "
        f"{output_file}"
    )

    print(
        f"Final UPSC items: "
        f"{len(data.get('items', []))}"
    )

    print("=" * 65)


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    main()
