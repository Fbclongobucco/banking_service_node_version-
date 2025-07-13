import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CustomerDTO } from './customerDTO';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerService {

    constructor(private readonly prisma: PrismaService) {
    }

    async createCustomer(data: CustomerDTO) {
        
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const generateAccountNumber = () =>
        Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();

    const customer = await this.prisma.customer.create({
        data: {
            name: data.name,
            email: data.email,
            cpf: data.cpf,
            password: hashedPassword,
            phone: data.phone,
            account: {
                create: {
                    accountNumber: generateAccountNumber(),
                    balance: 0.00,
                    creditLimit: 0.00,
                },
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            phone: true,
            account: {
                select: {
                    id: true,
                    accountNumber: true,
                    balance: true,
                    creditLimit: true
                }
            }
        }
    });

    return customer;
}
}
