import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { NotesRoutingModule } from './notes-routing.module';
import { NotesPage } from './notes.page';

@NgModule({
  imports: [CommonModule, IonicModule, NotesRoutingModule],
  declarations: [NotesPage],
})
export class NotesPageModule {}
