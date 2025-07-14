import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
    constructor(private readonly accountService: AccountService){
    }

    @Get(":id")
    async getAccountById(@Param("id", ParseIntPipe) id: number){
        const account = await this.accountService.getAccountById(id)
        return account;
    }
}
