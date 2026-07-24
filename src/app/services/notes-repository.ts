import { Observable } from 'rxjs';

import { Note } from '../models/note.model';

/**
 * The storage seam. Components depend on this and never on the storage
 * mechanism itself, so the store can be swapped (file API today, the
 * Votes-era backend later) without touching UI code.
 *
 * An abstract class rather than an interface so it can serve as an
 * Angular DI token: `{ provide: NotesRepository, useClass: ... }`.
 */
export abstract class NotesRepository {
  abstract list(): Observable<Note[]>;
  abstract get(id: string): Observable<Note>;
  abstract create(body: string): Observable<Note>;
  abstract update(id: string, body: string): Observable<Note>;
  abstract delete(id: string): Observable<void>;
}
