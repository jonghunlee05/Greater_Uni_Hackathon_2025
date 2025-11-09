import time
import json
import pathlib
import re
import requests
from datetime import datetime
from typing import List, Optional, Dict
import yfinance as yf
import random

# -----------------------
# Prism API config
# -----------------------
URL = "www.prism-challenge.com"
PORT = 8082
TEAM_API_CODE = "its a secret shhhh"


# -----------------------
# Lime API
# -----------------------
LIME_CONFIG_PATH = pathlib.Path("limex_credentials.json")
USE_LIME = LIME_CONFIG_PATH.exists()
lime_creds = {}
if USE_LIME:
    with open(LIME_CONFIG_PATH, "r") as f:
        lime_creds = json.load(f)
        print("✅ Lime credentials loaded.")

# -----------------------
# Prism helpers
# -----------------------
def send_get_request(path: str):
    headers = {"X-API-Code": TEAM_API_CODE}
    try:
        response = requests.get(f"http://{URL}:{PORT}{path}", headers=headers, timeout=10)
        if response.status_code != 200:
            return False, f"Error [{response.status_code}]: {response.text}"
        return True, response.text
    except Exception as e:
        return False, f"Network error: {e}"

def send_post_request(path: str, data=None):
    headers = {"X-API-Code": TEAM_API_CODE, "Content-Type": "application/json"}
    data = json.dumps(data)
    try:
        response = requests.post(f"http://{URL}:{PORT}{path}", data=data, headers=headers, timeout=10)
        if response.status_code != 200:
            return False, f"Error [{response.status_code}]: {response.text}"
        return True, response.text
    except Exception as e:
        return False, f"Network error: {e}"

def get_context():
    return send_get_request("/request")

def get_my_current_information():
    return send_get_request("/info")

def send_portfolio(weighted_stocks):
    if not weighted_stocks:
        print("⚠️ Portfolio is empty, cannot submit")
        return False, "Portfolio empty"
    print("Submitting portfolio JSON:")
    print(json.dumps(weighted_stocks, indent=2))
    return send_post_request("/submit", data=weighted_stocks)

# -----------------------
# Market price helper
# -----------------------
def get_market_price(ticker: str) -> Optional[float]:
    try:
        info = yf.Ticker(ticker).info or {}
        return float(info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose"))
    except:
        return None

# -----------------------
# RL portfolio logic
# -----------------------
TOP_STOCKS = ["NVDA", "TSLA", "AAPL"]
Q_VALUES: Dict[str, float] = {stock: 1.0 for stock in TOP_STOCKS}  # initial Q-values
LEARNING_RATE = 0.1
EPSILON = 0.2  # chance to explore random stock

def build_rl_portfolio(budget: float, q_values: Dict[str, float]) -> List[Dict]:
    """
    Allocate budget across top stocks using epsilon-greedy RL.
    Proportional allocation based on Q-values.
    """
    portfolio = []
    remaining = budget

    # Choose primary stock (explore/exploit)
    if random.random() < EPSILON:
        chosen_stock = random.choice(TOP_STOCKS)
        print(f"🎲 Exploring: primary stock {chosen_stock}")
    else:
        chosen_stock = max(q_values, key=q_values.get)
        print(f"🚀 Exploiting: primary stock {chosen_stock} with Q={q_values[chosen_stock]:.2f}")

    # Allocate majority (70%) to chosen stock
    price = get_market_price(chosen_stock)
    if price:
        allocation = remaining * 0.7
        qty = int(allocation // price)
        if qty > 0:
            portfolio.append({"ticker": chosen_stock, "quantity": qty})
            remaining -= qty * price

    # Allocate remaining budget proportionally across other stocks
    other_stocks = [s for s in TOP_STOCKS if s != chosen_stock]
    total_q = sum(q_values[s] for s in other_stocks)
    for stock in other_stocks:
        price = get_market_price(stock)
        if price and total_q > 0:
            allocation = remaining * (q_values[stock] / total_q)
            qty = int(allocation // price)
            if qty > 0:
                portfolio.append({"ticker": stock, "quantity": qty})
                remaining -= qty * price

    return portfolio

def update_q_values(q_values: Dict[str, float], portfolio: List[Dict], reward: float):
    """
    Update Q-values for each stock in portfolio based on normalized reward.
    """
    for item in portfolio:
        ticker = item["ticker"]
        old_q = q_values.get(ticker, 1.0)
        q_values[ticker] = old_q + LEARNING_RATE * (reward - old_q)
        print(f"Updated Q[{ticker}] = {q_values[ticker]:.2f}")

# -----------------------
# Main RL loop
# -----------------------
def main_loop_rl(target_points=1000000, delay_seconds=5):
    while True:
        # Get current team info
        success, info = get_my_current_information()
        print("Team info:", info if success else f"Error: {info}")

        current_points = 0
        if success:
            try:
                team_data = json.loads(info)
                current_points = team_data.get("points", 0)
                if current_points >= target_points:
                    print(f"🎯 Target points {target_points} reached! Stopping bot.")
                    break
            except:
                pass

        # Get investor context
        success, context = get_context()
        if not success:
            print("Error fetching context:", context)
            time.sleep(delay_seconds)
            continue
        ctx = json.loads(context)
        msg = ctx.get("message", "").lower()

        # Extract budget
        budget_match = re.search(r'\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?', msg)
        budget = float(budget_match.group(1).replace(',', '')) if budget_match else 10000.0
        print(f"Budget: ${budget:.2f}")

        # Build RL portfolio
        portfolio = build_rl_portfolio(budget, Q_VALUES)
        total_cost = sum(item["quantity"] * get_market_price(item["ticker"]) for item in portfolio)
        print(f"\nGenerated RL portfolio ({len(portfolio)} stocks):")
        for item in portfolio:
            print(f"  {item['ticker']}: {item['quantity']} shares")
        print(f"Total cost: ${total_cost:.2f}")
        print(f"Cash leftover: ${budget - total_cost:.2f}")

        # Submit portfolio
        if portfolio:
            success, response = send_portfolio(portfolio)
            print("\n" + ("✅ Submission successful!" if success else "❌ Submission error:"), response)
            # Reward = points gained (including satisfaction)
            reward = 0
            if success:
                try:
                    success2, info2 = get_my_current_information()
                    if success2:
                        new_points = json.loads(info2).get("points", current_points)
                        reward = (new_points - current_points) / max(current_points, 1)
                except:
                    reward = 0.01  # minimal fallback reward
            update_q_values(Q_VALUES, portfolio, reward)
        else:
            print("Portfolio empty, skipping submission.")

        # Wait before next cycle
        print(f"\n⏳ Waiting {delay_seconds} seconds before next cycle...\n")
        time.sleep(delay_seconds)

if __name__=="__main__":
    TARGET_POINTS = 1000000
    print(f"🎯 RL loop target: {TARGET_POINTS} points\n")
    main_loop_rl(target_points=TARGET_POINTS, delay_seconds=5)
