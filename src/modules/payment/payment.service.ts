import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentBarCodeDTO, PaymentCardDTO, ReceivePaymentDTO } from './paymentDTO';
import { Decimal } from '@prisma/client/runtime/library';
import { CardType } from 'generated/prisma';

@Injectable()
export class PaymentService {
    constructor(private readonly prismaService: PrismaService) { }

    private calculateTaxCredit(data: PaymentCardDTO): Decimal {
        const amount = new Decimal(data.amount);

        if (!data.installments || data.installments <= 1) {
            return amount;
        }

        if (data.installments > 12) {
            throw new BadRequestException('Maximum number of installments is 12.');
        }

        const interestRate = new Decimal(0.02); 
        const multiplier = Decimal.pow(interestRate.add(1), data.installments); 

        return amount.mul(multiplier).toDecimalPlaces(2); 
    }

    async paymentCreditCard(data: PaymentCardDTO) {
        const card = await this.prismaService.card.findUnique({
            where: { cardNumber: data.numCard },
        });

        if (!card) throw new NotFoundException('Card not found.');

        if (card.cardType !== CardType.CREDIT_CARD)
            throw new BadRequestException('This card is not authorized for credit payments.');

        if (card.cvv !== data.cvv) throw new BadRequestException('Invalid CVV.');

        const expiration = new Date(card.expirationDate);
        if (expiration < new Date()) throw new BadRequestException('Card is expired.');

        const originAccount = await this.prismaService.account.findUnique({
            where: { id: card.accountId },
        });

        if (!originAccount) throw new NotFoundException('Origin account not found.');

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.destinationAccount },
        });

        if (!destinationAccount) throw new NotFoundException('Destination account not found.');

        const totalAmount = this.calculateTaxCredit(data);

        if (originAccount.balance.lt(totalAmount)) {
            throw new BadRequestException('Insufficient balance.');
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
            this.prismaService.payment.create({
                data: {
                    barcode: "0".repeat(44),
                    description: `payment credit at value: ${data.amount}`,
                    date: new Date(),
                    payment: 'CREDIT',
                    accountId: originAccount.id,
                    amount: data.amount
                }
            })
        ]);
    }

    async paymentDebit(data: PaymentCardDTO) {

        const card = await this.prismaService.card.findUnique({
            where: { cardNumber: data.numCard },
        });

        if (!card) throw new NotFoundException('Card not found.');

        if (card.cardType !== CardType.DEBIT_CARD && card.cardType !== CardType.CREDIT_CARD) {
            throw new BadRequestException('This card is not authorized for debit payments.');
        }

        if (card.cvv !== data.cvv) throw new BadRequestException('Invalid CVV.');

        const expiration = new Date(card.expirationDate);
        if (expiration < new Date()) throw new BadRequestException('Card is expired.');

        const originAccount = await this.prismaService.account.findUnique({
            where: { id: card.accountId },
        });

        if (!originAccount) throw new NotFoundException('Origin account not found.');

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.destinationAccount },
        });

        if (!destinationAccount) throw new NotFoundException('Destination account not found.');

        if (originAccount.balance.lt(data.amount)) {
            throw new BadRequestException('Insufficient balance.');
        }


        await this.prismaService.$transaction([
            this.prismaService.account.update({
                where: { id: originAccount.id },
                data: { balance: originAccount.balance.minus(data.amount) },
            }),
            this.prismaService.account.update({
                where: { id: destinationAccount.id },
                data: { balance: destinationAccount.balance.add(data.amount) },
            }),
            this.prismaService.payment.create({
                data: {
                    barcode: "0".repeat(44),
                    description: `payment debit at value: ${data.amount}`,
                    date: new Date(),
                    payment: 'DEBIT',
                    accountId: originAccount.id,
                    amount: data.amount
                }
            })
        ]);

    }

    async receiveByBarcode(data: ReceivePaymentDTO) {
        if (!data.barcode || data.barcode.length < 44) {
            throw new BadRequestException('Invalid barcode.');
        }

    

        const barcode = await this.prismaService.payment.findUnique({
            where: {
                barcode: data.barcode
            }
        })

        if (!barcode) {
            throw new NotFoundException('bar code not found.');
        }

        const originAccount = await this.prismaService.account.findUnique({
            where: {
                accountNumber: data.numAccount
            }
        })

        if(!originAccount){
            throw new NotFoundException('account not found.');
        }

        const amount = new Decimal(barcode.amount);

        if(new Decimal(data.amount) !== amount){
            throw new BadRequestException("")
        }

        if (originAccount.balance.lt(amount)) {
            throw new BadRequestException('Insufficient balance in origin account.');
        }

        const destinationAccount = await this.prismaService.account.findUnique({
            where: {
                accountNumber: data.destination
            }
        })

        if(!destinationAccount){
            throw new NotFoundException("account destination not found.")
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
            this.prismaService.payment.create({
                data: {
                    barcode: data.barcode,
                    description: data.description,
                    date: new Date(),
                    payment: 'BANK_SLIP',
                    accountId: originAccount.id,
                    amount: amount
                }
            })
        ]);
    }

    async receiveByPix(data: ReceivePaymentDTO) {
        const originAccount = await this.prismaService.account.findUnique({
            where: { accountNumber: data.numAccount },
        });

        if (!originAccount) {
            throw new NotFoundException('Origin Pix key not found.');
        }

        const destinationAccount = await this.prismaService.account.findUnique({
            where: { pixKey: data.destination },
        });

        if (!destinationAccount) {
            throw new NotFoundException('Destination Pix key not found.');
        }

        const amount = new Decimal(data.amount);

        if (originAccount.balance.lt(amount)) {
            throw new BadRequestException('Insufficient balance in origin account.');
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
            this.prismaService.payment.create({
                data: {
                    description: data.description,
                    date: new Date(),
                    accountId: originAccount.id,
                    payment: 'PIX',
                    amount: data.amount,
                    barcode: "0".repeat(44)
                }
            })
        ]);
    }

    async generateBarcode(data: PaymentBarCodeDTO) {
        const account = await this.prismaService.account.findUnique({
            where: {
                id: data.accountId
            }
        });

        if (!account) {
            throw new Error('Account not found.');
        }

        const payment = await this.prismaService.payment.create({
            data: {
                date: new Date(),
                accountId: account.id,
                barcode: data.barcode,
                description: data.productDescription,
                payment: 'BANK_SLIP'
            }
        });

        return payment.barcode;
    }
}
