export type CustomerDTO = {
    id?: number
    name: string
    email: string
    cpf: string
    password: string
    phone: string
}


export type CustomerUpdateDTO = {
    name?: string
    cpf?: string 
    phone?: string
}