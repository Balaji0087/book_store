import json


def parse_mcp_response(result) -> list:
    parsed = []

    for item in result.content:
        # Skip empty or non-text items
        if not hasattr(item, "text"):
            continue

        text = item.text.strip()

        if not text:
            continue  # skip empty strings — this was the crash

        try:
            parsed.append(json.loads(text))
        except json.JSONDecodeError:
            # If it's plain text (not JSON), wrap it as a string value
            parsed.append({"message": text})

    return parsed


def normalize(parsed: list):
    if not parsed:
        return {}

    if len(parsed) == 1:
        return parsed[0]  # unwrap single-item list

    return parsed  # return full list for multi-item results