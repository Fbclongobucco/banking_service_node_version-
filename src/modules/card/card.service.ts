import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CardType } from './cardDTO';


@Injectable()
export class CardService {

    constructor(private readonly prismaService: PrismaService) {
    }

    async createDebitCard(accountId: number, typeCard: CardType) {
        const account = await this.prismaService.account.findUnique({
            where: {
                id: accountId,
            },
        })


        if (!account) {
            throw new Error('account not found!');
        }

        const generateCardNumber = () =>
            Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();

        const generateCvv = () =>
            Math.floor(100 + Math.random() * 900).toString();

        const generateExpirationDate = (): Date => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 3);
            return date;
        };

        try {
            const debitCard = await this.prismaService.card.create({
                data: {
                    cardNumber: generateCardNumber(),
                    cvv: generateCvv(),
                    cardType: "DEBIT_CARD",
                    expirationDate: generateExpirationDate(),
                    accountId: account.id

                },
                include: {
                    account: true
                }
            })
            return debitCard;
        }
        catch (error) {
            throw new Error("error:" + error)
        };
    }

    async setCreditCard(cardId: number) {
        await this.prismaService.card.update({
            where: {
                id: cardId
            },
            data: {
                cardType: 'CREDIT_CARD'
            }
        }
        )
    }

    async getCardById(cardId: number){
        const card = await this.prismaService.card.findUnique({
            where: {
                id: cardId
            }
        })
        return card
    }


}
