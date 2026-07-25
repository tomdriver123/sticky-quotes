import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { NotesRoutingModule } from './notes-routing.module';
import { NotesPage } from './notes.page';
import { NoteEditorPage } from './note-editor/note-editor.page';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, NotesRoutingModule],
  declarations: [NotesPage, NoteEditorPage],
})
export class NotesPageModule {}
