import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonFooter, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUp, chevronForward, closeCircle } from 'ionicons/icons';
import { ASSISTANT_ABILITIES, AssistantProposal, AssistantService } from '../services/assistant.service';
import { PlanService } from '../services/plan.service';

interface ChatMessage {
  from: 'user' | 'assistant';
  text: string;
  navigateTo?: string | null;
  navigateLabel?: string | null;
  proposal?: AssistantProposal | null;
  /** For a proposal: waiting for the user, being applied, applied, or turned down. */
  state?: 'open' | 'applying' | 'applied' | 'declined';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_LENGTH = 300;

/**
 * The assistant. It handles a short list of requests (change a meal, adjust this week's training,
 * update food preferences) and points to the right page for everything the app already shows.
 */
@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.page.html',
  styleUrls: ['./assistant.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonFooter, IonSpinner, IonIcon],
})
export class AssistantPage {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;

  abilities = ASSISTANT_ABILITIES;
  maxLength = MAX_LENGTH;
  messages: ChatMessage[] = [];
  draft = '';
  sending = false;

  /** The meal this conversation is about, when opened from a meal's page. */
  focus: { day: number; slot: string; name: string } | null = null;

  constructor(
    private assistant: AssistantService,
    private planService: PlanService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ arrowUp, chevronForward, closeCircle });
  }

  ionViewWillEnter() {
    const params = this.route.snapshot.queryParamMap;
    const day = Number(params.get('day'));
    const slot = params.get('slot');
    if (params.has('day') && Number.isInteger(day) && day >= 0 && day <= 6 && slot) {
      this.focus = { day, slot, name: params.get('name') ?? '' };
    } else {
      this.focus = null;
    }
  }

  get focusLabel(): string {
    return this.focus ? `${DAY_NAMES[this.focus.day]} ${this.focus.slot}` : '';
  }

  clearFocus() {
    this.focus = null;
  }

  useExample(example: string) {
    this.draft = example;
    this.input?.nativeElement.focus();
  }

  send() {
    const text = this.draft.trim();
    if (!text || this.sending) return;

    this.messages.push({ from: 'user', text });
    this.draft = '';
    this.sending = true;
    this.scrollDown();

    this.assistant.send(text, this.focus).subscribe({
      next: (reply) => {
        this.messages.push({
          from: 'assistant',
          text: reply.reply,
          navigateTo: reply.navigateTo,
          navigateLabel: reply.navigateLabel,
          proposal: reply.proposal,
          state: reply.proposal ? 'open' : undefined,
        });
        this.sending = false;
        this.scrollDown();
      },
      error: () => {
        this.messages.push({ from: 'assistant', text: "That didn't go through. Please check your connection and try again." });
        this.sending = false;
        this.scrollDown();
      }
    });
  }

  confirm(message: ChatMessage) {
    if (!message.proposal || message.state !== 'open') return;
    message.state = 'applying';

    this.assistant.confirm(message.proposal.id).subscribe({
      next: (reply) => {
        if (reply.kind === 'done') {
          message.state = 'applied';
          if (reply.plan) {
            this.planService.adopt(reply.plan);
          }
          // the meal that was being discussed has been dealt with
          if (message.proposal?.kind === 'swap_meal') {
            this.focus = null;
          }
        } else {
          message.state = 'declined';
        }
        this.messages.push({ from: 'assistant', text: reply.reply });
        this.scrollDown();
      },
      error: () => {
        message.state = 'open';
        this.messages.push({ from: 'assistant', text: "That couldn't be applied. Please check your connection and try again." });
        this.scrollDown();
      }
    });
  }

  decline(message: ChatMessage) {
    if (message.state !== 'open') return;
    message.state = 'declined';
    this.messages.push({ from: 'assistant', text: 'No problem, nothing was changed. Tell me what you would like instead.' });
    this.scrollDown();
  }

  open(path: string) {
    this.router.navigateByUrl(path);
  }

  private scrollDown() {
    setTimeout(() => this.content?.scrollToBottom(200), 50);
  }
}
