# Security / Güvenlik

Never include tokens, .env files, private descriptions or user IDs in public issues.
Use GitHub's private vulnerability reporting if enabled on this repository. If it is
unavailable, open an issue asking for a private reporting channel without exploit
details or sensitive data. There is no promised response SLA.

Token, .env, özel açıklama veya kullanıcı kimliklerini açık issue'lara ekleme.
Depoda etkinse GitHub'ın özel güvenlik bildirimi özelliğini kullan. Değilse hassas
bilgi veya istismar ayrıntısı paylaşmadan özel bildirim kanalı talep eden issue aç.
Yanıt süresi garantisi yoktur.

If a token leaks, reset it immediately in Discord Developer Portal, stop the old
process, replace the local configuration privately and restart. Removing a token
from a file or Git commit does not revoke it. Review who can read the hosting
account, backups and .env. POSIX mode 0600 is requested by the wizard; Windows
access control comes from your account/folder permissions.

Token açığa çıkarsa Developer Portal'da hemen sıfırla, eski süreci durdur, yerel
yapılandırmayı güvenle değiştir ve yeniden başlat. Dosyadan/commit'ten silmek tokenı
geçersiz kılmaz. Sunucu hesabı, yedekler ve .env erişimini incele. Sihirbaz POSIX'te
0600 ister; Windows erişimi hesap ve klasör izinlerine bağlıdır.

Only version 1.x is currently in scope. Automated checks do not certify security,
accessibility, description accuracy or platform compliance for an operator's use.
Yalnızca 1.x sürümü kapsamdadır; otomatik kontroller güvenlik, erişilebilirlik,
açıklama doğruluğu veya işletmecinin kullanımının kurallara uygunluğunu belgelemez.
