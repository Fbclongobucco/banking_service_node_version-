import { CardDTO } from "../card/cardDTO"
import { CustomerDTO } from "../customer/customerDTO"

export type AccountDTO = {
    id?: number
    customer?: CustomerDTO
    accountNumber: number
    balance: number
    creditLimit: number
    pixKey?: string
    cards?: CardDTO[]
}