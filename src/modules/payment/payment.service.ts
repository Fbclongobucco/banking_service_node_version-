import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentCardDTO } from './paymentDTO';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
    constructor(private readonly prismaService: PrismaService) {
    }

    async paymentDebitCard(idCard: number, data: PaymentCardDTO) {

        const card = await this.prismaService.card.findUnique({
            where: {
                cardNumber: data.numCard
            }
        })

        if (!card) {
            throw new Error("card not found!")
        }

        if (card.cvv !== data.cvv) {
            throw new Error("Invalid cvv")
        }

        const now = new Date();
        const expiration = new Date(card.expirationDate);
        if (expiration < now) {
            throw new Error("Card is expired!");
        }

        const originAccount = await this.prismaService.account.findUnique({
            where: {
                id: card.accountId
            }
        })


        if (!originAccount) {
            throw new Error("Origin account not found!");
        }

        const destinationAccount = await this.prismaService.account.findUnique({
            where: {
                accountNumber: data.destinationAccount
            }
        })

        if (!destinationAccount) {
            throw new Error("Destination account not found!");
        }

        const amount = new Decimal(data.amount);

        if (originAccount?.balance.lt(new Decimal(amount))) {
            throw new Error("Insufficient balance!");
        }

        await this.prismaService.$transaction([
        this.prismaService.account.update({
            where: {
                id: originAccount.id
            },
            data: {
                balance: originAccount.balance.minus(amount)
            }
        }),
        this.prismaService.account.update({
            where: {
                id: destinationAccount.id
            },
            data: {
                balance: destinationAccount.balance.add(amount)
            }
        })
    ]);

    }
}
