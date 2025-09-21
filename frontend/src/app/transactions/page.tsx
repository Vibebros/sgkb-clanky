'use client'

import { useEffect, useState } from 'react'

interface BankTransaction {
  accountName: string
  textCreditor: string
  amount: string
  valDate: string
  direction: string
  logoUrl: string | null
  logoName: string | null
}

interface GraphQLLogo {
  url?: string | null
  name?: string | null
}

interface GraphQLBankTransaction {
  accountName?: string | null
  textCreditor?: string | null
  amount?: string | number | null
  valDate?: string | null
  direction?: string | number | null
  logo?: GraphQLLogo | null
}

interface GraphQLResponse {
  data?: {
    bankTransactions: GraphQLBankTransaction[]
  }
}

const getInitials = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).slice(0, 2)
  return parts.map((part) => part.charAt(0)).join('').toUpperCase() || '?'
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query Transaction {
                bankTransactions(accountName: "") {
                  accountName
                  textCreditor
                  amount
                  valDate
                  direction
                  logo {
                    url
                    name
                  }
                }
              }
            `
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const payload: GraphQLResponse = await response.json()

        const mappedTransactions: BankTransaction[] = (payload.data?.bankTransactions ?? [])
          .map((transaction) => {
            const direction = transaction.direction
            const amount = transaction.amount

            return {
              accountName: transaction.accountName?.trim() ?? '',
              textCreditor: transaction.textCreditor?.trim() ?? '',
              amount:
                typeof amount === 'number'
                  ? amount.toString()
                  : (amount ?? ''),
              valDate: transaction.valDate ?? '',
              direction: direction !== undefined && direction !== null
                ? String(direction)
                : '',
              logoUrl: transaction.logo?.url ?? null,
              logoName: transaction.logo?.name ?? null,
            }
          })
          .filter(transaction =>
            transaction.accountName &&
            transaction.textCreditor &&
            transaction.amount &&
            transaction.valDate &&
            transaction.direction
          )

        setTransactions(mappedTransactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  if (loading) return <div className="p-6">Loading transactions...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bank Transactions</h1>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500">No complete transactions found.</p>
      ) : (
        <div className="grid gap-4">
          {transactions.map((transaction, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                  {transaction.logoUrl ? (
                    <img
                      src={transaction.logoUrl}
                      alt={transaction.logoName ?? transaction.textCreditor}
                      loading="lazy"
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">
                      {getInitials(transaction.textCreditor)}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${transaction.direction === 'A_1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {transaction.direction === 'A_1' ? 'Incoming' : 'Outgoing'}
                </span>
              </div>
              <div className="grid gap-2">
                <div>
                  <span className="font-semibold text-gray-700">Account:</span>
                  <p className="text-sm text-gray-600">{transaction.accountName}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">Creditor:</span>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{transaction.textCreditor}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-700">Amount:</span>
                    <span className="ml-2 text-lg font-bold text-gray-900">CHF {Math.abs(parseFloat(transaction.amount))}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">{transaction.valDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
