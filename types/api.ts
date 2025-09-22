import { Customer, Subscription, Transaction } from "@paddle/paddle-node-sdk"

export interface SubscriptionResponse {
  data?: Subscription[]
  hasMore: boolean
  totalRecords: number
  error?: string
}

export interface TransactionResponse {
  data?: Transaction[]
  hasMore: boolean
  totalRecords: number
  error?: string
}

export interface SubscriptionDetailResponse {
  data?: Subscription
  error?: string
}

export type PaddleCustomerResponse = {
  data?: Customer
  error?: {
    type: string
    code: string
    detail: string
    documentation_url: string
  }
  meta: {
    request_id: string
  }
}
