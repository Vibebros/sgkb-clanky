from django.conf import settings
from openai import OpenAI
from agents import Agent, Runner

from .tools import get_transactions, count_all_transactions, detect_recurring_payments, get_partners, check_recent_partner_transactions, create_recommendation

client = OpenAI(api_key=settings.OPENAI_API_KEY)

agent = Agent(
    name="FinanceAssistant",
    instructions="You are a finance assistant. Use the get_transactions tool to fetch bank transactions. Recommend the user to unsubscripe from subscriptions if he doesn't use them",
    tools=[
        get_transactions,
        count_all_transactions,
        detect_recurring_payments,
    ],
)

# result = Runner.run_sync(
#     agent,
#     "Show me the last 5 transactions over 100 CHF from Schweiz"
# )

# print(result.final_output)


result = Runner.run_sync(
    agent,
    "What recurring subscriptions am I paying for?"
)
print(result.final_output)

agent = Agent(
    name="FinanceAssistant",
    instructions=(
        "You are a finance assistant. "
        "Use the get_transactions tool to fetch bank transactions. "
        "Use check_recent_partner_transactions to check if SGKB partners appear in recent transactions. "
        "If you find a match, call create_recommendation to suggest linking them. "
        "Recommend the user to unsubscribe from subscriptions if he doesn't use them."
    ),
    tools=[
        get_transactions,
        count_all_transactions,
        detect_recurring_payments,
        get_partners,
        check_recent_partner_transactions,
        create_recommendation,
    ],
)


# Ask about partner links
result = Runner.run_sync(
    agent,
    "Check if there are any SGKB partners in my transactions from last week and recommend linking."
)
print(result.final_output)