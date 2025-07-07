Stocks
[![stocks](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/stocks.ca70f42c.webp)Invest in StocksInvest in stocks, ETFs, IPOs with fast orders. Track returns on your stock holdings and view real-time P&L on your positions.](https://groww.in/stocks)
[IntradayMonitor top intraday performers in real time](https://groww.in/stocks/intraday)[ETFsGet the best of Mutual Funds and flexibility of Stocks](https://groww.in/etfs)[IPOTrack upcoming and ongoing IPOs](https://groww.in/ipo)[MTFsBuy now, pay later](https://groww.in/stocks/mtf)
[Stock ScreenerFilter based on RSI, PE ratio and more](https://groww.in/stocks/filter)[Stock EventsDividends, bonus, buybacks and more](https://groww.in/stocks/calendar)[Demat AccountBegin your stock market journey](https://groww.in/open-demat-account)[Share Market TodayLive news updates from stock market](https://groww.in/share-market-today)
F&O
[![stocks](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/f&o.bb450b70.webp)Trade in Futures & OptionsTrade in F&O using the terminal. View charts, indicators, track your orders , P&L and watchlists in a single space](https://groww.in/futures-and-options)
[IndicesTrack markets across the globe](https://groww.in/indices)[TerminalTrack charts, orders, positions, watchlists in one place](https://groww.in/charts)[Option chainAnalyse chains, view payoffs, create baskets](https://groww.in/options/nifty)
[PledgeGet extra balance for trading](https://groww.in/available-for-pledge)[CommoditiesTrade in Crude Oil, Gold, Silver and more](https://groww.in/commodities)[API tradingSet up and execute trades through our API](https://groww.in/trade-api)
Mutual Funds
[![stocks](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/mutual_funds.9c9cff91.webp)Invest in Mutual FundsInvest in direct mutual funds at zero charges via lump sump investments or SIPs](https://groww.in/mutual-funds)
[Mutual Fund HousesKnow about AMCs, funds, fund managers](https://groww.in/mutual-funds/amc)[NFO’sTrack all active NFOs in one place](https://groww.in/nfo)[Mutual Funds by GrowwMutual funds by Groww designed for your investment goals](https://groww.in/mutual-funds/amc/groww-mutual-funds)
[Mutual Funds screenerFilter funds based on risk, fund size and more](https://groww.in/mutual-funds/filter)[Track FundsImport funds and track all investments in a single place](https://groww.in/track)[Compare Funds](https://groww.in/mutual-funds/compare)
More
[SIP calculatorEstimate returns on a SIP](https://groww.in/calculators/sip-calculator)[Brokerage calculatorEstimate charges for your trade/investment](https://groww.in/calculators/brokerage-calculator)[Margin calculatorEstimate balance needed to buy/sell a stock](https://groww.in/calculators/margin-calculator)
[SWP calculatorReturns on your systematic withdrawal plan](https://groww.in/calculators/swp-calculator)[PricingBrokerage and charges on Groww](https://groww.in/pricing)[Blog](https://groww.in/blog)
Search Groww...
Ctrl+K
Login/Sign up
# VWAP vs TWAP: Key Differences in Trading Strategies
19 June 2025
7 min read
![VWAP vs TWAP: Key Differences in Trading Strategies](https://cms-resources.groww.in/uploads/TAX_SLAB_2025_06_19_T150030_370_11zon_7e98be0779.jpg)
![whatsapp](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/whatsappHover.1d05ff00.svg)
![facebook](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/facebookHover.1b8c6597.svg)
![twitter](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/twitterHover.56240533.svg)
![linkedin](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/linkedinHover.091d2117.svg)
![telegram](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/telegramHover.0ea658cc.svg)
![copyToClipboard](https://assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/copyHover.0edc2b0f.svg)
Everyone is turning towards algorithmic trading. Execution is extremely important to have good returns from algorithmic trading. Two important execution strategies used are VWAP (Volume Weighted Average Price) and TWAP (Time Weighted Average Price). It is important to note that here we are not discussing trading indicators. In fact, these are different mechanisms to execute the algorithms so that the traders can buy and sell large orders more efficiently without disturbing the market.
Both VWAP and TWAP aim to minimise slippage, reduce market impact, and improve the overall execution price. However, they use very different methodologies to do so. So, whether you are a retail trader exploring algorithmic tools or an institutional desk managing large volumes, the complete understanding of VWAP and TWAP is essential so that you can make better trade executions. 
## What is VWAP (Volume Weighted Average Price)?
VWAP or Volume Weighted Average Price is one of the most popular trading execution mechanisms to reduce slippage. The aim of VWAP is to reflect the average price at which a security has traded throughout the day, weighted by volume. This value gives traders a sense of understanding of the average true price that has been traded in the market today. This also means that this is the price at which other traders have paid or received for a stock.
While VWAP is considered a technical indicator, it is widely used by smart money and institutional investors to trade large orders without distorting the market. The basic principle is that when the execution price is close to or better than the VWAP, it suggests the order was executed efficiently.
The formula of VWAP is,
**VWAP = ∑(Price×Volume)​ / ∑(Volume)**
Where:
  * **Price** = Typical price at each interval (usually average of high, low, and close)
  * **Volume** = Number of shares traded at each interval


VWAP is an indicator which is calculated continuously throughout the trading day. For the calculation of VWAP, we can calculate the typical price = (High + Low + Close) / 3. Then we will multiply this by the volume traded during that time interval. Finally, we will keep taking the sum of this (price × volume) across intervals, and divide by the cumulative volume.
Here are some considerations while using VWAP. As a buyer, if the trader is able to buy below VWAP, then he has been able to get a better price than the average market participant. On the other hand, as a seller, selling above VWAP is seen as positive execution. And for institutions, VWAP-based algos help split large orders over time to **avoid price disruption** and ensure fair pricing.
## What is TWAP (Time Weighted Average Price)
TWAP or Time Weighted Average Price is the next execution strategy that spreads an order out evenly over a specified time period. TWAP thus only focuses on time intervals and does not take into account the volume traded during that time.
The main aim of TWAP is similar to VWAP. It is to minimise the impact of a large order on the market by executing small slices at regular intervals. TWAP is usually preferred in those instruments which have low liquidity. 
The formula of TWAP is,
**TWAP = ∑(Price at each interval)/Number of intervals**
Where:
  * The price at each interval is usually the last traded price at that timestamp
  * All intervals are equally weighted (e.g., every 1 minute)


Let us take an example.
Imagine we want to buy 10,000 shares of a stock over 5 hours.
A simple TWAP strategy would break this into equal-sized chunks and execute them at a fixed time interval**.**
So, if we want to trade every 5 minutes, there will be a total of 5 hours x 60/5 = 60 chunks. So, after every 5 minutes, we will place 10000/60 = 167 trades. 
It doesn’t try to “outsmart” the market with timing or volume shifts. Instead, it executes like clockwork, which is exactly what some traders want for stealth or control.
TWAP is especially useful for institutional and algorithmic traders because it offers a deterministic, volume-agnostic execution path. Also, for illiquid stocks, TWAP can help avoid dumping of large orders, which can move a thin order book.
## Key Differences Between VWAP and TWAP
While both TWAP and VWAP help in getting better execution, here are the major differences between them:
**Aspect** |  **VWAP (Volume Weighted Average Price)** |  **TWAP (Time Weighted Average Price)**  
---|---|---  
**Weighting Basis** |  Volume-weighted |  Time-weighted  
**Market Awareness** |  Takes market volume into account |  Ignores market volume  
**Execution Logic** |  Executes more during high-volume periods |  Executes evenly over time  
**Best Use Case** |  When volume is predictable or high |  When market liquidity is low or volume is unpredictable  
**Strategy Type** |  Adaptive (adjusts to volume flow) |  Static (fixed intervals, fixed sizes)  
**Impact on Market** |  Lower if used correctly, but may be gamed in low-volume stocks |  Very low; harder to detect and front-run  
**Preferred By** |  Institutional traders, mutual funds, ETFs |  Hedge funds, proprietary desks, and low-liquidity traders  
**Calculation Complexity** |  More complex due to volume weighting |  Simpler, based only on time  
**Risk of Signalling** |  Medium – can become predictable in low-volume stocks |  Low – less likely to reveal trader intent  
## When Should You Use VWAP?
VWAP is used when the instrument being traded is liquid and we want to benchmark our execution against the market average. It is mostly used when we don’t want to move the price too much, but still want to benefit from favourable volume conditions. Some of the ideal scenarios when VWAP can be used are:
  * **High-volume stocks or ETFS** : More volume essentially means that there are more opportunities to blend into the market activity.
  * **Benchmarking performance** : Mostly for institutional desks, whether they want to evaluate different strategies and algorithms
  * **Minimising slippage** : The main aim is to take large orders while getting minimal slippage
  * **Passive order execution** : There is no rush to take the order quickly


## When Should You Use TWAP?
**TWAP** is best suited when the primary goal is to **minimise market impact** and **execute trades evenly over time**. That means it is especially useful in low-liquidity markets or when dealing with large orders that might distort prices if executed all at once. Some of the ideal scenarios when TWAP can be used are:
  * **Low volume or illiquid assets** : Usually, large orders can have a lot of impact on illiquid stocks, so TWAP spreads the execution to avoid the impact cost.
  * **Minimise signal risk** : Many algorithmic traders do not want to reveal their strategy by placing large orders. TWAP can help avoid attention to large trades.
  * **Volatility-neutral execution** : TWAP can also help in avoiding overreaction to sudden spikes in trading volume. This makes TWAP ideal when the goal is neutrality over precision.


## VWAP vs TWAP: Which One is Better?
The answer depends on your trading objective, market conditions, and liquidity of the asset. Here is a summary of which to choose based on different conditions:
**Goal** |  **Choose VWAP if…** |  **Choose TWAP if…**  
---|---|---  
**Benchmark performance** |  You want to track or beat the average market price |  Less relevant for benchmarking  
**Market impact minimisation** |  You can time orders with volume spikes |  You prefer evenly timed execution  
**Volume reliability** |  Intraday volume is predictable |  Volume is erratic or hard to measure  
**Asset liquidity** |  Highly liquid stocks (e.g., NIFTY50) |  Illiquid/mid-cap/small-cap stocks  
**Stealth execution** |  Not ideal—volume-based orders are visible |  Better—orders are spaced, avoiding detection  
## Common Mistakes While Using VWAP/TWAP
We have discussed that both TWAP and VWAP are extremely powerful execution strategies. However, misusing them can actually lead to more slippage and signalling risks. Here are the common mistakes that traders should avoid while using VWAP:
  * **Trading at the End of Day Using VWAP:** VWAP should mostly be used as an intraday guide. Because there is high volume at the end of the day, VWAP can get skewed, leading to trades that don’t reflect true average price dynamics.
  * **Using VWAP in Illiquid Stocks:** As already mentioned earlier, if the instrument being traded is illiquid, VWAP-based orders may not execute properly or may trigger unfavourable prices.
  * **Ignoring Market Conditions:** It is important to appreciate that VWAP thrives in normal market conditions. So if a trader executes a VWAP strategy during high volatility, news events, or sudden trend shifts, the results might not be profitable.


Similarly, some mistakes that the traders should avoid while using TWAP are:
  * **Blindly Slicing Orders by Time:** TWAP does not take into account the volume of the instrument being traded. So, if the asset is extremely illiquid and the time interval is small, executing the same size may cause slippage if the market is thin.
  * **Not Accounting for News or Events:** If you use TWAP during volatile periods (like earnings announcements), it might trade against strong trends.
  * **Overuse in High-Volume Assets:** TWAP works best when the volumes are moderate. So, if we execute the TWAP strategy in highly liquid stocks, it might not give optimal results, which can be achieved by deploying VWAP instead.
  * **No Dynamic Adjustment:** Basic TWAP doesn’t react to spreads or price movement. Hence, it continues execution mechanically, even in poor conditions.


## Conclusion
As a trader, especially doing algorithmic trading, both VWAP and TWAP are essential tools to increase profitability. However, they serve different purposes. VWAP excels in high-liquidity environments where matching or beating the average market price is the goal. TWAP, on the other hand, shines when stealth, neutrality, or illiquid assets are involved, offering more control over time-based execution. The trader must carefully choose between them to best align based on the execution objective, asset characteristics, and market environment.
Do you like this edition?[LEAVE A FEEDBACK](https://trygroww.typeform.com/to/Do49ICvJ)
![sidebar cta image](https://cms-resources.groww.in/uploads/Algo_Trading_912d5d672a.png)
Automate Your Trading with Ease
Access real-time data, automate strategies and execute trades at scale
[START WITH GROWW API](https://groww.in/trade-api)
Recent Posts
[Travel Food Services Limited ₹2,000 Crore IPO to Open on July 7, 2025: Check Key Details](https://groww.in/blog/travel-food-services-limited-2000-crore-ipo-to-open-on-july-7-2025)[Crizac Limited IPO Day 1: Check GMP, Subscription Status & Key Highlights](https://groww.in/blog/crizac-limited-ipo-day-1)[HDB Financial Services Lists at 13% Premium on NSE & BSE](https://groww.in/blog/hdb-financial-services-lists-at-13-percent-premium-on-nse-and-bse)[Neetu Yoshi IPO Allotment Status: Check Latest GMP, Steps To Verify Status](https://groww.in/blog/neetu-yoshi-ipo-allotment-status)[Sambhv Steel Tubes Shares Makes a Strong Stock Market Debut, Lists at 34% Premium ](https://groww.in/blog/sambhv-steel-tubes-shares-makes-a-strong-stock-market-debut)
Related Posts
[Difference Between High-Frequency Trading and Algorithmic Trading](https://groww.in/blog/hft-vs-algorithmic-trading)[What is High-Frequency Trading? Everything You Need to Know](https://groww.in/blog/what-is-high-frequency-trading)[How AI and Machine Learning Are Changing Trading Strategies](https://groww.in/blog/how-ai-and-machine-learning-are-changing-trading-strategies)[SEBI Regulations on Algorithmic Trading in India](https://groww.in/blog/sebi-regulations-on-algorithmic-trading-in-india)[Algorithmic Trading with Python](https://groww.in/blog/algorithmic-trading-with-python)[Is Algorithmic Trading Legal and Profitable?](https://groww.in/blog/is-algorithmic-trading-legal-and-profitable)[How to Start Algorithmic Trading? Complete Guide](https://groww.in/blog/how-to-start-algorithmic-trading)
All Topics
[
  * Aadhar](https://groww.in/blog/category/aadhar)[
  * Banking](https://groww.in/blog/category/banking)[
  * Crypto](https://groww.in/blog/category/crypto)[
  * FnO](https://groww.in/blog/category/fno)[
  * Gold](https://groww.in/blog/category/gold)[
  * Hindi](https://groww.in/blog/category/hindi)[
  * IPO](https://groww.in/blog/category/ipo)[
  * Journal](https://groww.in/blog/category/journal)[
  * Learn](https://groww.in/blog/category/learn)[
  * Markets](https://groww.in/blog/category/markets)[
  * Mutual Funds](https://groww.in/blog/category/mutual-funds)[
  * News](https://groww.in/blog/category/news)[
  * NFO](https://groww.in/blog/category/nfo)[
  * Personal Finance](https://groww.in/blog/category/personal-finance)[
  * Portfolios](https://groww.in/blog/category/portfolios)[
  * Questions](https://groww.in/blog/category/popular-questions)[
  * Research](https://groww.in/blog/category/research)[
  * Reviews](https://groww.in/blog/category/reviews)[
  * Stocks](https://groww.in/blog/category/stocks)[
  * Tax](https://groww.in/blog/category/tax)[
  * Insurance](https://groww.in/blog/category/insurance)[
  * Trust and Safety](https://groww.in/blog/category/trust-and-safety)[
  * Stock Scoop](https://groww.in/blog/category/stock-scoop)[
  * Commodity Trading](https://groww.in/blog/category/commodity-trading)[
  * Algo Trading](https://groww.in/blog/category/algo-trading)[
  * Corporate Bonds](https://groww.in/blog/category/corporate-bonds)[
  * Demat](https://groww.in/blog/category/demat)

Vaishnavi Tech Park, South Tower, 3rd FloorSarjapur Main Road, Bellandur, Bengaluru – 560103Karnataka
[Contact Us](https://groww.in/help/my-account/searchable/how-to-call-groww-customer-care)
[](https://twitter.com/_groww)[](https://www.instagram.com/groww_official/)[](https://www.facebook.com/growwapp)[](https://in.linkedin.com/company/groww.in)[](http://bit.ly/2rjkBHu)
GROWW
[About Us](https://groww.in/about-us)[Pricing](https://groww.in/pricing)[Blog](https://groww.in/blog)[Media & Press](https://groww.in/press)[Careers](https://groww.in/careers)[Help & Support](https://groww.in/help)[Trust & Safety](https://groww.in/trust-and-safety)
PRODUCTS
[Stocks](https://groww.in/stocks)[F&O](https://groww.in/futures-and-options)[MTF](https://groww.in/stocks/mtf)[ETF](https://groww.in/etfs)[IPO](https://groww.in/ipo)[Credit](https://credit.groww.in)[Mutual Funds](https://groww.in/mutual-funds)[Groww Terminal](https://groww.in/charts)[Stocks Screener](https://groww.in/stocks/filter)[Algo Trading](https://groww.in/trade-api)[Commodities](https://groww.in/commodities)[Groww Digest](https://groww.in/digest)[Demat Account](https://groww.in/open-demat-account)[Groww AMC](https://groww.in/mutual-funds/amc)
© 2016-2025 Groww. All rights reserved.Version: 6.3.1
Share Market
Indices
F&O
Mutual Funds
Funds By Groww
Calculators
IPO
Miscellaneous
[Top Gainers Stocks](https://groww.in/markets/top-gainers)[52 Weeks High Stocks](https://groww.in/markets/52-week-high)[Tata Motors](https://groww.in/stocks/tata-motors-ltd)[NHPC](https://groww.in/stocks/nhpc-ltd)[ITC](https://groww.in/stocks/itc-ltd)[Wipro](https://groww.in/stocks/wipro-ltd)[BSE](https://groww.in/stocks/bse-ltd)[NTPC](https://groww.in/stocks/ntpc-green-energy-ltd)
[Top Losers Stocks](https://groww.in/markets/top-losers)[52 Weeks Low Stocks](https://groww.in/markets/52-week-low)[IREDA](https://groww.in/stocks/indian-renewable-energy-development-agency-ltd-1569588972606)[State Bank of India](https://groww.in/stocks/state-bank-of-india)[Adani Power](https://groww.in/stocks/adani-power-ltd)[CDSL](https://groww.in/stocks/central-depository-services-india-ltd)[Cochin Shipyard](https://groww.in/stocks/cochin-shipyard-ltd)[SJVN](https://groww.in/stocks/sjvn-ltd)
[Most Traded Stocks](https://groww.in/stocks/most-bought-stocks-on-groww)[Stocks Market Calender](https://groww.in/stocks/calendar)[Tata Steel](https://groww.in/stocks/tata-steel-ltd)[Tata Power](https://groww.in/stocks/tata-power-company-ltd)[Bharat Heavy Electricals](https://groww.in/stocks/bharat-heavy-electricals-ltd)[Indian Oil Corporation](https://groww.in/stocks/indian-oil-corporation-ltd)[HUDCO](https://groww.in/stocks/housing-urban-development-corporation-ltd)[SAIL](https://groww.in/stocks/steel-authority-of-india-ltd)
[Stocks Feed](https://groww.in/stock-feed)[Suzlon Energy](https://groww.in/stocks/suzlon-energy-ltd)[Zomato (Eternal)](https://groww.in/stocks/zomato-ltd)[Yes Bank](https://groww.in/stocks/yes-bank-ltd)[Infosys](https://groww.in/stocks/infosys-ltd)[NBCC](https://groww.in/stocks/nbcc-india-ltd)[IRCTC](https://groww.in/stocks/indian-railway-catering-tourism-corpn-ltd)[Share Market Live Update](https://groww.in/share-market-today)
[FII DII Activity](https://groww.in/fii-dii-data)[IRFC](https://groww.in/stocks/indian-railway-finance-corporation-ltd)[Bharat Electronics](https://groww.in/stocks/bharat-electronics-ltd)[HDFC Bank](https://groww.in/stocks/hdfc-bank-ltd)[Vedanta](https://groww.in/stocks/vedanta-ltd)[Reliance Power](https://groww.in/stocks/reliance-power-ltd)[Jaiprakash Power Ventures](https://groww.in/stocks/jaiprakash-power-ventures-ltd)
[NIFTY 50](https://groww.in/indices/nifty)[NIFTY Midcap 100](https://groww.in/indices/nifty-midcap)[NIFTY 100](https://groww.in/indices/nifty-218500)[US Tech 100](https://groww.in/indices/global-indices/nasdaq)[NIFTY Realty](https://groww.in/indices/nifty-realty)[Nikkei index](https://groww.in/indices/global-indices/nikkei)
[SENSEX](https://groww.in/indices/sp-bse-sensex)[NIFTY Smallcap 100](https://groww.in/indices/nifty-smallcap-100)[NIFTY Auto](https://groww.in/indices/nifty-auto)[Dow Jones Futures](https://groww.in/indices/global-indices/dow-jones-futures)[NIFTY PSU Bank](https://groww.in/indices/nifty-psu-bank)[NIFTY FMCG](https://groww.in/indices/nifty-fmcg)
[NIFTY BANK](https://groww.in/indices/nifty-bank)[NIFTY MIDCAP 150](https://groww.in/indices/nifty-midcap-150)[KOSPI Index](https://groww.in/indices/global-indices/kospi)[Dow Jones Index](https://groww.in/indices/global-indices/dow-jones)[Gift Nifty](https://groww.in/indices/global-indices/sgx-nifty)[BSE BANKEX](https://groww.in/indices/sp-bse-bankex)
[India VIX](https://groww.in/indices/india-vix)[NIFTY Pharma](https://groww.in/indices/nifty-pharma)[HANG SENG Index](https://groww.in/indices/global-indices/hang-seng)[BSE 100](https://groww.in/indices/bse-100)[FTSE 100 Index](https://groww.in/indices/global-indices/ftse)[S&P 500](https://groww.in/indices/global-indices/sp-500)
[NIFTY NEXT 50](https://groww.in/indices/nifty-next)[NIFTY Metal](https://groww.in/indices/nifty-metal)[DAX Index](https://groww.in/indices/global-indices/dax)[NIFTY Fin Service](https://groww.in/indices/nifty-financial-services)[CAC Index](https://groww.in/indices/global-indices/cac)[Nifty Pvt Bank](https://groww.in/indices/nifty-pvt-bank)
[NIFTY Bank Options](https://groww.in/options/nifty-bank)[SBI Options](https://groww.in/options/state-bank-of-india)[Bajaj Finance Options](https://groww.in/options/bajaj-finance-ltd)[Axis Bank Options](https://groww.in/options/axis-bank-ltd)[Hindustan Unilever Options](https://groww.in/options/hindustan-unilever-ltd)[NIFTY Bank Futures](https://groww.in/futures/nifty-bank)[Finnifty Futures](https://groww.in/futures/nifty-financial-services)[ITC Futures](https://groww.in/futures/itc-ltd)[ICICI Bank Futures](https://groww.in/futures/icici-bank-ltd)[Biocon Futures](https://groww.in/futures/biocon-ltd)[Indusind Bank Futures](https://groww.in/futures/indusind-bank-ltd)
[NIFTY 50 Options](https://groww.in/options/nifty)[HDFC Bank Options](https://groww.in/options/hdfc-bank-ltd)[Wipro Options](https://groww.in/options/wipro-ltd)[DLF Options](https://groww.in/options/dlf-ltd)[REC Options](https://groww.in/options/rec-ltd)[Yes Bank Futures](https://groww.in/futures/yes-bank-ltd)[Zomato Futures](https://groww.in/futures/zomato-ltd)[Ashok Leyland Futures](https://groww.in/futures/ashok-leyland-ltd)[HDFC Bank Futures](https://groww.in/futures/hdfc-bank-ltd)[UPL Futures](https://groww.in/futures/upl-ltd)[Adani Enterprises Futures](https://groww.in/futures/adani-enterprises-ltd)
[Bse Sensex Options](https://groww.in/options/sp-bse-sensex)[Tata Steel Options](https://groww.in/options/tata-steel-ltd)[NTPC Options](https://groww.in/options/ntpc-ltd)[Bajaj Auto Options](https://groww.in/options/bajaj-auto-ltd)[Indusind Bank Options](https://groww.in/options/indusind-bank-ltd)[Tata Motors Futures](https://groww.in/futures/tata-motors-ltd)[Infosys Futures](https://groww.in/futures/infosys-ltd)[Asian Paints Futures](https://groww.in/futures/asian-paints-ltd)[Lupin Futures](https://groww.in/futures/lupin-ltd)[Cipla Futures](https://groww.in/futures/cipla-ltd)[IDFC First Bank Futures](https://groww.in/futures/idfc-bank-ltd)
[Finnifty Options](https://groww.in/options/nifty-financial-services)[Infosys Options](https://groww.in/options/infosys-ltd)[Asian Paints Options](https://groww.in/options/asian-paints-ltd)[Coal India Options](https://groww.in/options/coal-india-ltd)[Ashok Leyland Options](https://groww.in/options/ashok-leyland-ltd)[Tata Steel Futures](https://groww.in/futures/tata-steel-ltd)[BSE Sensex Futures](https://groww.in/futures/sp-bse-sensex)[Wipro Futures](https://groww.in/futures/wipro-ltd)[DLF Futures](https://groww.in/futures/dlf-ltd)[Bajaj Finance Futures](https://groww.in/futures/bajaj-finance-ltd)[Piramal Enterprises Futures](https://groww.in/futures/piramal-enterprises-ltd)
[Tata Motors Options](https://groww.in/options/tata-motors-ltd)[ITC Options](https://groww.in/options/itc-ltd)[ICICI Bank Options](https://groww.in/options/icici-bank-ltd)[Adani Enterprises Options](https://groww.in/options/adani-enterprises-ltd)[NIFTY 50 Futures](https://groww.in/futures/nifty)[Coal India Futures](https://groww.in/futures/coal-india-ltd)[Axis Bank Futures](https://groww.in/futures/axis-bank-ltd)[Vedanta Futures](https://groww.in/futures/vedanta-ltd)[Reliance Industries Futures](https://groww.in/futures/reliance-industries-ltd)[Hindustan Copper Futures](https://groww.in/futures/hindustan-copper-ltd)
[MF Screener](https://groww.in/mutual-funds/filter)[Debt Mutual Funds](https://groww.in/mutual-funds/debt-funds)[Best Multicap Mutual funds](https://groww.in/mutual-funds/category/best-multi-cap-mutual-funds)[Best Contra Mutual funds](https://groww.in/mutual-funds/category/best-contra-mutual-funds)[Best Conservative Mutual funds](https://groww.in/mutual-funds/category/best-conservative-mutual-funds)[SBI Contra Fund](https://groww.in/mutual-funds/sbi-contra-fund-direct-growth)[Nippon India Nifty 500 Momentum 50 Index Fund](https://groww.in/mutual-funds/nippon-india-nifty-500-momentum-50-index-fund-direct-growth)[HDFC Balanced Advantage Fund](https://groww.in/mutual-funds/hdfc-balanced-advantage-fund-direct-growth)[Quant Mid Cap Fund](https://groww.in/mutual-funds/quant-mid-cap-fund-direct-growth)[Bank of India Small Cap Fund](https://groww.in/mutual-funds/bank-of-india-small-cap-fund-direct-growth)[Quant Multi Asset Fund](https://groww.in/mutual-funds/quant-multi-asset-fund-direct-growth)[Nippon India](https://groww.in/mutual-funds/amc/nippon-india-mutual-funds)[TATA](https://groww.in/mutual-funds/amc/tata-mutual-funds)[Bandhan](https://groww.in/mutual-funds/amc/bandhan-mutual-funds)[Edelweiss](https://groww.in/mutual-funds/amc/edelweiss-mutual-funds)[HSBC](https://groww.in/mutual-funds/amc/hsbc-mutual-funds)[Union](https://groww.in/mutual-funds/amc/union-mutual-funds)[Quantum](https://groww.in/mutual-funds/amc/quantum-mutual-funds)[Shriram](https://groww.in/mutual-funds/amc/shriram-mutual-funds)
[Compare Mutual Funds](https://groww.in/mutual-funds/compare)[Best Debt Mutual funds](https://groww.in/mutual-funds/category/best-debt-mutual-funds)[Best Large Cap Mutual funds](https://groww.in/mutual-funds/category/best-large-cap-mutual-funds)[Best Value Mutual funds](https://groww.in/mutual-funds/category/best-value-mutual-funds)[Parag Parikh Flexi Cap Fund](https://groww.in/mutual-funds/parag-parikh-long-term-value-fund-direct-growth)[HDFC Mid Cap Opportunities Fund](https://groww.in/mutual-funds/hdfc-mid-cap-opportunities-fund-direct-growth)[Motilal Oswal Nifty India Defence Index Fund](https://groww.in/mutual-funds/motilal-oswal-nifty-india-defence-index-fund-direct-growth)[ICICI Prudential India Opportunities Fund](https://groww.in/mutual-funds/icici-prudential-india-opportunities-fund-direct-growth)[Kotak Small Cap Fund](https://groww.in/mutual-funds/kotak-midcap-fund-direct-growth)[Canara Robeco Bluechip Equity Fund](https://groww.in/mutual-funds/canara-robeco-large-cap-fund-direct-growth)[GrowwMF](https://groww.in/mutual-funds/amc/groww-mutual-funds)[Motilal Oswal](https://groww.in/mutual-funds/amc/motilal-oswal-mutual-funds)[Aditya Birla](https://groww.in/mutual-funds/amc/aditya-birla-sun-life-mutual-funds)[Axis](https://groww.in/mutual-funds/amc/axis-mutual-funds)[Bank of India](https://groww.in/mutual-funds/amc/bank-of-india-mutual-funds)[Bajaj Finserv](https://groww.in/mutual-funds/amc/bajaj-finserv-mutual-funds)[Helios](https://groww.in/mutual-funds/amc/helios-mutual-funds)[ITI](https://groww.in/mutual-funds/amc/iti-mutual-funds)[Trust](https://groww.in/mutual-funds/amc/trust-mutual-funds)
[MF Knowledge Centre](https://groww.in/blog/category/mutual-funds)[Best Equity Mutual funds](https://groww.in/mutual-funds/category/best-equity-mutual-funds)[Best Small Cap Mutual funds](https://groww.in/mutual-funds/category/best-small-cap-mutual-funds)[Best Arbitrage Mutual funds](https://groww.in/mutual-funds/category/best-arbitrage-mutual-funds)[Motilal Oswal Midcap Fund](https://groww.in/mutual-funds/motilal-oswal-most-focused-midcap-30-fund-direct-growth)[SBI Small Cap Fund](https://groww.in/mutual-funds/sbi-small-midcap-fund-direct-growth)[HDFC Small Cap Fund](https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth)[Kotak Multicap Fund](https://groww.in/mutual-funds/kotak-multicap-fund-direct-growth)[ICICI Prudential Infrastructure Fund](https://groww.in/mutual-funds/icici-prudential-infrastructure-fund-direct-growth)[Bandhan Nifty Alpha 50 Index Fund](https://groww.in/mutual-funds/bandhan-nifty-alpha-50-index-fund-direct-growth)[SBI](https://groww.in/mutual-funds/amc/sbi-mutual-funds)[Quant](https://groww.in/mutual-funds/amc/quant-mutual-funds)[Mirae Asset](https://groww.in/mutual-funds/amc/mirae-asset-mutual-funds)[DSP](https://groww.in/mutual-funds/amc/dsp-mutual-funds)[Baroda BNP Paribas](https://groww.in/mutual-funds/amc/baroda-bnp-paribas-mutual-funds)[Mahindra Manulife](https://groww.in/mutual-funds/amc/mahindra-manulife-mutual-funds)[Sundaram](https://groww.in/mutual-funds/amc/sundaram-mutual-funds)[Samco](https://groww.in/mutual-funds/amc/samco-mutual-funds)[Taurus](https://groww.in/mutual-funds/amc/taurus-mutual-funds)
[Mutual Fund Houses](https://groww.in/mutual-funds/amc)[Best Hybrid Mutual funds](https://groww.in/mutual-funds/category/best-hybrid-mutual-funds)[Best ELSS Mutual funds](https://groww.in/mutual-funds/category/best-elss-mutual-funds)[Best Dividend Yield Mutual funds](https://groww.in/mutual-funds/category/best-dividend-yield-mutual-funds)[Nippon India Small Cap Fund](https://groww.in/mutual-funds/nippon-india-small-cap-fund-direct-growth)[HDFC Flexi Cap Fund](https://groww.in/mutual-funds/hdfc-equity-fund-direct-growth)[Tata Small Cap Fund](https://groww.in/mutual-funds/tata-small-cap-fund-direct-growth)[Tata Ethical Fund](https://groww.in/mutual-funds/tata-ethical-fund-direct-growth)[Mirae Asset ELSS Tax Saver Fund](https://groww.in/mutual-funds/mirae-asset-elss-tax-saver-fund-direct-growth)[Quant Infrastructure Fund](https://groww.in/mutual-funds/quant-infrastructure-fund-direct-growth)[HDFC](https://groww.in/mutual-funds/amc/hdfc-mutual-funds)[PPFAS](https://groww.in/mutual-funds/amc/ppfas-mutual-funds)[UTI](https://groww.in/mutual-funds/amc/uti-mutual-funds)[Kotak Mahindra](https://groww.in/mutual-funds/amc/kotak-mahindra-mutual-funds)[Zerodha](https://groww.in/mutual-funds/amc/zerodha-mutual-funds)[Invesco](https://groww.in/mutual-funds/amc/invesco-mutual-funds)[Navi](https://groww.in/mutual-funds/amc/navi-mutual-funds)[PGIM](https://groww.in/mutual-funds/amc/pgim-india-mutual-funds)
[Mutual Funds Categories](https://groww.in/mutual-funds/category)[Best MidCap Mutual funds](https://groww.in/mutual-funds/category/best-mid-cap-mutual-funds)[Best Sector Mutual funds](https://groww.in/mutual-funds/category/best-sector-mutual-funds)[Best Aggressive Mutual funds](https://groww.in/mutual-funds/category/best-aggressive-mutual-funds)[Quant Small Cap Fund](https://groww.in/mutual-funds/quant-small-cap-fund-direct-plan-growth)[SBI Magnum Children's Benefit Fund](https://groww.in/mutual-funds/sbi-magnum-children-benefit-plan-direct)[UTI Nifty 50 Index Fund](https://groww.in/mutual-funds/uti-nifty-fund-direct-growth)[JM Flexicap Fund](https://groww.in/mutual-funds/jm-multi-strategy-fund-direct-growth)[HSBC Small Cap Fund](https://groww.in/mutual-funds/hsbc-small-cap-fund-direct-growth)[Franklin India Multi Cap Fund](https://groww.in/mutual-funds/franklin-india-multi-cap-fund-direct-growth)[ICICI Prudential](https://groww.in/mutual-funds/amc/icici-prudential-mutual-funds)[LIC](https://groww.in/mutual-funds/amc/lic-mutual-funds)[Canara Robeco](https://groww.in/mutual-funds/amc/canara-robeco-mutual-funds)[Whiteoak](https://groww.in/mutual-funds/amc/whiteoak-capital-mutual-funds)[Franklin Templeton](https://groww.in/mutual-funds/amc/franklin-templeton-mutual-funds)[NJ](https://groww.in/mutual-funds/amc/nj-mutual-funds)[JM](https://groww.in/mutual-funds/amc/jm-financial-mutual-funds)[360 One](https://groww.in/mutual-funds/amc/360-one-mutual-funds)
[Groww Arbitrage Fund](https://groww.in/mutual-funds/groww-arbitrage-fund-direct-growth)[Groww ELSS Tax Saver Fund](https://groww.in/mutual-funds/groww-elss-tax-saver-fund-direct-growth)[Groww Banking & Financial Services Fund](https://groww.in/mutual-funds/groww-banking-financial-services-fund-direct-growth)[Groww Gold ETF FOF](https://groww.in/mutual-funds/groww-gold-etf-fof-direct-growth)
[Groww Short Duration Fund](https://groww.in/mutual-funds/groww-short-duration-fund-direct-growth)[Groww Aggressive Hybrid Fund](https://groww.in/mutual-funds/groww-aggressive-hybrid-fund-direct-growth)[Groww Nifty Smallcap 250 Index Fund](https://groww.in/mutual-funds/groww-nifty-smallcap-250-index-fund-direct-growth)[Groww Multicap Fund](https://groww.in/mutual-funds/groww-multicap-fund-direct-growth)
[Groww Liquid Fund](https://groww.in/mutual-funds/groww-liquid-fund-direct-growth)[Groww Dynamic Bond Fund](https://groww.in/mutual-funds/groww-dynamic-bond-fund-direct-growth)[Groww Nifty Non Cyclical Consumer Index Fund](https://groww.in/mutual-funds/groww-nifty-non-cyclical-consumer-index-fund-direct-growth)[Groww Nifty India Railways PSU Index Fund](https://groww.in/mutual-funds/groww-nifty-india-railways-psu-index-fund-direct-growth)
[Groww Large Cap Fund](https://groww.in/mutual-funds/groww-large-cap-fund-direct-growth)[Groww Overnight Fund](https://groww.in/mutual-funds/groww-overnight-fund-direct-growth)[Groww Nifty EV & New Age Automotive ETF FoF](https://groww.in/mutual-funds/groww-nifty-ev-new-age-automotive-etf-fof-direct-growth)[Groww Nifty 200 ETF FoF](https://groww.in/mutual-funds/groww-nifty-200-etf-fof-direct-growth)
[Groww Value Fund](https://groww.in/mutual-funds/groww-value-fund-direct-growth)[Groww Nifty Total Market Index Fund](https://groww.in/mutual-funds/groww-nifty-total-market-index-fund-direct-growth)[Groww Nifty India Defence ETF FoF](https://groww.in/mutual-funds/groww-nifty-india-defence-etf-fof-direct-growth)
[SIP Calculator](https://groww.in/calculators/sip-calculator)[Brokerage Calculator](https://groww.in/calculators/brokerage-calculator)[RD Calculator](https://groww.in/calculators/rd-calculator)[HRA Calculator](https://groww.in/calculators/hra-calculator)[Home Loan EMI Calculator](https://groww.in/calculators/home-loan-emi-calculator)
[Lumpsum Calculator](https://groww.in/calculators/lumpsum-calculator)[Margin Calculator](https://groww.in/calculators/margin-calculator)[FD Calculator](https://groww.in/calculators/fd-calculator)[Salary Calculator](https://groww.in/calculators/salary-calculator)
[SWP Calculator](https://groww.in/calculators/swp-calculator)[Stock Average Calculator](https://groww.in/calculators/stock-average-calculator)[EPF Calculator](https://groww.in/calculators/epf-calculator)[TDS Calculator](https://groww.in/calculators/tds-calculator)
[MF Calculator](https://groww.in/calculators/mutual-fund-returns-calculator)[SSY Calculator](https://groww.in/calculators/sukanya-samriddhi-yojana-calculator)[Income Tax Calculator](https://groww.in/calculators/income-tax-calculator)[EMI Calculator](https://groww.in/calculators/emi-calculator)
[Step-Up SIP Calculator](https://groww.in/calculators/step-up-sip-calculator)[PPF Calculator](https://groww.in/calculators/ppf-calculator)[GST Calculator](https://groww.in/calculators/gst-calculator)[Car Loan EMI Calculator](https://groww.in/calculators/car-loan-emi-calculator)
[What is IPO?](https://groww.in/p/what-is-ipo)[What is Grey Market Premium?](https://groww.in/p/what-is-grey-market)
[Open IPOs](https://groww.in/ipo)
[Upcoming IPOs](https://groww.in/ipo/upcoming)
[Closed IPOs](https://groww.in/ipo/closed)
[How to Apply for an IPO](https://groww.in/blog/how-to-invest-in-an-ipo-online)
[NFO](https://groww.in/nfo)[Pricing](https://groww.in/pricing)[Trust & Safety](https://groww.in/trust-and-safety)[Groww Digest](https://groww.in/digest)
[Intraday](https://groww.in/stocks/intraday)[Blog](https://groww.in/blog)[Gold Rates](https://groww.in/gold-rates)[Sitemap](https://groww.in/sitemap)
[Corporate Bonds](https://groww.in/corporate-bonds/ipo)[Media & Press](https://groww.in/press)[Glossary](https://groww.in/p)
[HUF Demat Account](https://groww.in/open-huf-demat-account)[Careers](https://groww.in/careers)[Fixed Deposit](https://groww.in/fixed-deposits/fd-interest-rates)
[About Us](https://groww.in/about-us)[Help & Support](https://groww.in/help)[Recurring Deposit](https://groww.in/recurring-deposit/rd-interest-rates)
Show More
Others:
[NSE](https://www1.nseindia.com/)[BSE](https://www.bseindia.com/)[Terms and Conditions](https://groww.in/terms-and-conditions/)[Policies and Procedures](https://groww.in/p/policies/)[Regulatory & Other Info](https://groww.in/regulatory-and-other-information)[Privacy Policy](https://groww.in/privacy-policy/)[Disclosure](https://groww.in/p/disclosure/)[SMART ODR](https://smartodr.in/)[Download Forms](https://groww.in/download-forms)[Information Security Practices](https://groww.in/p/security)[Investor Charter and Grievance](https://groww.in/investor-charters-and-grievance)[Bug Bounty](https://security.groww.in)
