export type PaymentCardDTO = {
    numCard: string
    cvv: string
    experationDate: Date
    amount: number
    installments?: number
    destinationAccount : string
}