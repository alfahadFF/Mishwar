# مشوار — ملف تسليم لمحادثة جديدة

## الوضع الحالي
- تطبيق Expo (React Native) + Supabase. كود التطبيق في `app/`، وملفات SQL في مجلدات `sql-*`.
- كل مجلدات SQL تم تشغيلها على Supabase وفحصها، بما فيها `sql-admin` (شاشات الإدارة: 4/4، 2/2، 12/12، 15/15).
- tsc يمر بلا أخطاء. آخر نسخة مضغوطة: `expo-screens.zip`.
- الفرع `main` في المستودع alfahadFF/Mishwar يحوي التطبيق جاهزاً للبناء (EAS).

## ناقص
- تشغيل سطر الأدمن التلقائي (الحساب برقم +963951928490 يصبح أدمن) إن لم يُشغَّل بعد — موجود في قسم «الأدمن» أدناه.
- خرائط Google (حالياً OSM).
- البناء EAS.
- مؤجّل: معادلات الأسعار (يقدمها المستخدم، 5 فئات تكسي)، وتعدد الدول والعملات (SY, IQ, LB, JO).
- فكرة جديدة لم تُناقش بعد: قسم «سفريات» (رحلات دولية).

## الأدمن
```sql
create or replace function public._auto_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.phone = '+963951928490' then new.is_admin := true; end if;
  return new;
end; $$;
revoke execute on function public._auto_admin() from public, anon, authenticated;
drop trigger if exists trg_auto_admin on public.profiles;
create trigger trg_auto_admin before insert on public.profiles
  for each row execute function public._auto_admin();
update public.profiles set is_admin = true where phone = '+963951928490';
```

## طريقة العمل مع المستخدم
- الرد بالعامية السورية، ونصوص التطبيق بالفصحى. ردود قصيرة ومركّزة.
- لا كود بدون موافقة صريحة؛ النقاش نقطة نقطة.
- المستخدم يعمل من الموبايل ويشغّل SQL في Supabase فقط.
- SQL: أجزاء أقل من ~100 سطر، 2–3 أجزاء بالرسالة، مع ذكر العدد أولاً، و«فضّي المحرر ولا تحدد جزء»، وفحص واحد بالآخر.
- «تم» بعد فحص = النتيجة مطابقة؛ بعد سؤال تصميم = موافقة.
- لا كلمات محلية للمركبات (سرفيس، ميكرو). لا تظهر كلمة «زبون»؛ يظهر «المعرّف» (wallet_id).
- Toast بدل alert. لا إحصائيات وهمية.

## أدوات الفحص
- `.tools/pgtest_*.mjs`: اختبارات PGlite لملفات SQL.
- فحص التطبيق: انسخ `app/` لمجلد مؤقت، `npm ci`، ثم `npx tsc --noEmit -p .` (لا تشغّل npm داخل app مباشرة).
