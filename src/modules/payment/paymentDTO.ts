export type PaymentCardDTO = {
    numCard: string
    cvv: string
    experationDate: Date
    amount: number
    installments?: number
    destinationAccount : string
}

export type ReceivePaymentDTO = {
 
  numAccount: string  
  destination: string; 
  amount: number;
  barcode?: string;
  description: string; 
}

export type PaymentBarCodeDTO = {
  accountId: number
  productDescription: string
  amount: number
  barcode: string
}

