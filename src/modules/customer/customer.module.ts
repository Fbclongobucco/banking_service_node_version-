import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [CustomerService, PrismaService],
  controllers: [CustomerController]
})
export class CustomerModule {}
