import { AccountDTO } from "../account/accountDTO"

export type CardDTO = {

    id?: number
    account?: AccountDTO
    cardNumber: string
    cvv: string 
    expirationDate: Date
    cardDype: CardType
}

export enum CardType {
    DEBIT_CARD,
    CREDIT_CARD
}