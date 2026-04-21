from urllib.parse import quote_plus


def build_dictionary_links(term: str) -> dict[str, str]:
    encoded = quote_plus(term)
    return {
        "dict_cc": f"https://www.dict.cc/?s={encoded}",
        "wiktionary": f"https://en.wiktionary.org/wiki/{encoded}",
        "langenscheidt": f"https://en.langenscheidt.com/german-english/{encoded}",
    }
