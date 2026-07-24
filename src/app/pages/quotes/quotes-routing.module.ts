import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuotesPage } from './quotes.page';

const routes: Routes = [{ path: '', component: QuotesPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotesRoutingModule {}
