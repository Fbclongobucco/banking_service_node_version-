import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query,  } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerDTO, CustomerUpdateDTO } from './customerDTO';

@Controller('customer')
export class CustomerController {

    constructor(private readonly customerService: CustomerService){}

    @Post()
    async createCustomer(@Body() data: CustomerDTO){
        return this.customerService.createCustomer(data)
    }

    @Get()
    async findAllCustomers(@Query("size", ) size?: string, @Query("page") page?: string){
        return this.customerService.findAllCustomers(size, page)
    }

    @Put(":id")
    async updateCustomer(@Param("id", ParseIntPipe) id: number, @Body() data:CustomerUpdateDTO ){
        await this.customerService.updateCustomer(id, data)
    }

    @Delete(":id")
    async deleteCustomer(@Param("id", ParseIntPipe) id: number){
        await this.customerService.deleteCustomer(id)
    }
    
    @Get(":id")
    async findCustomer(@Param("id", ParseIntPipe) id: number){
        return this.customerService.findCustomer(id)
    }

}
