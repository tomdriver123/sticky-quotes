import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { NotesRepository } from '../../../services/notes-repository';

@Component({
  selector: 'app-note-editor',
  templateUrl: './note-editor.page.html',
  styleUrls: ['./note-editor.page.scss'],
  standalone: false,
})
export class NoteEditorPage implements OnDestroy {
  bodyCtrl = new FormControl<string>('', { nonNullable: true });
  noteId: string | null = null;
  isNewNote = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repo = inject(NotesRepository);
  private readonly alertCtrl = inject(AlertController);

  private lastSavedBody = '';
  private valueChangesSub: Subscription | null = null;
  private isSaving = false;
  private pendingBody: string | null = null;

  ionViewWillEnter(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Post-replaceUrl re-entry: same note already loaded — don't clobber dirty text.
    if (id !== null && id === this.noteId) {
      this.subscribeToChanges();
      return;
    }

    this.noteId = id;
    this.isNewNote = (id === null);
    this.lastSavedBody = '';
    this.bodyCtrl.setValue('', { emitEvent: false });

    if (id !== null) {
      this.repo.get(id).subscribe(note => {
        this.bodyCtrl.setValue(note.body, { emitEvent: false });
        this.lastSavedBody = note.body;
        this.subscribeToChanges();
      });
    } else {
      this.subscribeToChanges();
    }
  }

  ionViewWillLeave(): void {
    this.unsubscribe();
    // Flush: save immediately regardless of debounce — never lose keystrokes.
    const body = this.bodyCtrl.value;
    if (body !== this.lastSavedBody && (body.trim().length > 0 || this.noteId !== null)) {
      this.performSave(body);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  private subscribeToChanges(): void {
    this.unsubscribe();
    this.valueChangesSub = this.bodyCtrl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(body => this.performSave(body));
  }

  private unsubscribe(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
      this.valueChangesSub = null;
    }
  }

  private performSave(body: string): void {
    if (body === this.lastSavedBody) return;
    // Don't create a file for an empty new note.
    if (this.noteId === null && body.trim().length === 0) return;

    if (this.isSaving) {
      this.pendingBody = body;
      return;
    }

    this.isSaving = true;

    if (this.noteId === null) {
      this.repo.create(body).subscribe({
        next: note => {
          this.noteId = note.id;
          this.isNewNote = false;
          this.lastSavedBody = note.body;
          this.isSaving = false;
          this.router.navigate(['/tabs/notes', note.id], { replaceUrl: true });
          this.flushPending();
        },
        error: () => {
          this.isSaving = false;
          this.flushPending();
        },
      });
    } else {
      this.repo.update(this.noteId, body).subscribe({
        next: note => {
          this.lastSavedBody = note.body;
          this.isSaving = false;
          this.flushPending();
        },
        error: () => {
          this.isSaving = false;
          this.flushPending();
        },
      });
    }
  }

  private flushPending(): void {
    if (this.pendingBody !== null) {
      const body = this.pendingBody;
      this.pendingBody = null;
      this.performSave(body);
    }
  }

  async deleteNote(): Promise<void> {
    if (this.noteId === null) return;
    const id = this.noteId;
    const alert = await this.alertCtrl.create({
      message: 'Delete note?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.repo.delete(id).subscribe(() => {
              this.router.navigate(['/tabs/notes'], { replaceUrl: true });
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
