import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VotesPage } from './votes.page';

const routes: Routes = [{ path: '', component: VotesPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VotesRoutingModule {}
