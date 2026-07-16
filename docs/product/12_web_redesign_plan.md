# Web yeniden tasarım planı

> Hedef: OpenRouter ve Router9 gibi sade, hızlı, anlaşılır bir arayüz.
> Kullanıcı kayıttan ilk API isteğine 10 saniyede ulaşsın.
> Kayıt olur olmaz API anahtarını görsün.
> Provider olmak tek komutla bitsin.
> Hiçbir teknik terim, ID, cüzdan, ledger kullanıcı yüzünde görünmesin.

---

## İncelenen siteler

### OpenRouter (openrouter.ai)
- Giriş sayfası: "The Unified Interface For LLMs" — tek cümle, iki buton (Get API Key, Explore Models)
- Kayıttan API anahtarına: 3 adım (Signup → Buy credits → Get API key)
- Kayıt sonrası ilk ekran: API anahtarını gösterir + curl örneği
- Navigasyon: 7 başlık, sade
- Kullanıcı hiçbir teknik detay görmeden curl kopyalıyor
- Provider bölümü ayrı bir sayfada, onboarding'in önünde değil
- Mobil: responsive, çalışıyor

### Router9 (router9.com)
- Giriş sayfası: "The Unified Token Plan for AI Harnesses" — tek cümle, iki buton
- 3 komutla kurulum: sign up → export BASE_URL → MCP ekle
- Navigasyon: 5 başlık
- Hiç kayıt olmadan komutları gösteriyor
- Fiyatlandırma: Free / Pro / Max, 3 kart
- Mobil: responsive, çalışıyor

### Ortak özellikler
- Sade giriş sayfası, 1 cümle + 2 buton
- 3 adımda onboarding
- Kod/terminal örneği ön planda
- Navigasyon 5-7 başlık
- Karanlık tema
- Kullanıcı hiç teknik jargon görmüyor
- Provider olmak onboarding'in önünde değil, sekonder
- Mobil uyumlu

---

## Nuvonode için çıkarımlar

### Sorunlar
- Giriş sayfası çok karmaşık: 3 persona, kontrol paneli anlatımı, teknik terimler
- Kayıt olurken display name isteniyor, gereksiz
- Kayıt sonrası direkt API anahtarı gösterilmiyor önce boş dashboard görünüyor
- Navigasyon çok kalabalık: 7 kullanıcı + 8 admin başlığı
- Provider olmak için çok adım: create → init → doctor → serve → approve provider → approve model
- Token/ID karışıklığı: prv_ vs pvn_provider_
- Cüzdan/ledger/bakiye kafa karıştırıcı
- Provider kazancı harcanamıyor (en büyük ürün hatası)
- Admin sayfaları kullanıcıyla aynı navigasyonda
- Boş ekranlarda yönlendirme yok sadece "No providers yet." yazıyor
- Mobilde çalışmıyor (sağa kaydırma gerekiyor, tablolar taşıyor)

### Yapılması gerekenler
- Giriş sayfası: 1 cümle, 2 buton
- Kayıt: sadece email + şifre
- Kayıt sonrası ilk ekran: direkt API anahtarı + curl örneği
- Navigasyon: 5 başlık (Ana Sayfa, API, Kullanım, Bakiye, Node'larım)
- Admin tamamen ayrı
- Node kurulumu: tek komut
- Provider kazancı direkt harcanabilir
- Cüzdan/ledger/wallet kelimeleri yok
- Boş ekranlar yönlendirmeli: "Hiç node'un yok, hemen oluştur" gibi
- Mobil responsive

---

## Kredi döngüsü (tek cümle)

> Node çalıştır → kredi kazan → aynı krediyi model çağrılarında harca.

Bu döngü her sayfada görünmez ama bakiye ve node sayfalarında net belirtilir.
Kullanıcı kazandığı krediyi harcamak için ekstra hiçbir şey yapmaz.

---

## Uyarı stratejisi

Uyarılar sadece şu durumlarda gösterilir:
- **Node oluştururken**: "Node anahtarını kopyala, bir daha gösterilmez"
- **Node çalışırken**: "Node'un topluluk makinelerinde çalışıyor, hassas veri gönderme"
- **İlk API isteğinde**: "Kullandığın modeller topluluk tarafından çalıştırılıyor olabilir"

Giriş sayfasında, kayıt sayfasında veya dashboard ana sayfasında uyarı yok.

---

## Kayıt sonrası ilk ekran

Kullanıcı kaydolunca direkt şunu görür:

```
+----------------------------------------------+
|  🎉 Hoşgeldin! API anahtarın hazır.          |
|                                              |
|  curl https://api.nuvonode.dev/v1/chat/      |
|    completions                                |
|    -H "Authorization: Bearer pvn_xxx..."     |
|    -d '{"model":"qwen-7b-instruct",          |
|         "messages":[{"role":"user",           |
|         "content":"Merhaba"}]}'               |
|                                              |
|  [Kopyala]  [Yeni anahtar oluştur]           |
|                                              |
|  📋 Tüm modelleri gör →                      |
|  🔧 Node çalıştırmak mı istiyorsun? →        |
+----------------------------------------------+
```

- API anahtarı tek tıkla kopyalanabilir
- Model adı varsayılan olarak seçili gelir
- Kullanıcı isterse direkt curl'i terminale yapıştırıp çalıştırır
- "Node çalıştırmak mı istiyorsun?" ikincil seçenek

---

## Dashboard yapısı

```
+--------------------------------------------------+
|  Nuvonode              Ana Sayfa  API  Kullanım  |
|                       Bakiye  Node'larım          |
+--------------------------------------------------+
```

Kullanıcı navigasyonu (5 başlık):
1. **Ana Sayfa** — onboarding durumu, kısa özet, ilk adımlar
2. **API** — anahtarlar + modeller + curl örneği (tek sayfa)
3. **Kullanım** — istek geçmişi, sade liste
4. **Bakiye** — harcanabilir bakiye, kazanılan/harcanan, son hareketler
5. **Node'larım** — node oluşturma + durum + kazanç (adım adım)

Admin navigasyonu (ayrı, sadece admin rolündekiler görür):
1. **İnceleme** — onay bekleyen node'lar ve modeller
2. **Modeller** — model yönetimi
3. **İstekler** — tüm istekler ve kullanım
4. **Kredi düzenleme** — email ile kullanıcı bul, bakiye düzenle
5. **Denetim** — işlem geçmişi

---

## Boş ekran senaryoları

| Ekran | Durum | Gösterilecek mesaj |
|---|---|---|
| API | Hiç API anahtarı yok | "Henüz API anahtarın yok. Hemen oluştur ve ilk isteğini yap." + buton |
| Kullanım | Hiç kullanım yok | "Henüz hiç API isteği yapmadın. API sayfasından ilk isteğini dene." + API sayfasına link |
| Bakiye | Hiç işlem yok | "Henüz hiç kredi hareketin yok. Node çalıştırarak kredi kazanabilir veya API kullanarak harcayabilirsin." |
| Node'larım | Hiç node yok | "Henüz hiç node'un yok. Node çalıştırarak kredi kazanmaya başla." + buton |
| Node'larım | Node var ama çevrimdışı | "Node'un bağlı değil. Şu komutu çalıştırarak bağlan:" + komut |
| Node'larım | Node çevrimiçi ama onay bekliyor | "Node'un bağlı. Admin onayı bekleniyor, bu genelde birkaç dakika sürer." |
| İnceleme (admin) | Bekleyen yok | "Onay bekleyen node veya model yok. Her şey yolunda." |

---

## Faz 1: Altyapı — Tek bakiye modeli ⭐ İLK FAZ

> Bu faz olmadan diğer fazların anlamı yok.
> Provider kazancı doğrudan kullanıcının harcanabilir bakiyesine yazılsın.
> Cüzdan/wallet kavramı kullanıcı yüzünden kaldırılsın.

### Yapılacaklar
- [ ] Provider reward işlemini kullanıcı wallet'ına yaz (provider wallet'ına değil)
- [ ] API /api/wallet cevabındaki "disclaimer" metnini güncelle
- [ ] "wallet" kelimesini API cevaplarında "balance" ile değiştir
- [ ] Web'de Wallet tipini Balance olarak yeniden adlandır

### Değişecek dosyalar
- `apps/api/internal/service/services.go` — FinalizeUsage provider reward hedefi
- `apps/api/internal/handler/handlers.go` — Wallet disclaimer metni
- `apps/web/lib/api.ts` — Wallet → Balance tip değişikliği

---

## Faz 2: Navigasyon ve ana sayfa

> Navigasyon 5 başlığa düşsün.
> Admin tamamen ayrılsın.
> Ana sayfa onboarding check list'i olsun.

### Yapılacaklar
- [ ] Shell.tsx navigasyonunu 5 başlığa indir
- [ ] Admin linklerini kullanıcı navigasyonundan çıkar
- [ ] Ana sayfayı onboarding check list'ine çevir
- [ ] Kayıt sayfasından display name kaldır
- [ ] Giriş sayfasındaki teknik metinleri kaldır
- [ ] Landing sayfasını 1 cümle + 2 buton yap
- [ ] Kredi ve gizlilik uyarılarını sadece ilgili sayfalara taşı
- [ ] Kayıt sonrası ilk ekran: API anahtarı + curl örneği

### Değişecek dosyalar
- `apps/web/components/Shell.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/CreditNotice.tsx`
- `apps/web/components/PrivacyNotice.tsx`

---

## Faz 3: API sayfası

> Proje + API anahtarı + modeller + curl örneği tek sayfada.
> İlk kullanıcıya otomatik proje oluştur.

### Yapılacaklar
- [ ] Proje oluşturma ve API anahtarı oluşturmayı tek akışta birleştir
- [ ] İlk API anahtarı oluşturunca hemen curl örneği göster (model seçimiyle)
- [ ] Model listesini katalog gibi göster (isim + fiyat + açıklama)
- [ ] Proje sayfasını sadeleştir, teknik sütunları kaldır
- [ ] "Monthly credit limit" → "Harcama limiti"

### Değişecek dosyalar
- `apps/web/app/dashboard/projects/page.tsx`
- `apps/web/app/dashboard/api-keys/page.tsx`
- `apps/web/app/dashboard/models/page.tsx`

---

## Faz 4: Node akışı

> Node oluşturmak 1-2-3 adım.
> Token/ID karışıklığı yok.
> Tek komutla kurulum.

### Yapılacaklar
- [ ] Provider sayfasını adım adım yönlendirmeye çevir
- [ ] Token/ID karışıklığını gider: sadece "node anahtarı" göster
- [ ] Tek komutla kurulum
- [ ] allow_auto_model_pull gibi gelişmiş seçenekleri gizle
- [ ] Node durumunu sade göster (çevrimiçi/çevrimdışı)
- [ ] Kredi kazanç bilgisini ekle: "Kazandığın krediler bakiyene eklenir"
- [ ] "Provider" kelimesini "Node" ile değiştir

### Değişecek dosyalar
- `apps/web/app/dashboard/providers/page.tsx`

---

## Faz 5: Bakiye ve kullanım sayfaları

> "Krediler" değil "Bakiyem".
> Teknik terimler yok.
> Sadece harcanabilir bakiye ve hareketler.

### Yapılacaklar
- [ ] "Credits" sayfasını "Bakiye" olarak yeniden adlandır
- [ ] "Available credits" → "Harcanabilir bakiye"
- [ ] "Reserved credits" kaldır (gösterilmesin)
- [ ] Ledger tablosunu "Son hareketler" olarak göster
- [ ] Kredi uyarısını sadeleştir
- [ ] Kullanım sayfasındaki raw ID'leri kaldır
- [ ] Aynı bakiye API kullanımı ve node kazancı için geçerli olduğunu net belirt

### Değişecek dosyalar
- `apps/web/app/dashboard/credits/page.tsx`
- `apps/web/app/dashboard/usage/page.tsx`

---

## Faz 6: Admin sayfaları

> Admin paneli tamamen ayrı.
> Kullanıcı ID'si ile değil email ile arama.
> Onay bekleyen node'lar ve modeller tek sayfada.

### Yapılacaklar
- [ ] Admin provider ve provider-models sayfalarını birleştir: "İnceleme kuyruğu"
- [ ] Admin jobs ve usage sayfalarını birleştir: "İstekler"
- [ ] Admin wallets sayfasını "Kredi düzenleme" yap, email ile kullanıcı bul
- [ ] Audit log sayfasını "Denetim" olarak yeniden adlandır
- [ ] Tüm admin sayfalarındaki teknik ID'leri gizle

### Değişecek dosyalar
- `apps/web/app/admin/providers/page.tsx`
- `apps/web/app/admin/provider-models/page.tsx`
- `apps/web/app/admin/jobs/page.tsx`
- `apps/web/app/admin/usage/page.tsx`
- `apps/web/app/admin/wallets/page.tsx`

---

## Faz 7: Görsel iyileştirme ve mobil

> Mobil öncelikli yaklaşım.

### Yapılacaklar
- [ ] Cam efekti (glassmorphism) kaldır
- [ ] Neon gradyanları azalt
- [ ] Tablo görünümlerini sadeleştir
- [ ] Mobilde yatay kaydırma sorununu çöz
- [ ] Navigasyonu mobilde alt bar olarak düzenle
- [ ] Dokunmatik hedefleri büyüt (butonlar, linkler)
- [ ] Mobilde metin boyutlarını ayarla

### Değişecek dosyalar
- `apps/web/app/globals.css`

---

## Tavsiyeler (dokümana eklenenler)

1. **Kayıt sonrası ilk ekran API anahtarı olmalı** — OpenRouter gibi kullanıcı kaydolunca direkt API anahtarı + curl örneği görmeli. Boş dashboard göstermemeli.

2. **Boş ekranlar yönlendirmeli** — "No providers yet" gibi ölü mesajlar yerine "Hiç node'un yok, hemen oluştur" gibi bir sonraki adımı söyleyen mesajlar.

3. **Kredi döngüsü tek cümle** — "Node çalıştır → kredi kazan → aynı krediyi model çağrılarında harca."

4. **Mobil uyum zorunlu** — OpenRouter ve Router9 mobilde çalışıyor. Nuvonode da çalışmalı.

5. **Faz 1 blocker** — Tek bakiye modeli olmadan diğer fazlar anlamsız. Çünkü provider kazancı harcanamazsa arayüz ne kadar sade olursa olsun ürün yanlış.

6. **Uyarılar sadece gerektiği yerde** — Giriş sayfasında ve kayıtta uyarı göstermek anlamsız. Uyarılar sadece ilgili aksiyon anında gösterilmeli.

7. **Hata mesajları kullanıcı diliyle** — "invalid_request" gibi teknik kodlar yerine "Bir şey yanlış oldu, lütfen tekrar dene" gibi mesajlar.

---

## İsim değişiklikleri özeti

| Eski (teknik) | Yeni (kullanıcı) |
|---|---|
| Wallet / Cüzdan | Bakiye |
| Available credits | Harcanabilir bakiye |
| Reserved credits | (gösterilmez) |
| Provider | Node |
| Provider token | Node anahtarı |
| Provider ID (`prv_...`) | (gösterilmez) |
| Project | Uygulama |
| Monthly credit limit | Harcama limiti |
| Admin Wallets | Kredi düzenleme |
| Admin Jobs | İstekler |
| Provider Models | Model onayları |
| Audit Log | Denetim |
| Control plane | (kaldırıldı) |
| Ledger | Hareketler |
| API Keys | Anahtarlar |
| Usage | Kullanım |

---

## Doğrulama check list'i

Her fazdan sonra şunlar test edilecek:

### Kullanıcı akışı
- [ ] Kayıt ol (email + şifre, 5 saniye)
- [ ] Kayıt sonrası direkt API anahtarı + curl örneği gör
- [ ] curl'i kopyala, terminalde çalıştır
- [ ] Kullanım geçmişini gör
- [ ] Bakiyeni gör (kazanılan + harcanan)

### Node akışı
- [ ] Node oluştur (isim ver)
- [ ] Node anahtarını kopyala (tek seferlik)
- [ ] Tek komutla bağlan
- [ ] Node çevrimiçi olduğunu gör
- [ ] Model onaylandığını gör
- [ ] Kredi kazandığını gör
- [ ] Aynı krediyi API isteğinde harca

### Admin akışı
- [ ] Admin girişi
- [ ] Onay bekleyen node'ları ve modelleri tek sayfada gör
- [ ] Node onayla
- [ ] Model onayla
- [ ] Email ile kullanıcı bul, kredi düzenle
- [ ] Denetim geçmişini gör

### Mobil
- [ ] Kayıt sayfası mobilde okunabilir
- [ ] Dashboard mobilde kullanılabilir
- [ ] Tablolar mobilde taşmıyor
- [ ] Butonlara dokunmak kolay

### Hiçbir yerde olmaması gerekenler
- [ ] `prv_...` ID'leri kullanıcı yüzünde görünmüyor
- [ ] "wallet" kelimesi kullanıcı yüzünde geçmiyor
- [ ] "ledger" kelimesi geçmiyor
- [ ] "control plane" geçmiyor
- [ ] "trust_level" görünmüyor
- [ ] Rezerve krediler görünmüyor
- [ ] Teknik JSON hataları görünmüyor
- [ ] Display name kayıtta istenmiyor
- [ ] "invalid_request" gibi teknik hata kodları görünmüyor
