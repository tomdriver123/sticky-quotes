import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'notes',
        loadChildren: () => import('../pages/notes/notes.module').then(m => m.NotesPageModule),
      },
      {
        path: 'votes',
        loadChildren: () => import('../pages/votes/votes.module').then(m => m.VotesPageModule),
      },
      {
        path: 'quotes',
        loadChildren: () => import('../pages/quotes/quotes.module').then(m => m.QuotesPageModule),
      },
      {
        path: '',
        redirectTo: 'notes',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsRoutingModule {}
