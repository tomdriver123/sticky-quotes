import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { QuotesRoutingModule } from './quotes-routing.module';
import { QuotesPage } from './quotes.page';

@NgModule({
  imports: [CommonModule, IonicModule, QuotesRoutingModule],
  declarations: [QuotesPage],
})
export class QuotesPageModule {}
