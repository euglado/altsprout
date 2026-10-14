import { randomBytes } from "node:crypto";
import type { Language } from "./review.js";
export type Binding = {
  owner: string;
  guild: string;
  channel: string;
  application: string;
};
export type Draft = Binding & {
  lang: Language;
  content: string;
  expires: number;
  message: string | null;
};
export class Store {
  readonly drafts = new Map<string, Draft>();
  readonly users = new Map<string, number>();
  readonly channels = new Map<string, number>();
  constructor(readonly now: () => number = Date.now) {}
  prune() {
    const now = this.now();
    for (const [key, draft] of this.drafts)
      if (draft.expires <= now) this.drafts.delete(key);
    for (const map of [this.users, this.channels])
      for (const [key, until] of map) if (until <= now) map.delete(key);
  }
  throttle(map: Map<string, number>, key: string, ms: number) {
    this.prune();
    if (map.has(key) || map.size >= 500) return false;
    map.set(key, this.now() + ms);
    return true;
  }
  add(binding: Binding, lang: Language, content: string) {
    this.prune();
    for (const [key, d] of this.drafts)
      if (d.owner === binding.owner && d.guild === binding.guild)
        this.drafts.delete(key);
    if (this.drafts.size >= 100) return null;
    const nonce = randomBytes(18).toString("hex");
    this.drafts.set(nonce, {
      ...binding,
      lang,
      content,
      expires: this.now() + 300_000,
      message: null,
    });
    return nonce;
  }
  bind(nonce: string, message: string) {
    const d = this.drafts.get(nonce);
    if (d) d.message = message;
  }
  take(nonce: string, binding: Binding, message: string) {
    this.prune();
    if (!/^[a-f0-9]{36}$/.test(nonce)) return null;
    const d = this.drafts.get(nonce);
    if (
      !d ||
      d.owner !== binding.owner ||
      d.guild !== binding.guild ||
      d.channel !== binding.channel ||
      d.application !== binding.application ||
      !d.message ||
      d.message !== message
    )
      return null;
    this.drafts.delete(nonce);
    return d;
  }
}
