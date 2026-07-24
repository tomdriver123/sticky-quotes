import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { VotesRoutingModule } from './votes-routing.module';
import { VotesPage } from './votes.page';

@NgModule({
  imports: [CommonModule, IonicModule, VotesRoutingModule],
  declarations: [VotesPage],
})
export class VotesPageModule {}
