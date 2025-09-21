"""Utilities exposed by the ai_manager package."""

<<<<<<< HEAD
from ..multi_agent import (
    AdvisorOutput,
    ClankyMultiAgentSystem,
    DBResult,
    NormalizedResponse,
    RouteDecision,
    TaskSpec,
    db_searcher_tool,
)
from .tools import (
    count_all_transactions,
    detect_recurring_payments,
    get_transactions,
)
=======
from .tools import get_transactions, count_all_transactions, detect_recurring_payments, get_partners, check_recent_partner_transactions, create_recommendation, get_monthly_balance, recommend_investment_package
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# agent = Agent(
#     name="FinanceAssistant",
#     instructions="You are a finance assistant. Use the get_transactions tool to fetch bank transactions. Recommend the user to unsubscripe from subscriptions if he doesn't use them",
#     tools=[
#         get_transactions,
#         count_all_transactions,
#         detect_recurring_payments,
#     ],
# )
>>>>>>> f0d9712 (fix)

__all__ = [
    "AdvisorOutput",
    "ClankyMultiAgentSystem",
    "DBResult",
    "NormalizedResponse",
    "RouteDecision",
    "TaskSpec",
    "count_all_transactions",
    "detect_recurring_payments",
    "db_searcher_tool",
    "get_transactions",
]

<<<<<<< HEAD
=======
# print(result.final_output)


# result = Runner.run_sync(
#     agent,
#     "What recurring subscriptions am I paying for?"
# )
# print(result.final_output)

# agent = Agent(
#     name="FinanceAssistant",
#     instructions=(
#         "You are a finance assistant. "
#         "Use the get_transactions tool to fetch bank transactions. "
#         "Use check_recent_partner_transactions to check if SGKB partners appear in recent transactions. "
#         "If you find a match, call create_recommendation to suggest linking them. "
#         "Recommend the user to unsubscribe from subscriptions if he doesn't use them."
#     ),
#     tools=[
#         get_transactions,
#         count_all_transactions,
#         detect_recurring_payments,
#         get_partners,
#         check_recent_partner_transactions,
#         create_recommendation,
#     ],
# )



agent = Agent(
    name="FinanceAssistant",
    instructions=(
        "You are a finance assistant. "
        "Use get_transactions to fetch bank transactions. "
        "Use check_recent_partner_transactions to check if SGKB partners appear in recent transactions. "
        "If you find a match, call create_recommendation to suggest linking them. "
        "Use detect_recurring_payments to find subscriptions, and recommend the user to unsubscribe if not used. "
        "At the end of each month, use get_monthly_balance to calculate leftover money and "
        "recommend a package with recommend_investment_package."
        "Direction is 1 for incoming and 2 for outgoing"
    ),
    tools=[
        get_transactions,
        count_all_transactions,
        detect_recurring_payments,
        get_partners,
        check_recent_partner_transactions,
        create_recommendation,
        get_monthly_balance,
        recommend_investment_package,
    ],
)

# Investment advice
# result = Runner.run_sync(
#     agent,
#     "Check my balance for August 2025 and recommend me an investment package."
# )

# Ask about partner links
# result = Runner.run_sync(
#     agent,
#     "Check if there are any SGKB partners in my transactions from last week and recommend linking."
# )
result = Runner.run_sync(
    agent,
    "Generate me a Spotify Wrapped style summary image for this year with my top 3 spending countries and categories."
)

print(result.final_output)
>>>>>>> f0d9712 (fix)
