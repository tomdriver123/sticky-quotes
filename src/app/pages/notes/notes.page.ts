import { Component } from '@angular/core';

// Static demo data — replaced by NotesRepository when v1 is built.
interface MockNote {
  body: string;
  createdAt: string;
  editedAt: string;
}

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
  standalone: false,
})
export class NotesPage {
  // Notes are title-less by design: body + created + edited, newest-edited first.
  notes: MockNote[] = [
    {
      body: 'A notepad that’s working towards something. Most notes go nowhere — what if every note had a finish line?',
      createdAt: '2026-07-23T09:12:00',
      editedAt: '2026-07-23T18:40:00',
    },
    {
      body: 'The best ideas show up while you’re doing the dishes. Maybe friction isn’t the enemy of thought — distraction is.',
      createdAt: '2026-07-21T22:03:00',
      editedAt: '2026-07-22T08:15:00',
    },
    {
      body: 'Ship the smallest thing that can disappoint you.',
      createdAt: '2026-07-19T14:47:00',
      editedAt: '2026-07-19T14:47:00',
    },
  ];
}
