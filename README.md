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

