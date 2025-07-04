import re
import math
from pathlib import Path
from typing import Dict, List, Any, Tuple

import pandas as pd
from neo4j import GraphDatabase, Transaction, basic_auth



"""
CSV ➜ Neo4j loader  (handles boolean reward columns)

Graph model
-----------
(:Bank) -[:ISSUES]-> (:Card {all CSV props})
                 ├─[:BELONGS_TO]->(:Category)
                 ├─[:HAS_BENEFIT]->(:Benefit)    from *any* boolean column True
                 ├─[:HAS_FEATURE]->(:Feature)    from list-like columns
                 └─[:HAS_REWARD]->(:RewardType)  from REWARD_COLS True
"""

from pathlib import Path
from typing   import Dict, List, Any, Tuple
import re
import numpy as np
import pandas as pd
from neo4j    import GraphDatabase, Transaction, basic_auth

# ──────────────── CONFIG ────────────────
CSV_PATH   = Path("cc_feats_V2.csv")
NEO4J_URI  = "neo4j+s://a2cadfbf.databases.neo4j.io"
NEO4J_AUTH = basic_auth("neo4j", "YBzRST4Le7rEU_iLmfnEiyubsAPH2zCgvO_3n86fYbM")   # ← change
BATCH      = 500

REWARD_COLS = [
    "welcome_benefit", "milestone_benefit", "bonus_points",
    "cashback_offer", "voucher_offer",
    "fuel_rewards", "movie_rewards", "travel_rewards",
    "reward_points", "welcome_points"
]
# ─────────────────────────────────────────


# ───────────── helper functions ─────────────
def to_number(val: Any) -> Any:
    if not isinstance(val, str):
        return val
    txt = (val.replace("₹", "")
              .replace("rs.", "")
              .replace("Rs.", "")
              .replace("%", "")
              .replace(",", "")
              .replace("per card", "")
              .strip())
    try:
        return float(txt)
    except ValueError:
        return val.strip() or None


def detect_bool_cols(df: pd.DataFrame) -> List[str]:
    def boolish(v):
        if isinstance(v, (bool, np.bool_)): return True
        if isinstance(v, (int, float)) and v in (0, 1): return True
        if isinstance(v, str) and v.strip().lower() in {"true", "false", "yes", "no", "1", "0"}:
            return True
        return False
    return [
        c for c in df.columns
        if (vals := [v for v in df[c].dropna() if str(v).strip()]) and all(boolish(v) for v in vals)
    ]


def detect_list_cols(df: pd.DataFrame) -> List[str]:
    pat = re.compile(r"(list|feature|reward|benefit|offer)s?$", re.I)
    cols = []
    for c in df.columns:
        s = df[c].astype(str).head(40)
        if s.str.contains(r"\[[^]]*\]").any():
            cols.append(c)
        elif pat.search(c) and s.str.contains(",").any():
            cols.append(c)
    return cols


def normalize_list(cell: Any) -> List[str]:
    if not isinstance(cell, str):
        return []
    txt = cell.strip().lstrip("[").rstrip("]").replace(";", ",")
    return [x.strip() for x in txt.split(",") if x.strip()]


def split_row(
    raw: Dict[str, Any],
    bool_cols: List[str],
    list_cols: List[str]
) -> Tuple[Dict[str, Any], List[str], List[Tuple[str, str]], Dict[str, List[str]]]:

    props:   Dict[str, Any]         = {}
    flags:   List[str]              = []
    rewards: List[Tuple[str, str]]  = []
    lists:   Dict[str, List[str]]   = {}

    for col, val in raw.items():

        # ① boolean → benefit flag
        if col in bool_cols:
            truthy = str(val).strip().lower() in {"true", "yes", "1"} or (isinstance(val, (bool, np.bool_)) and val)
            props[col] = truthy
            if truthy:
                flags.append(col)

            # if this boolean column is ALSO in REWARD_COLS, treat it as reward
            if col in REWARD_COLS and truthy:
                rewards.append((col, "Applicable"))
            continue

        # ② list-like → features
        if col in list_cols:
            items = normalize_list(val)
            lists[col] = items
            props[col] = val
            continue

        # ③ everything else → property
        props[col] = to_number(val)

    return props, flags, rewards, lists


# ────────────── Cypher helpers ─────────────
def create_schema(tx: Transaction):
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (b:Bank)       REQUIRE b.name IS UNIQUE;")
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (c:Card)       REQUIRE c.name IS UNIQUE;")
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (cat:Category) REQUIRE cat.name IS UNIQUE;")
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (f:Feature)    REQUIRE f.name IS UNIQUE;")
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (bn:Benefit)   REQUIRE bn.name IS UNIQUE;")
    tx.run("""
        CREATE CONSTRAINT IF NOT EXISTS
        FOR (r:RewardType) REQUIRE (r.type, r.details) IS NODE KEY;
    """)


def ingest_batch(tx: Transaction, rows: List[Dict[str, Any]]):
    tx.run("""
    UNWIND $rows AS row
      MERGE (b:Bank {name: row.bank})
      MERGE (c:Card {name: row.card})
      SET   c += row.props
      MERGE (b)-[:ISSUES]->(c)

      WITH c, row WHERE row.cat <> ''
      MERGE (cat:Category {name: row.cat})
      MERGE (c)-[:BELONGS_TO]->(cat)

      // benefits
      WITH c, row
      UNWIND row.flags AS flag
        MERGE (bn:Benefit {name: flag})
        MERGE (c)-[:HAS_BENEFIT]->(bn)

      // features
      WITH c, row
      UNWIND keys(row.lists) AS lc
        UNWIND row.lists[lc] AS item
          MERGE (f:Feature {name: item})
          MERGE (c)-[:HAS_FEATURE]->(f)

      // rewards (boolean columns marked True)
      WITH c, row
      UNWIND row.rewards AS rp
        WITH c, rp
        WHERE size(rp) = 2
        MERGE (rt:RewardType {type: rp[0], details: rp[1]})
        MERGE (c)-[:HAS_REWARD]->(rt);
    """, rows=rows)


# ─────────────── main loader ───────────────
def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(CSV_PATH)

    df = pd.read_csv(CSV_PATH)

    bool_cols = detect_bool_cols(df)
    list_cols = detect_list_cols(df)

    print("Boolean columns:", bool_cols)
    print("List columns   :", list_cols)

    driver = GraphDatabase.driver(NEO4J_URI, auth=NEO4J_AUTH)
    with driver.session() as session:
        session.execute_write(create_schema)

        rows = df.to_dict(orient="records")
        total = len(rows)
        inserted = 0
        reward_pairs = 0

        for start in range(0, total, BATCH):
            batch_rows = []
            for raw in rows[start:start + BATCH]:
                name = str(raw.get("card_name", "")).strip().strip('"')
                if not name:
                    continue

                props, flags, rewards, lists = split_row(raw, bool_cols, list_cols)
                reward_pairs += len(rewards)

                batch_rows.append({
                    "bank": str(raw.get("bank_name", "")).strip(),
                    "card": name,
                    "cat": str(raw.get("card_category", "")).strip(),
                    "props": props,
                    "flags": flags,
                    "lists": lists,
                    "rewards": rewards,
                })

            if batch_rows:
                session.execute_write(ingest_batch, batch_rows)
                inserted += len(batch_rows)
                print(f"Imported {inserted}/{total}")

        print(f"✅ DONE — card nodes {inserted}, reward pairs inserted {reward_pairs}")

    driver.close()


if __name__ == "__main__":
    main()



