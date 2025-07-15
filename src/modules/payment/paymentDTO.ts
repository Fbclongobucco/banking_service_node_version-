export type PaymentCardDTO = {
    numCard: string
    cvv: string
    experationDate: Date
    amount: number
    installments?: number
    destinationAccount : string
}

export class ReceivePaymentDTO {
 
  numAccount: string  

  destination: string; 
 
  amount: string;

  barcode?: string; 
}
