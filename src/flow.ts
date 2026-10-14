import { copy, type Language, language, review } from "./review.js";
import { type Binding, Store } from "./store.js";
export type MessageBinding = {
  id: string;
  author: string;
  webhook: string | null;
  ephemeral: boolean;
};
export interface Port {
  kind: "command" | "modal" | "button" | "other";
  name: string;
  binding: Binding;
  bot: string;
  locale: string;
  message: MessageBinding | null;
  getLanguage(): string | null;
  getText(): string;
  modal(lang: Language): Promise<void>;
  reply(text: string): Promise<void>;
  defer(): Promise<void>;
  edit(
    text: string,
    buttons?: { nonce: string; lang: Language },
  ): Promise<string>;
  acknowledge(): Promise<void>;
  publisher(): Promise<((content: string) => Promise<void>) | null>;
}
export class Flow {
  constructor(
    readonly guild: string,
    readonly store = new Store(),
  ) {}
  async handle(p: Port) {
    const isCommand = p.kind === "command" && p.name === "altsprout";
    const modalMatch = p.kind === "modal" && /^as:write:(en|tr)$/.exec(p.name);
    const buttonMatch =
      p.kind === "button" && /^as:(share|discard):([a-f0-9]{36})$/.exec(p.name);
    if (!isCommand && !modalMatch && !buttonMatch) return;
    let lang = language(p.locale);
    try {
      if (
        !p.binding.guild ||
        p.binding.guild !== this.guild ||
        !p.binding.channel
      ) {
        await p.reply(copy[lang].denied);
        return;
      }
      if (isCommand) {
        lang = language(p.getLanguage() ?? p.locale);
        if (!this.store.throttle(this.store.users, p.binding.owner, 5000)) {
          await p.reply(copy[lang].busy);
          return;
        }
        await p.modal(lang);
        return;
      }
      if (modalMatch) {
        lang = language(modalMatch[1]);
        await p.defer();
        let result: ReturnType<typeof review>;
        try {
          result = review(p.getText(), lang);
        } catch {
          await p.edit(copy[lang].invalid);
          return;
        }
        const nonce = this.store.add(p.binding, lang, result.publicText);
        if (!nonce) {
          await p.edit(copy[lang].busy);
          return;
        }
        try {
          this.store.bind(nonce, await p.edit(result.preview, { nonce, lang }));
        } catch {
          this.store.drafts.delete(nonce);
          throw new Error("preview failed");
        }
        return;
      }
      if (!buttonMatch) return;
      const message = p.message;
      if (
        !message ||
        message.author !== p.bot ||
        message.webhook !== p.binding.application ||
        !message.ephemeral
      ) {
        await p.reply(copy[lang].unavailable);
        return;
      }
      const draft = this.store.take(
        buttonMatch[2] ?? "",
        p.binding,
        message.id,
      );
      if (!draft) {
        await p.reply(copy[lang].unavailable);
        return;
      }
      lang = draft.lang;
      // Consume synchronously before the first await to prevent double-click replay.
      await p.acknowledge();
      if (buttonMatch[1] === "discard") {
        await p.edit(copy[lang].discarded);
        return;
      }
      if (
        !this.store.throttle(this.store.channels, p.binding.channel, 60_000)
      ) {
        await p.edit(copy[lang].busy);
        return;
      }
      const send = await p.publisher();
      if (!send) {
        await p.edit(copy[lang].denied);
        return;
      }
      await send(draft.content);
      await p.edit(copy[lang].shared);
    } catch {
      // Never expose SDK error messages, request bodies, interaction tokens or user text.
      try {
        await p.edit(copy[lang].failed);
      } catch {
        try {
          await p.reply(copy[lang].failed);
        } catch {}
      }
    }
  }
}
