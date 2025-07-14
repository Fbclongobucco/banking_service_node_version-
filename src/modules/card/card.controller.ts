import { Controller, Get, Param, ParseFloatPipe, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { CardService } from './card.service';

@Controller('card')
export class CardController {
    constructor(private readonly cardService: CardService){
    }

    @Post(":idAccount")
    async createDebitCard(@Param("idAccount", ParseIntPipe) idAccount: number){
        const card = await this.cardService.createDebitCard(idAccount);
        return card;
    }

    @Put("set-credit-card/:id/limit-value/:value")
    async setCreditCard(@Param("id", ParseIntPipe) id: number, @Param("value", ParseFloatPipe) value: number){
        const card = await this.cardService.setCreditCard(id, value)
        return card
    }

    @Get(":id")
    async getCardById(@Param("id", ParseIntPipe) id: number){
        const card = await this.cardService.getCardById(id)
        return card;
    }

    @Get()
    async getAllCards(@Query("size", ) size?: string, @Query("page") page?: string){
        const cards = await this.cardService.getAllCards(size, page);
        return cards
    }
}
