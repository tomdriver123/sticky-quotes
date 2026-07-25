import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Note } from '../models/note.model';
import { NotesRepository } from './notes-repository';

@Injectable()
export class HttpNotesRepository extends NotesRepository {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/notes';

  list(): Observable<Note[]> {
    return this.http.get<{ notes: Note[] }>(this.base).pipe(map(r => r.notes));
  }

  get(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.base}/${id}`);
  }

  create(body: string): Observable<Note> {
    return this.http.post<Note>(this.base, { body });
  }

  update(id: string, body: string): Observable<Note> {
    return this.http.put<Note>(`${this.base}/${id}`, { body });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
