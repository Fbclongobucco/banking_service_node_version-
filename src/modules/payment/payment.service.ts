import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentBarCodeDTO, PaymentCardDTO, ReceivePaymentDTO } from './paymentDTO';
import { Decimal } from '@prisma/client/runtime/library';
import { CardType } from 'generated/prisma';

@Injectable()
export class PaymentService {
    constructor(private readonly prismaService: PrismaService) {
    }



    private calculateTaxCredit(data: PaymentCardDTO): Decimal {
        const amount = new Decimal(data.amount);

        if (!data.installments || data.installments <= 1) {
            return amount;
        }

        if (data.installments > 12) {
            throw new BadRequestException('Número máximo de parcelas é 12.');
        }

        const interestRate = new Decimal(0.02); // 2% ao mês
        const multiplier = Decimal.pow(interestRate.add(1), data.installments); // (1 + 0.02)^n

        return amount.mul(multiplier).toDecimalPlaces(2); // Arredonda para 2 casas
    }


    async paymentCrediCard(id: number, data: PaymentCardDTO) {
        const card = await this.prismaService.card.findUnique({
            where: { cardNumber: data.numCard },
        });

        if (!card) throw new NotFoundException('Card not found!');
        if (card.cardType !== CardType.CREDIT_CARD)
            throw new BadRequestException('This card is not enabled for credit.');
        if (card.cvv !== data.cvv) throw new BadRequestException('Invalid CVV');

        const expiration = new Date(card.expirationDate);
        if (expiration < new Date()) throw new BadRequestException('Card is expired!');

        const originAccount = await this.prismaService.account.findUnique({
            where: { id: card.accountId },
        });

        if (!originAccount) throw new NotFoundException('Origin account not found!');

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.destinationAccount },
        });

        if (!destinationAccount) throw new NotFoundException('Destination account not found!');

        const totalAmount = this.calculateTaxCredit(data); // valor com juros

        if (originAccount.balance.lt(totalAmount)) {
            throw new BadRequestException('Insufficient balance!');
        }

        await this.prismaService.$transaction([
            this.prismaService.account.update({
                where: { id: originAccount.id },
                data: { balance: originAccount.balance.minus(totalAmount) },
            }),
            this.prismaService.account.update({
                where: { id: destinationAccount.id },
                data: { balance: destinationAccount.balance.add(data.amount) },
            }),
        ]);
    }

    async receiveByBarCode(data: ReceivePaymentDTO) {
        if (!data.barcode || data.barcode.length < 44) {
            throw new BadRequestException('Código de barras inválido!');
        }

        const originAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.numAccount },
        });

        if (!originAccount) {
            throw new NotFoundException('Conta de origem não encontrada!');
        }

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.destination },
        });

        if (!destinationAccount) {
            throw new NotFoundException('Conta destino não encontrada!');
        }

        const amount = new Decimal(data.amount);

        if (originAccount.balance.lt(amount)) {
            throw new BadRequestException('Saldo insuficiente na conta de origem!');
        }

        await this.prismaService.$transaction([
            this.prismaService.account.update({
                where: { id: originAccount.id },
                data: {
                    balance: originAccount.balance.minus(amount),
                },
            }),
            this.prismaService.account.update({
                where: { id: destinationAccount.id },
                data: {
                    balance: destinationAccount.balance.add(amount),
                },
            }),
        ]);
    }

    async receiveByPix(data: ReceivePaymentDTO) {
        const originAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.numAccount },
        });

        if (!originAccount) {
            throw new NotFoundException('Chave Pix de origem não encontrada!');
        }

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { pixKey: data.destination },
        });

        if (!destinationAccount) {
            throw new NotFoundException('Chave Pix de destino não encontrada!');
        }

        const amount = new Decimal(data.amount);

        if (originAccount.balance.lt(amount)) {
            throw new BadRequestException('Saldo insuficiente na conta de origem!');
        }

        await this.prismaService.$transaction([
            this.prismaService.account.update({
                where: { id: originAccount.id },
                data: {
                    balance: originAccount.balance.minus(amount),
                },
            }),
            this.prismaService.account.update({
                where: { id: destinationAccount.id },
                data: {
                    balance: destinationAccount.balance.add(amount),
                },
            }),
        ]);
    }

    async generateBarCode(data: PaymentBarCodeDTO) {
        const account = await this.prismaService.account.findUnique({
            where: {
                id: data.accountId
            }
        })


        if (!account) {
            throw new Error('Account not found');
        }

        const payment = await this.prismaService.payment.create({
            data: {
                date: new Date(),
                accountId: account.id,
                barcode: data.barCode,
                description: data.productDescription,
                payment: 'BANK_SLIP'
            }
        })
        return payment.barcode
    }

}
