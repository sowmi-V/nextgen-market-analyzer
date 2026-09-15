import json
from pathlib import Path


def load_client_portfolios():
    project_root = Path(__file__).resolve().parents[2]
    dataset_path = project_root / "data" / "clientportfolio.json"

    if not dataset_path.exists():
        return {
            "valid": False,
            "data": [],
            "error": {
                "message": f"BNP dataset not found: {dataset_path}"
            },
        }

    try:
        with open(dataset_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            return {
                "valid": False,
                "data": [],
                "error": {
                    "message": "BNP dataset must contain a list of clients."
                },
            }

        return {
            "valid": True,
            "data": data,
            "error": None,
        }

    except json.JSONDecodeError as error:
        return {
            "valid": False,
            "data": [],
            "error": {
                "message": "BNP dataset contains invalid JSON.",
                "line": error.lineno,
                "column": error.colno,
                "position": error.pos,
            },
        }


def get_client_portfolio(client_id):
    result = load_client_portfolios()

    if not result["valid"]:
        return None

    for portfolio in result["data"]:
        if portfolio.get("clientId") == client_id:
            return portfolio

    return None