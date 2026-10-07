import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AIPlan } from './plan.service';

/** A change the assistant suggests; nothing happens until it is confirmed. */
export interface AssistantProposal {
  id: string;
  kind: 'swap_meal' | 'week_constraint' | 'update_preferences';
  title: string;
  lines: string[];
  meal?: {
    name: string;
    calories: number;
    macros?: { p: number; c: number; f: number };
    ingredients: string[];
    recipe: string[];
  } | null;
}

export interface AssistantReply {
  kind: 'message' | 'navigate' | 'proposal' | 'done';
  reply: string;
  navigateTo?: string | null;
  navigateLabel?: string | null;
  proposal?: AssistantProposal | null;
  /** The updated plan, after a confirmed change. */
  plan?: AIPlan | null;
}

/** What the assistant can do, shown in its introduction and as tappable examples. */
export const ASSISTANT_ABILITIES: { title: string; example: string }[] = [
  { title: 'Change a meal to something you want', example: 'Change Wednesday dinner to something without an oven' },
  { title: "Adjust this week's training", example: 'I can only train twice this week' },
  { title: 'Update your food preferences', example: "I don't want cilantro in my meals" },
];

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private readonly endpoint = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) {}

  /**
   * @param focus the meal the assistant was opened from, if any (day 0 = Sunday)
   */
  send(text: string, focus?: { day: number; slot: string } | null): Observable<AssistantReply> {
    return this.http.post<AssistantReply>(`${this.endpoint}/message`, {
      text,
      today: new Date().getDay(),
      focusDay: focus?.day ?? null,
      focusSlot: focus?.slot ?? null,
    });
  }

  confirm(proposalId: string): Observable<AssistantReply> {
    return this.http.post<AssistantReply>(`${this.endpoint}/confirm`, { proposalId });
  }
}
