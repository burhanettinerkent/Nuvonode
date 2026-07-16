# UI düzeltme planı

## Amaç

Mevcut web arayüzünü sade, yönlendirici ve ilk bakışta anlaşılır hale getirmek.

Bir kullanıcı siteye girdiğinde en geç birkaç saniye içinde şunu anlamalı:
- Nuvonode ne yapıyor
- Burada ne yapabilirim
- Şimdi nereye tıklamalıyım

Bu planın amacı görsel süs eklemek değil.
Bu planın amacı ilk başarıyı hızlandırmak, jargonu azaltmak, akışı sadeleştirmek ve mobil kullanımı düzeltmek.

## Dayanak dokümanlar

Bu plan şu iki dokümana göre hazırlanmıştır:
- `docs/product/13_nuvonode_ui_ux_direction.md`
- `docs/product/12_web_redesign_plan.md`

## Ana problemler

### 1. İlk başarı akışı zayıf
- Kayıt sonrası kullanıcı boş dashboard benzeri bir yapıya düşüyor
- İlk API isteği için tek bakışta anlaşılır akış yok
- Dashboard ana sayfası yönlendirmiyor

### 2. Arayüz dili tam sade değil
- Bazı sayfalarda İngilizce ve operasyonel terimler var
- Bazı ekranlarda iç sistem dili kullanıcıya fazla yakın duruyor
- Ham ID ve teknik detaylar gereksiz yerlerde görünüyor

### 3. API kullanma akışı dağınık
- API key, uygulama, model ve örnek istek tek başarı akışı gibi hissettirmiyor
- İlk kullanıcı için yol fazla parçalı

### 4. Mobil deneyim yüzeysel çözülmüş
- Tablolar hâlâ merkezde
- Yatay kaydırma fallback olarak kullanılıyor
- Mobil navigasyon yeterince net değil

### 5. Görsel sistem hâlâ fazla gösterişli yerler taşıyor
- Cam/plastik koyu panel hissi bazı yerlerde okunurluğun önüne geçiyor
- Ürün ciddi ve sade hissettirmeli

---

## Düzeltme ilkeleri

Bu plan boyunca şu kurallar korunacak:

1. Her ekranda tek net sonraki adım olacak.
2. Kullanıcıya ürün çıktısı anlatılacak, iç sistem yapısı değil.
3. Teknik terimler kullanıcı yüzünde minimuma indirilecek.
4. Her boş ekran bir sonraki adımı söyleyecek.
5. Mobil görünüm masaüstünden sonra değil, birlikte düşünülecek.
6. Hareket/animasyon en son katman olacak.

---

## Faz 1 — İlk izlenim ve ilk başarı

> En kritik faz.
> Kullanıcı kayıt olur olmaz ne yapacağını anlamalı.

### Hedef
- Landing daha net olacak
- Kayıt sonrası kullanıcı ilk API isteğine en kısa yoldan ulaşacak
- Dashboard ana sayfası onboarding odaklı olacak

### Yapılacaklar
- [ ] Landing sayfasını 1 cümle + 2 ana aksiyon + kısa kanıt bloğu yap
- [ ] İkinci aksiyonu “Node çalıştır” yönüne çevir
- [ ] Kayıt sonrası akışı “ilk başarı ekranı” mantığına göre düzenle
- [ ] Kullanıcıya API anahtarı veya anahtara giden en kısa yol göster
- [ ] Kopyalanabilir örnek istek göster
- [ ] Dashboard ana sayfasını checklist + sonraki adım mantığıyla yeniden kur
- [ ] “Inference operations”, “control plane”, “workspace overview” gibi dili kaldır

### Hedef dosyalar
- `apps/web/app/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/Shell.tsx`

### Kabul kriteri
- Yeni kullanıcı landing sayfasında iki yolu da anlar: API kullanmak veya node çalıştırmak
- Kayıt sonrası ilk ekranda ne yapacağı açıktır
- İlk API isteği için docs okumaya gerek kalmaz
- Dashboard ana sayfası metrik vitrini değil, yönlendirme ekranı gibi çalışır

---

## Faz 2 — Dil, terim ve empty state temizliği

> Sadeleşme sadece layout ile değil, dil ile olur.

### Hedef
- Kullanıcı yüzündeki copy daha kısa, net ve Türkçe olacak
- Teknik iç terimler gizlenecek
- Boş ekranlar yönlendirme yapacak

### Yapılacaklar
- [ ] Kullanıcı yüzündeki İngilizce metinleri temizle
- [ ] Hata, loading ve başarı metinlerini kullanıcı diline çek
- [ ] “wallet”, “ledger”, “provider id”, “control plane”, “workspace” gibi dili kaldır
- [ ] Ham ID gösterimlerini kullanıcı ekranlarından kaldır
- [ ] API, kullanım, bakiye, node, admin review empty state’lerini yönlendirmeli yap
- [ ] Uyarıları sadece ilgili aksiyon anında göster

### Hedef dosyalar
- `apps/web/components/Shell.tsx`
- `apps/web/components/State.tsx`
- `apps/web/components/CreditNotice.tsx`
- `apps/web/components/PrivacyNotice.tsx`
- `apps/web/app/dashboard/api-keys/page.tsx`
- `apps/web/app/dashboard/usage/page.tsx`
- `apps/web/app/dashboard/credits/page.tsx`
- `apps/web/app/dashboard/providers/page.tsx`
- `apps/web/app/admin/providers/page.tsx`

### Kabul kriteri
- Kullanıcı tarafında gereksiz İngilizce kalmaz
- Teknik terim yoğunluğu belirgin şekilde düşer
- Boş ekranlar “şimdi ne yapmalıyım?” sorusuna cevap verir
- Ham ID’ler kullanıcı ekranlarında görünmez

---

## Faz 3 — API alanını tek akışa çevirme

> Ürünün ana değeri burada.

### Hedef
- API kullanımı tek bakışta anlaşılır olacak
- Anahtar oluşturma, örnek istek, model seçimi, uygulama bağlamı tek deneyimde toplanacak

### Yapılacaklar
- [ ] API ekranını ilk başarı merkezi haline getir
- [ ] İlk kullanıcı için otomatik uygulama/proje akışını sadeleştir
- [ ] API anahtarı oluşturduktan sonra örnek isteği daha görünür yap
- [ ] Ham key ID gösterimini kaldır
- [ ] Model listesini katalog gibi sun: isim, ne işe yarar, fiyat
- [ ] Mümkünse proje ve API key akışını tek kullanıcı işi olarak göster

### Hedef dosyalar
- `apps/web/app/dashboard/api-keys/page.tsx`
- `apps/web/app/dashboard/projects/page.tsx`
- `apps/web/app/dashboard/models/page.tsx`
- `apps/web/lib/api.ts`

### Kabul kriteri
- Kullanıcı API ekranına gelip ilk anahtarını oluşturabilir
- Kullanıcı örnek isteği kopyalayıp hemen kullanabilir
- Model listesi teknik tablo gibi değil, seçim yardımı gibi davranır
- Kullanıcı farklı sayfalarda kaybolmadan ilk API çağrısını yapabilir

---

## Faz 4 — Bakiye ve kullanım sayfalarını sadeleştirme

> Kullanıcı ne harcadığını ve ne kazandığını hemen anlayabilmeli.

### Hedef
- Bakiye ve kullanım ekranları karar verdiren, okunaklı ekranlara dönüşecek
- Teknik muhasebe dili azaltılacak

### Yapılacaklar
- [ ] Bakiye sayfasında “Son hareketler” mantığına geç
- [ ] Teknik hareket tiplerini kullanıcı diline çevir
- [ ] Reserved benzeri kafa karıştırıcı alanları kullanıcı merkezinden uzak tut
- [ ] Kullanım tablosunda sadece karar verdiren sütunları öne çıkar
- [ ] “Henüz hiç kullanım yok” ve “Henüz hiç hareket yok” durumlarını yönlendirmeli yap
- [ ] Filtre çubuğunu daha kısa ve mobil uyumlu hale getir

### Hedef dosyalar
- `apps/web/app/dashboard/credits/page.tsx`
- `apps/web/app/dashboard/usage/page.tsx`
- `apps/web/components/Display.tsx`

### Kabul kriteri
- Kullanıcı bakiyesini ilk bakışta okur
- Kullanım geçmişi sade ve anlaşılır görünür
- Teknik terim yerine ürün dili kullanılır
- Mobilde filtre ve liste kullanımı zorlamaz

---

## Faz 5 — Node akışını gerçek onboarding akışına çevirme

> Node çalıştırmak ikinci yol ama net olmalı.

### Hedef
- Node kurmak 1-2-3 hissi verecek
- Kullanıcı docs açmadan ne yapacağını anlayacak

### Yapılacaklar
- [ ] Node ekranını adım adım kurulum mantığıyla yeniden düzenle
- [ ] “Node oluştur”, “anahtarı kopyala”, “komutu çalıştır”, “durumu gör” akışını netleştir
- [ ] Offline / waiting approval / online durumlarını daha açıklayıcı yap
- [ ] Komut bloğunu daha sade ve kopyalanabilir yap
- [ ] Tekrarlayan uyarıları azalt
- [ ] Gelişmiş detayları varsayılan görünümden uzaklaştır

### Hedef dosyalar
- `apps/web/app/dashboard/providers/page.tsx`
- `apps/web/components/CopyBox.tsx`
- `apps/web/components/PrivacyNotice.tsx`
- `apps/web/components/CreditNotice.tsx`

### Kabul kriteri
- Yeni kullanıcı node oluşturmayı docs’suz anlayabilir
- Durum ekranı neyin eksik olduğunu söyler
- Kullanıcı node kredi döngüsünü açıkça görür
- Tekrarlayan mesajlar azalır

---

## Faz 6 — Admin ekranlarını sadeleştirme

> Admin ekranları yoğun olabilir ama yine de insan okunur olmalı.

### Hedef
- Admin ekranları daha hızlı taranır olacak
- Teknik kimlikler yerine insan odaklı bilgi öne çıkacak

### Yapılacaklar
- [ ] İnceleme ekranlarında ham ID kullanımını azalt
- [ ] Node adı, email, model adı, zaman ve durum bilgisini öne çıkar
- [ ] Empty state’leri kuru bırakma
- [ ] Admin shell dilini de sadeleştir
- [ ] Uygun yerlerde tablo yerine daha okunur blok/card sunumlarını düşün

### Hedef dosyalar
- `apps/web/app/admin/providers/page.tsx`
- `apps/web/app/admin/jobs/page.tsx`
- `apps/web/app/admin/usage/page.tsx`
- `apps/web/app/admin/wallets/page.tsx`
- `apps/web/components/Shell.tsx`

### Kabul kriteri
- Admin ekranlarında insan okunur bilgi önce gelir
- Ham ID bağımlılığı azalır
- Bekleyen işler daha hızlı taranır

---

## Faz 7 — Mobil ve görsel sistem düzeltmeleri

> Yapı düzeldikten sonra görünüm ve mobil davranış netleştirilecek.

### Hedef
- Görsel sistem daha sade olacak
- Mobilde temel akışlar rahat kullanılacak
- Tablo bağımlılığı azalacak

### Yapılacaklar
- [ ] Glass hissini azalt, daha solid yüzeylere geç
- [ ] Parlak neon etkisini azalt
- [ ] Mobil navigasyonu daha net hale getir
- [ ] Geniş tablolar için card/list fallback tasarla
- [ ] Tap target’ları büyüt
- [ ] Küçük ekranlarda spacing ve başlık boyutlarını yeniden ayarla

### Hedef dosyalar
- `apps/web/app/globals.css`
- `apps/web/components/Shell.tsx`
- `apps/web/app/dashboard/**/*.tsx`
- `apps/web/app/admin/**/*.tsx`

### Kabul kriteri
- Mobilde ana akışlar yatay kaydırma zorlamaz
- İlk aksiyonlar küçük ekranda erken görünür
- Görsel stil daha sakin ve daha okunaklı olur

---

## Önerilen uygulama sırası

### Dilim 1
- Faz 1
- Faz 2

### Dilim 2
- Faz 3
- Faz 4

### Dilim 3
- Faz 5
- Faz 6
- Faz 7

Bu sıra doğru çünkü önce kullanıcının ne yapacağını anlaşılır hale getirmek gerekir.
Daha sonra API ve bakiye gibi ana iş ekranları sadeleştirilir.
En son node, admin ve görsel/mobil polish katmanı gelir.

---

## En kritik hedef dosyalar özeti

- `apps/web/app/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/dashboard/api-keys/page.tsx`
- `apps/web/app/dashboard/usage/page.tsx`
- `apps/web/app/dashboard/credits/page.tsx`
- `apps/web/app/dashboard/providers/page.tsx`
- `apps/web/app/admin/providers/page.tsx`
- `apps/web/components/Shell.tsx`
- `apps/web/components/State.tsx`
- `apps/web/components/CreditNotice.tsx`
- `apps/web/components/PrivacyNotice.tsx`
- `apps/web/app/globals.css`

---

## Son kabul ölçütü

Bu plan tamamlandığında:
- teknik olmayan biri Nuvonode’u ilk bakışta anlayabilmeli
- kayıt sonrası ilk API çağrısına en kısa yoldan ulaşabilmeli
- node çalıştırma yolu ikinci ama net bir seçenek olmalı
- ekranlar kullanıcıyı yönlendirmeli, bekletmemeli
- mobil deneyim gerçek anlamda kullanılabilir olmalı
- görsel stil ürünün netliğini desteklemeli, dikkat dağıtmamalı
