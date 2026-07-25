import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { Note } from '../../models/note.model';
import { NotesRepository } from '../../services/notes-repository';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
  standalone: false,
})
export class NotesPage {
  notes: Note[] = [];

  private readonly repo = inject(NotesRepository);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);

  ionViewWillEnter(): void {
    this.loadNotes();
  }

  private loadNotes(): void {
    this.repo.list().subscribe(notes => {
      this.notes = notes.sort(
        (a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime(),
      );
    });
  }

  createNote(): void {
    this.router.navigate(['/tabs/notes/new']);
  }

  openNote(note: Note): void {
    this.router.navigate(['/tabs/notes', note.id]);
  }

  async deleteNote(note: Note): Promise<void> {
    const alert = await this.alertCtrl.create({
      message: 'Delete note?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.repo.delete(note.id).subscribe(() => this.loadNotes());
          },
        },
      ],
    });
    await alert.present();
  }

  get dashboardUrl(): string {
    return `http://${window.location.hostname}:4200`;
  }
}
