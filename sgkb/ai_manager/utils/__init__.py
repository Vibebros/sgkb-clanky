from django.conf import settings
from openai import OpenAI
from agents import Agent, Runner

from .tools import get_transactions, count_all_transactions, detect_recurring_payments


client = OpenAI(api_key=settings.OPENAI_API_KEY)

agent = Agent(
    name="FinanceAssistant",
    instructions="You are a finance assistant. Use the get_transactions tool to fetch bank transactions.",
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