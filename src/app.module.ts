import { Module } from '@nestjs/common';
import { CustomerModule } from './modules/customer/customer.module';
import { AccountModule } from './modules/account/account.module';
import { CardModule } from './modules/card/card.module';

@Module({
  imports: [CustomerModule, AccountModule, CardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
