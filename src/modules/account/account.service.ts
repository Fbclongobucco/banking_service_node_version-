import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AccountService {
    constructor(private readonly prismaService: PrismaService){
    }

    async getAccount(accountId: number){
        const account = await this.prismaService.account.findMany({
            where: {
                id: accountId
            }, select:{
                id: true,
                accountNumber: true,
                balance: true,
                creditLimit: true,
                cards: true,
                customer: {
                    select: {
                        name: true
                    }
                }

            }
            
        })
        return account
    }
}
