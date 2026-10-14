# AltSprout

**Türkçe:** Discord toplulukları için görsel açıklaması çalışma atölyesi.
**English:** An image-description workshop for Discord communities.

Gerçek bir Discord botudur; kendi Discord uygulaman, tokenın ve sürekli çalışan
Node.js sürecin gerekir. Bu depo barındırılan bir hizmet veya hazır bot daveti sunmaz.
This is a real Discord bot. Bring your own Discord application, token and always-on
Node.js process. This repository does not provide a hosted service or shared invite.

## Türkçe

### Amaç ve özellikler

Görsellerine metin açıklaması eklemek isteyen topluluk üyeleri `/altsprout` ile bir
form açar. Bot, kişinin **kendi yazdığı açıklamayı** özel olarak gösterir; karakter
ve sözcük sayısını, basit düzenleme ipuçlarını ve insan incelemesi sorularını sunar.
**Açıklamayı paylaş** düğmesi yalnızca açıklamayı aynı kanala gönderir. **Vazgeç**
botun belleğindeki taslağı siler. Düzenlemek için vazgeçip komutu yeniden kullan.

- Türkçe ve İngilizce form, önizleme, düğme ve işlem mesajları.
- 1–600 UTF-16 birimi metin; formun Discord karakter sınırı emoji gibi bazı
  karakterlerde iki birim sayar. Raporlanan karakter sayısı Unicode kod noktasıdır,
  görsel harf/grapheme sayısı değildir. Sözcük sayısı `Intl.Segmenter` ile tahmindir.
- 180 kod noktası üzerindeki açıklamalar, genel fotoğraf/görsel başlangıçları,
  dosya adları, URL'ler ve etiketlemeye benzeyen metin için basit ipuçları.
  **180 bir düzenleme tercihidir; erişilebilirlik standardı veya başarı ölçütü değildir.**
- Yazar, sunucu, kanal, uygulama ve özel mesaj kimliğine bağlı tek kullanımlık
  onay; beş dakika süre. Aynı kişinin yeni taslağı aynı sunucudaki eskisini geçersiz kılar.
- Kişi başına form açmada 5 saniye, kanal başına paylaşımda 60 saniye bekleme.
  İzin veya ağ hatasından sonra da kanal beklemesi uygulanabilir.
- Görsel indirme, OCR, AI üretimi, çeviri, URL açma, mesaj tarama, DM, ses,
  moderasyon, puanlama veya kullanıcı takibi yoktur.

Bot görseli görmez; açıklamanın doğru, yeterli veya bağlama uygun olduğunu bilemez.
Dosya eklerini veya Discord'un yerleşik alternatif metin alanını düzenlemez.
Paylaşılan metin görselin yanında **ayrı bir mesajdır**; yerleşik alternatif metin
yerine geçmez ve belirli bir görsele otomatik bağlanmaz. Yazar gerekli metni ve
ayrıntıları, insan kimlikleri/duyguları hakkında tahmin yapmadan kontrol etmelidir.
Hiçbir sonuç erişilebilirlik sertifikası değildir. Özellikle hassas veya spoiler
içeren görseller için açıklamayı herkese açık kanala göndermeden önce düşün.

### Gereksinimler

1. [Node.js 24](https://nodejs.org/en/download) ve beraberindeki npm. Node 25/26
   yerine 24 kullan; `node --version` çıktısı `v24...` olmalıdır.
2. İnternet erişimli Windows, macOS veya Linux bilgisayar/sunucu.
3. Discord hesabı; bot ekleyebileceğin bir sunucu ve normal metin/duyuru kanalı.
4. Discord Developer Portal'da kendine ait, bu bot için ayrılmış bir uygulama.
5. İlk paket kurulumunda npm kayıt servisine, çalışma sırasında Discord'a erişim.

### Developer Portal ve izinler

1. [Discord Developer Portal](https://discord.com/developers/applications)'ı aç.
   **New Application** ile uygulama oluştur; General Information'daki
   **Application ID** değerini bir yere not et. İstemci sırrı/client secret gerekmez.
2. **Bot** sayfasında bot kullanıcısını oluştur veya mevcut botu aç. **Reset Token**
   ile token al; yalnızca kurulum sihirbazına gir. Token parola gibidir: sohbet,
   issue, ekran görüntüsü, Git veya çevrimiçi doğrulama sitesine gönderme.
   Sızarsa hemen Reset Token yap. Public Bot seçeneğini kapatabilirsin.
3. **Privileged Gateway Intents** seçeneklerinin tümünü kapalı bırak:
   Message Content, Server Members, Presence gerekmez. Kod yalnızca **Guilds** intent kullanır.
4. **Installation** altında **Guild Install** kullan; kullanıcıya özel kurulum
   gerekmez. OAuth2 URL Generator/kurulum ayarlarında `bot` ve
   `applications.commands` kapsamlarını seç. İzinlerden yalnızca **View Channels**
   ve **Send Messages** seç; birleşik izin değeri `3072`.
   Administrator, Manage Messages, Read Message History, Embed Links, Attach Files,
   Mention Everyone, Manage Channels veya ses izni verme.
5. Üretilen kurulum bağlantısını açıp kendi sunucuna ekle. İlgili kanalın izin
   geçersiz kılmaları botun görme/gönderme iznini engellememelidir.
6. Discord **User Settings → Advanced → Developer Mode** aç. Sunucu adına sağ
   tıklayıp **Copy Server ID** seç. Kanal kimliği girmen gerekmez.
7. Üyenin komut kullanımı sunucu/kanal uygulama ayarlarından kısıtlanabilir.
   Paylaşım anında hem üyenin hem botun View Channel + Send Messages izinleri
   yeni kanal, rol ve üye bilgileriyle yeniden değerlendirilir.

### Kurulum ve yapılandırma

GitHub'da **Code → Download ZIP** seç, arşivi kendi hesabına ait bir klasöre çıkar.
ZIP içinden çalıştırma. Node 24 kurduktan sonra açık terminalleri kapatıp yeniden aç.
Kaynak kodu düzenlemen gerekmez.

**Windows:** çıkarılmış klasörde `setup.cmd` çalıştır. Gerekirse dosyaya sağ tıkla
ve çalıştırmayı seç; kaynağını bilmediğin dosyalarda güvenlik korumasını kapatma.
**macOS/Linux:** klasörde terminal aç ve `bash setup.sh` çalıştır.
Bu yardımcılar kilitli bağımlılıkları kurar, kontrolleri çalıştırır, sihirbazı açar
ve komutu kaydeder. Her adım başarısızlıkta durur. İlk kurulum birkaç dakika sürebilir.

Sihirbaz bot tokenı, Application ID ve Server ID sorar. Token yazarken hiçbir
karakter görünmez; Enter ile devam et, Ctrl+C ile iptal et. `.env` yerel dosyası
oluşur ve Git tarafından dışlanır. Var olan dosya **üzerine yazılmaz**. Yeniden
yapılandırma için botu durdur, mevcut `.env` dosyasını güvenli bir özel konuma taşı
(proje klasöründe `.env.backup` bırakma), sonra `npm run setup` çalıştır.
Gerçek gizli bilgileri `.env.example` dosyasına yazma.

Terminal üzerinden eşdeğer adımlar:

```sh
npm ci --ignore-scripts
npm run check
npm run setup
npm run register
npm start
```

Otomatik barındırmada `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`
gizli ortam değişkenleri desteklenir; ortam değerleri `.env` değerlerini geçersiz
kılar. `.env` yalnızca bu üç `ANAHTAR=değer` satırını ve `#` yorumlarını kabul eder;
tırnak/export sözdizimi kullanma. Dosyayı düzenlemek normal kurulum için gerekmez.
POSIX'te sihirbaz 0600 dosya modu ister; Windows'ta klasör ve hesap izinlerini
kontrol et. Tokenı komut satırı argümanına koyma.

Komut kaydı yalnızca yapılandırılmış sunucuda `/altsprout` komutunu ekler/günceller;
farklı adlı komutları silmez. Bu adla mevcut komutu değiştireceğinden ayrı bir
uygulama kullan. Bir süreç yalnızca tek sunucuya hizmet verir; başka sunucu için
ayrı uygulama, klasör ve süreç kur.

### Kullanım ve botu çevrimiçi tutma

1. Windows'ta `start.cmd`, macOS/Linux'ta `bash start.sh` çalıştır.
2. “AltSprout is ready” görünce normal metin/duyuru kanalında `/altsprout` seç.
   `language` alanından **Türkçe** veya **English** seçebilirsin. Varsayılan,
   Discord dilin Türkçeyse Türkçe, diğer dillerde İngilizcedir.
3. Örneğin “Kırmızı bisiklet tuğla duvara yaslı; tabelada Açık yazıyor.” yaz.
4. Özel önizlemeyi oku; açıklama ve kontrol soruları görünür. Paylaşılacak açıklama
   metninin tamamı önizlemede vardır. Kontrol listesi/sayılar kanala gönderilmez;
   kamuya açık mesajda sabit başlık ve doğruluğu yazara bırakan dipnot bulunur.
5. **Açıklamayı paylaş** ile aynı kanala gönder veya **Vazgeç** ile taslağı sil.
   Paylaşım geri alınamaz bir Discord mesajı oluşturur; gerekirse sunucu
   moderatöründen normal Discord araçlarıyla silmesini iste. Bot silme izni istemez.

Terminali kapatmak, bilgisayarı uyutmak veya ağı kesmek botu çevrimdışı bırakır.
Sürekli kullanım için güvendiğin Node 24 destekli barındırıcıda tek süreç çalıştır;
başlangıç komutu `npm start`, hazırlık komutları `npm ci --ignore-scripts` ve
`npm run check`. Sağlayıcının gizli değişken ekranını kullan, birden fazla kopya
çalıştırma. CI botu barındırmaz. Yeniden başlatma bütün özel taslakları siler.
Kayıt için gerekirse `register.cmd`, `bash register.sh` veya `npm run register` kullan.

### Güvenlik, veri ve gizlilik

Discord form içeriğini bot sürecine iletir. Önizleme **Discord'daki ephemeral
mesajdır**; uçtan uca şifrelenmiş veya Discord'dan gizli değildir. Hassas bilgi girme.
Bot RAM'inde kaçışlanmış paylaşım metni, dil, oluşturucu/sunucu/kanal/uygulama/mesaj
kimlikleri ve süre bulunur; ham etkileşim/token nesneleri taslağa konmaz.
En fazla 100 taslak ve her bekleme haritasında 500 kimlik tutulur. Süresi dolan
kayıtlar sonraki işlemde veya 30 saniyelik temizlikte silinir. Paylaş/Vazgeç tek
kullanımlıktır ve ilk asenkron işlemden önce tüketilir. Paylaşım hatasında taslak
tutulmaz; gönderim belirsizse kanalı kontrol ederek yeniden başla.

Veritabanı, analitik, üçüncü taraf AI veya dosyaya içerik günlüğü yoktur. SDK
mesaj/üye/kullanıcı önbellekleri kapatılmıştır; çalışma için sunucu/kanal/rol
metaverileri geçici olarak kullanılabilir. İşletim sistemi, barındırıcı ve Discord
kendi politikalarına göre veri işleyebilir. `.env` kalıcı gizli yapılandırmadır.
RAM silme, Discord'un özel veya paylaşılan mesajlarını silmez; ekran görüntüsü ve
kopyaları da geri alamaz. Bot paylaşımı yapıldığında kanal üyeleri açıklamayı görür.

Markdown/bağlantı biçimi kaçışlanır; etiket bildirimleri ve URL önizlemeleri kapalıdır.
Gizli biçimlendirme/yön kontrolü, özel kullanım, atanmamış karakterler ve newline/tab
dışındaki kontrol karakterleri reddedilir; ZWJ içeren birleşik emojiler de bu nedenle
reddedilebilir. Bu filtre içerik moderasyonu yapmaz. Topluluk kurallarına ve
[Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)'ye uy.
Token olayı ve özel bildirim için [SECURITY.md](SECURITY.md)'ye bak.

### Sorun giderme

- **Komut yok:** doğru sunucuyu kurduğundan, `applications.commands` kapsamından,
  komut kaydının başarılı olduğundan ve sunucu uygulama kısıtlamalarından emin ol.
  Discord'u yenile; `npm run register` komutunu çalıştır. Global yayılma beklenmez.
- **Bot çevrimdışı:** Node 24, açık süreç, internet ve tokenı kontrol et. Gizli
  tokenı paylaşmadan portalda yeniden üret. Application ID ile token aynı uygulamadan olmalı.
- **İzin uyarısı:** üye ve bot için kanal geçersiz kılmalarını kontrol et.
  Thread, forum, DM, ses veya kategori kullanma; normal metin/duyuru kanalı gerekir.
  Administrator verme; yalnızca View Channel ve Send Messages düzelt.
- **Eski önizleme:** beş dakika, yeni taslak veya yeniden başlatma eski düğmeleri
  geçersiz kılar. `/altsprout` ile yeniden başla.
- **Bekleme/kapasite:** kişi için 5, paylaşım kanalı için 60 saniye bekle; 100 taslak
  sınırında eski kayıtların süresinin dolmasını bekle. Discord hız sınırlarına uy.
- **Geçersiz metin:** 600 UTF-16 sınırını ve gizli/kontrol karakterlerini kontrol et;
  açıklamayı sadeleştir. Önizleme boyutu için savunmacı son sınır da uygulanır.
- **Gönderim hatası:** bot otomatik yeniden göndermeyi denemez. Zaman aşımında mesaj
  ulaşmış olabilir; önce kanala bak, sonra yeni önizleme oluştur.
- **Kurulum durdu:** Node sürümünü kontrol et, etkileşimli terminal kullan ve var olan
  `.env` dosyasını güvenle taşı. Yeni kurulumla mevcut gizli dosya değiştirilmez.
- **Paket/güvenlik kontrolü başarısız:** kontrolleri kapatma. Hata sürüyorsa hassas
  bilgi içermeyen işletim sistemi, Node sürümü ve komut sonucuyla issue aç.

### Testler, katkı ve lisans

`npm run check`: Biome önerilen kuralları, sıkı TypeScript derlemesi, açıkça listeli
Node test modülleri, bağımlılık lisansı/kayıt servisi/SHA-512/kurulum betiği kontrolü
ve sınırlı gizli bilgi örüntü taraması. `npm audit --audit-level=low` bağımlılık
veritabanında bilinen açıkları denetler; sıfır sonuç güvenlik garantisi değildir.
CI Windows, Ubuntu ve macOS üzerinde temiz kurulum, aynı kontroller, yardımcı
Node/Bash sözdizimi ve temiz Git diff kontrolü çalıştırır. İş akışı SHA'ya sabitlenmiş
eylemlerle salt okunur erişim kullanır; Discord tokenı istemez.

Testler Discord etkileşimlerini taklit eder. Gerçek sunucu kurulumu, gizli token
girişi, mobil/ekran okuyucu deneyimi ve uzun süreli çalışma otomatik olarak
doğrulanmış sayılmaz. Kurduktan sonra bunları kendi test kanalında dene.
VDS veya canlı Discord tokenı bu kaynakların doğrulaması için kullanılmamıştır.
[CONTRIBUTING.md](CONTRIBUTING.md) katkı adımlarını açıklar. Kod [MIT](LICENSE)
lisanslıdır; garanti sunulmaz. Bağımlılıklar kendi lisansları kapsamındadır.

## English

### Purpose and features

AltSprout helps community members workshop **their own written image descriptions**.
`/altsprout` opens a form, followed by a private preview with counts, deterministic
editing cues and human-review questions. **Share description** posts only the
description in the same channel. **Discard** deletes the bot's in-memory draft.
To revise, discard and run the command again.

- Turkish/English forms, previews, buttons and operation messages.
- 1–600 UTF-16 units, including outer spaces. Some emoji take two units. Displayed
  character counts are Unicode code points, not grapheme clusters; word counts
  use `Intl.Segmenter` and are approximate.
- Editing cues for more than 180 code points, generic image/photo openings,
  filenames, URLs and mention-like text. **180 is an editorial preference, not an
  accessibility standard, a score or a pass/fail threshold.**
- Single-use preview bound to creator, guild, channel, application and private
  message, expiring after five minutes. A new draft replaces that member's old
  draft in the same guild. Opening forms has a five-second user cooldown; sharing
  has a sixty-second channel cooldown, including after permission/network failures.
- No image downloads, OCR, AI generation, translation, URL fetching, message
  scanning, DMs, voice, moderation, quality scoring or user tracking.

The bot cannot see an image or judge accuracy, completeness or context. It does not
edit attachments or Discord's built-in alt-text field. A shared description is a
**separate message**, not native alt text and not automatically linked to an image.
The author must check meaningful details and text in the image without guessing
identities or feelings. No result certifies accessibility. Consider sensitive or
spoiler content before sharing publicly.

### Requirements

Use [Node.js 24](https://nodejs.org/en/download) with npm (`node --version` must show
`v24...`), Windows/macOS/Linux, an internet connection and your own Discord
application. You need a server where you can install the bot and an ordinary text
or announcement channel. npm registry access is needed to install packages; Discord
access is needed at runtime. This repository provides no hosted bot, uptime or
shared application token.

### Developer Portal and permissions

1. Open [Discord Developer Portal](https://discord.com/developers/applications),
   choose **New Application**, and note **Application ID** in General Information.
   You do not need a client secret.
2. On **Bot**, create/open the bot user and use **Reset Token**. Paste the token
   only into the local wizard. Never send it in chat, issues, screenshots, Git or
   token-checker websites. Reset immediately if exposed. Public Bot may be disabled.
3. Keep every **Privileged Gateway Intent** off. Message Content, Server Members
   and Presence are unnecessary. The code requests only **Guilds**.
4. Use **Guild Install** in Installation; user installation is unnecessary.
   In installation settings/OAuth2 URL Generator select `bot` and
   `applications.commands`. Request only **View Channels** and **Send Messages**,
   combined permission integer `3072`. No Administrator, Manage Messages, Read
   Message History, Embed Links, Attach Files, Mention Everyone, Manage Channels
   or voice permissions.
5. Open the generated install link and select your server. Channel overwrites
   must allow the bot to view and send there.
6. In Discord, enable **User Settings → Advanced → Developer Mode**. Right-click
   your server and choose **Copy Server ID**. No channel ID is needed.
7. Members need permission to use the application command. Server integration
   settings can restrict it. At sharing time, freshly fetched roles, channel and
   both member records must allow both the requester and bot to view/send.

### Installation and configuration

Choose **Code → Download ZIP** on GitHub and extract into a private folder owned by
your account. Do not run from the ZIP. Install Node 24 and reopen your terminal.
You do not need to edit source code.

**Windows:** run `setup.cmd` in the extracted folder. **macOS/Linux:** open a
terminal there and run `bash setup.sh`. Helpers install locked packages, run checks,
open the wizard and register the command, stopping on an error. Do not disable
system security protections for untrusted downloads.

The wizard asks for bot token, Application ID and Server ID. **Token entry is
invisible**, including while pasting; press Enter to continue or Ctrl+C to cancel.
It creates a local Git-ignored `.env` and refuses to overwrite an existing file.
To reconfigure, stop the bot, move the current file privately outside this project
(do not leave an `.env.backup` here), then run `npm run setup`. Never put real
secrets into `.env.example`.

Equivalent terminal steps:

```sh
npm ci --ignore-scripts
npm run check
npm run setup
npm run register
npm start
```

For hosted operation, secret environment variables `DISCORD_TOKEN`,
`DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID` override `.env`. The file accepts only
these three plain `KEY=value` lines and `#` comments; quotes/export syntax is not
supported. Normal installation requires no manual file editing. The wizard requests
POSIX file mode 0600; Windows access depends on account/folder ACLs. Never pass your
token as a command-line argument.

Registration adds/updates `/altsprout` only in the configured guild and preserves
differently named commands. Use a dedicated application because an existing command
with the same name will be replaced. One process serves one configured guild. Use
separate applications, folders and processes for additional guilds.

### Usage and keeping it online

1. Run `start.cmd` on Windows or `bash start.sh` on macOS/Linux.
2. After “AltSprout is ready”, select `/altsprout` in a text/announcement channel.
   Choose `language` **English** or **Türkçe**. Without that option, Turkish Discord
   locale uses Turkish; all other locales use English.
3. Enter, for example, “A red bicycle leans against a brick wall; a sign says Open.”
4. Read the private preview. It shows the complete description that will be shared
   and review prompts. Counts/prompts are excluded from the public post, which
   contains a fixed heading, description and author-accuracy reminder.
5. Choose **Share description** or **Discard**. Sharing creates a normal Discord
   message; ask a moderator to delete it using Discord's normal tools if necessary.
   The bot deliberately has no delete permission.

Closing the terminal, sleeping the computer or losing connectivity takes the bot
offline. For ongoing operation use a trusted Node 24 host running one process.
Prepare with `npm ci --ignore-scripts` and `npm run check`; start with `npm start`.
Use the host's secret-variable interface. CI does not host the bot. Restarting
clears all drafts. Use `register.cmd`, `bash register.sh` or `npm run register`
to register again when needed.

### Security, data and privacy

Discord delivers form text to the bot process. Previews are **ephemeral Discord
messages**, not end-to-end encrypted or hidden from Discord. Do not submit secrets.
RAM stores escaped sharing text, language, creator/guild/channel/application/message
IDs and expiry. Drafts do not retain raw interaction objects or interaction tokens.
There are at most 100 drafts and 500 IDs per cooldown map. Expired data is pruned
on the next operation or every thirty seconds. Share/Discard consumes a draft
synchronously before the first asynchronous operation. A failed send does not
retain or automatically retry it; check the channel before starting again.

No database, analytics, external AI or file content logging is used. SDK message,
member and user caches are disabled; guild/channel/role metadata may still be used
in memory. Your OS, host and Discord may process data under their own policies.
`.env` remains persistent secret configuration. Clearing bot RAM does not delete
Discord's private/public messages or screenshots/copies. Channel members can read
shared descriptions.

Markdown/link formatting is escaped, mention notifications disabled and URL embeds
suppressed. Hidden format/direction controls, private-use/unassigned characters and
controls other than newline/tab are rejected, including ZWJ-based composite emoji.
These filters do not moderate content. Follow community rules and
[Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy).
See [SECURITY.md](SECURITY.md) for token incidents and private reporting.

### Troubleshooting

- **No command:** check installation in the correct server, `applications.commands`,
  successful registration and server integration restrictions. Refresh Discord;
  run `npm run register`. This is guild registration, not global propagation.
- **Offline:** check Node 24, running process, internet and token. Reset privately
  in the portal if necessary. Application ID must match the token's application.
- **Permission warning:** inspect member and bot channel overwrites. Use ordinary
  text/announcement channels, not threads/forums/DM/voice/categories. Fix View
  Channel and Send Messages; do not grant Administrator.
- **Expired preview:** five minutes, a newer draft or a restart invalidates old
  buttons. Run `/altsprout` again.
- **Cooldown/capacity:** wait five seconds per person or sixty per sharing channel.
  At the hundred-draft limit wait for expiry; respect Discord rate limits.
- **Invalid text:** check the 600 UTF-16-unit limit and hidden/control characters.
  Simplify the description. A final defensive Discord preview-size check also applies.
- **Sending failed:** the bot does not automatically resend. A timeout might have
  delivered the message; check the channel first, then create a fresh preview.
- **Setup stopped:** use Node 24 and an interactive terminal; move an existing
  `.env` privately first. Configuration is never overwritten by the wizard.
- **Checks fail:** do not disable them. If persistent, open an issue with OS,
  Node version and sanitized command results; never attach secrets or private text.

### Tests, contribution and license

`npm run check` runs Biome's recommended preset, strict TypeScript compilation,
explicitly named Node test modules, dependency license/registry/SHA-512/install-script
checks and a limited source credential-pattern scan. `npm audit --audit-level=low`
checks known dependency advisories; zero results do not guarantee security.
Read-only SHA-pinned CI checks clean installation, the same commands, Node/Bash
helper syntax and a clean Git diff on Windows, Ubuntu and macOS without a token.

Interaction tests use mocks. Real Discord installation, interactive hidden-token
entry, mobile/screen-reader behavior and continuous hosting still require operator
validation in a test channel. No live Discord token or VDS was used to validate
these sources. See [CONTRIBUTING.md](CONTRIBUTING.md). Code is [MIT licensed](LICENSE),
without warranty; dependencies retain their own licenses.

## Official references / Resmî kaynaklar

- [Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Discord permissions](https://docs.discord.com/developers/topics/permissions)
- [discord.js documentation](https://discord.js.org/docs/packages/discord.js/main)
