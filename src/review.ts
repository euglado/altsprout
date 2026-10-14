export type Language = "en" | "tr";
export const copy = {
  en: {
    title: "Review an image description",
    label: "Describe the image in your own words",
    placeholder: "A red bicycle leans against a brick wall; a sign says Open.",
    share: "Share description",
    discard: "Discard",
    invalid:
      "Enter 1–600 characters of visible text. Remove hidden/control characters.",
    unavailable:
      "This preview expired or belongs to another session. Run /altsprout again.",
    failed:
      "The operation could not finish. Check channel permissions; run /altsprout again. A send timeout may still have delivered the description; check the channel first.",
    denied:
      "Use an ordinary server text or announcement channel where both you and the bot can View Channel and Send Messages.",
    busy: "Please wait before trying again; previews or sharing are temporarily limited.",
    discarded: "Description discarded from bot memory.",
    shared: "Description shared. Bot memory cleared.",
    heading: "Image description",
    footer:
      "Shared with explicit consent. Accuracy must be checked by the author.",
    preview: "Private review — only the description will be shared",
    prompts:
      "Check essential details and text shown in the image. Avoid guessing identities or feelings. These prompts cannot judge accuracy or certify accessibility.",
    long: "Consider shortening: over 180 characters (an editing cue, not a standard limit).",
    prefix:
      "Consider removing a generic image/photo opening if it adds no meaning.",
    file: "A filename may not describe the meaningful visual details.",
    link: "A link alone may not describe the image; URLs are not fetched.",
    mention: "Mention-like text will not notify anyone.",
  },
  tr: {
    title: "Görsel açıklamasını gözden geçir",
    label: "Görseli kendi sözlerinle açıkla",
    placeholder:
      "Kırmızı bir bisiklet tuğla duvara yaslı; tabelada Açık yazıyor.",
    share: "Açıklamayı paylaş",
    discard: "Vazgeç",
    invalid:
      "1–600 karakter görünür metin gir. Gizli/kontrol karakterlerini kaldır.",
    unavailable:
      "Önizleme süresi dolmuş veya başka bir oturuma ait. /altsprout komutunu yeniden kullan.",
    failed:
      "İşlem tamamlanamadı. Kanal izinlerini kontrol edip /altsprout komutunu yeniden kullan. Gönderim zaman aşımına uğrasa da açıklama ulaşmış olabilir; önce kanala bak.",
    denied:
      "Senin ve botun Kanalı Görüntüle ve Mesaj Gönder izinlerine sahip olduğu normal metin veya duyuru kanalını kullan.",
    busy: "Biraz bekleyip yeniden dene; önizleme veya paylaşım geçici olarak sınırlı.",
    discarded: "Açıklama bot belleğinden silindi.",
    shared: "Açıklama paylaşıldı. Bot belleği temizlendi.",
    heading: "Görsel açıklaması",
    footer:
      "Açık onayla paylaşıldı. Doğruluğunu açıklamayı yazan kişi kontrol etmelidir.",
    preview: "Özel inceleme — yalnızca açıklama paylaşılacak",
    prompts:
      "Temel ayrıntıları ve görseldeki yazıları kontrol et. Kimlik veya duygular hakkında tahmin yürütme. Bu ipuçları doğruluğu ölçemez, erişilebilirliği belgeleyemez.",
    long: "Kısaltmayı düşün: 180 karakterin üzerinde (düzenleme ipucu, standart sınırı değil).",
    prefix:
      "Anlam katmıyorsa genel görsel/fotoğraf başlangıcını kaldırmayı düşün.",
    file: "Dosya adı anlamlı görsel ayrıntıları açıklamayabilir.",
    link: "Tek başına bağlantı görseli açıklamayabilir; adresler açılmaz.",
    mention: "Etiketlemeye benzeyen metin bildirim göndermez.",
  },
} as const;
export function language(value: unknown): Language {
  return value === "tr" ? "tr" : "en";
}
export function literal(text: string): string {
  return text.replace(/[\\`*_{}[\]()<>#+\-.!|~]/g, "\\$&");
}
export function review(input: string, lang: Language) {
  const text = input.trim();
  if (
    !text ||
    input.length > 600 ||
    /[\p{Cf}\p{Cs}\p{Co}\p{Cn}]/u.test(text) ||
    [...text].some((ch) => /\p{Cc}/u.test(ch) && ch !== "\n" && ch !== "\t") ||
    !/[\p{L}\p{N}\p{S}\p{P}]/u.test(text)
  )
    throw new Error("invalid");
  const c = copy[lang];
  const cues: string[] = [];
  const characters = [...text].length;
  const words = [
    ...new Intl.Segmenter(lang, { granularity: "word" }).segment(text),
  ].filter((x) => x.isWordLike).length;
  if (characters > 180) cues.push(c.long);
  if (
    /^(?:(?:a|an|bir)\s+)?(?:image|photo|picture|görsel|fotoğraf|resim)\b/iu.test(
      text,
    )
  )
    cues.push(c.prefix);
  if (/\b\S+\.(?:png|jpe?g|gif|webp|svg|heic)\b/iu.test(text))
    cues.push(c.file);
  if (/https?:\/\/|www\./iu.test(text)) cues.push(c.link);
  if (/@(?:everyone|here)|<@!?\d+>|<@&\d+>/u.test(text)) cues.push(c.mention);
  const description = literal(text);
  const publicText = `${c.heading}\n${description}\n\n${c.footer}`;
  const preview = `${c.preview}\n\n${description}\n\n${characters} ${lang === "tr" ? "Unicode karakter" : "Unicode characters"}; ${words} ${lang === "tr" ? "sözcük" : "words"}.\n${cues.join("\n")}\n${c.prompts}\n\n${lang === "tr" ? "Önizleme 5 dakika geçerli. Paylaşım bu kanaldaki herkese görünür." : "Preview lasts 5 minutes. Sharing makes the description visible to this channel."}`;
  // Keep room for Discord's 2,000 UTF-16-unit message limit, even after escaping.
  if (publicText.length > 1900 || preview.length > 2000)
    throw new Error("invalid");
  return { publicText, preview, characters, words, cues };
}
