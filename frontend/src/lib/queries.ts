import { gql } from '@apollo/client';

export const GET_BANK_TRANSACTIONS = gql`
  query Transaction {
    bankTransactions(accountName: "") {
      accountName
      textCreditor
      amount
      valDate
    }
  }
`;
