# Clanky


## Setup

Git clone

make venv

activate venv

make install

make redis

make worker

make runserver


## Stack
Backend -> Django
Task Queue -> Celery (Redis)




### example queries


query date{
  bankTransactions(startDate: "2025-03-21", endDate: "2025-03-29") {
    id
    valDate
    amount
  }
}

query twint{
  bankTransactions(
    buchungsArtName: "twint"
  ) {
    id
    valDate
    amount
    buchungsArtName
  }
}


query meier{
  bankTransactions(customerName: "Meier") {
    id
    customerName
    amount
    valDate
  }
}


query minmax{
  bankTransactions(minAmount: 50, maxAmount: 200) {
    id
    valDate
    amount
    customerName
  }
}


query country{
  bankTransactions(acquirerCountryName: "Schweiz") {
    id
    valDate
    amount
    acquirerCountryName
  }
}


query creditor{
  bankTransactions(textCreditor: "Migros") {
    id
    valDate
    amount
    textCreditor
  }
}



### Clanky function tools

from finance.utils.calculate import TransactionCalculator
from finance.models import BankTransaction

# Grab the first 5 transactions
txs = BankTransaction.objects.all()[:5]

# --- Manual add (loop) ---
total = 0
for tx in txs:
    total += tx.amount
print("Manual total:", total)

# --- Using TransactionCalculator ---
calc_total = TransactionCalculator.sum(txs, field="amount")
print("Calculator total:", calc_total)

# Check if both match
print("Equal?", total == calc_total)

# Average
print("Average:", TransactionCalculator.average(txs, field="amount"))

# Median
print("Median:", TransactionCalculator.median(txs, field="amount"))

# Count
print("Count:", TransactionCalculator.count(txs))

# Min / Max transaction
print("Min TX:", TransactionCalculator.min_transaction(txs, field="amount"))
print("Max TX:", TransactionCalculator.max_transaction(txs, field="amount"))


##  Test agent

make shell

from ai_manager import utils

Crtl+D