'use client'

import { useState, useEffect } from 'react'

interface BankTransaction {
  accountName: string
  textCreditor: string
  amount: string
  valDate: string
  direction: string
}

interface GraphQLResponse {
  data: {
    bankTransactions: BankTransaction[]
  }
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
                }
              }
            `
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data: GraphQLResponse = await response.json()
        
        // Filter transactions to only include those with complete data
        const completeTransactions = data.data.bankTransactions.filter(transaction => 
          transaction.accountName && 
          transaction.textCreditor && 
          transaction.amount && 
          transaction.valDate &&
          transaction.direction
        )
        
        setTransactions(completeTransactions)
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
                <div></div>
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