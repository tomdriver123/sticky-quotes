import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NotesPage } from './notes.page';
import { NoteEditorPage } from './note-editor/note-editor.page';

const routes: Routes = [
  { path: '', component: NotesPage },
  { path: 'new', component: NoteEditorPage },
  { path: ':id', component: NoteEditorPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotesRoutingModule {}
