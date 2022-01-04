# Telegram bot to track your investment portfolio daily changes 

## Required environment variables

- DATABASE_URL - PostgreSQL connection string
- TELEGRAM_API_TOKEN - Auth token for bot, can be retrivied from [Botfather](https://core.telegram.org/bots#6-botfather)
- MY_TELEGRAM_ID - We don't want others to get info about our portfolio
- STOCK_MARKET_API_URL - API url to fetch market data. In this app [MOEX API](https://iss.moex.com/iss/reference/) is used, but you can use whatever you want
- LAST_UPDATED - date when you updated your portfolio
- TOTAL_INVESTMENTS - to calculate each security share in the portfolio
