import { Body, Controller, Get, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerDTO } from './customerDTO';

@Controller('customer')
export class CustomerController {

    constructor(private readonly customerService: CustomerService){}

    @Post()
    async createCustomer(@Body() data: CustomerDTO){
        return this.customerService.createCustomer(data)
    }

    @Get()
    async findAllCustomers(){
        return this.customerService.findAllCustomers()
    }

}
