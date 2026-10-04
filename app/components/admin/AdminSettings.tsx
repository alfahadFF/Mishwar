import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { supabase } from '../../utils/supabase';
import { errMsg } from '../../utils/errors';
import { SETTINGS, SERVICE_NAME } from '../../utils/admin';
import { useToast } from '../Toast';
import { Empty, Btn, ui, C } from '../DriverUI';

const num = (v: string) => Number(String(v).replace(',', '.').trim());

// الإعدادات والعمولات: كل قيمة تُحفظ وحدها، والتغيير يسري على الطلبات الجديدة فقط
export default function AdminSettings() {
  const toast = useToast();
  const [vals, setVals] = useState<Record<string, string> | null>(null);
  const [orig, setOrig] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc('admin_settings');
    if (error) return toast.show(errMsg(error), 'err');
    const d: any = data || {};
    const v: Record<string, string> = {};
    SETTINGS.forEach(s => { const x = d.settings?.[s.k]; v[s.k] = x == null ? '' : String(x).replace(/"/g, ''); });
    (d.commissions || []).forEach((c: any) => { v['c:' + c.service] = String(Math.round(Number(c.rate) * 10000) / 100); });
    setVals(v); setOrig(v);
  };
  useEffect(() => { load(); }, []);

  const save = async (k: string) => {
    const n = num(vals![k]);
    if (!isFinite(n) || n < 0) return toast.show('أدخل رقماً صحيحاً', 'err');
    setBusy(k);
    const { error } = k.startsWith('c:')
      ? await supabase.rpc('admin_save_commission', { p_service: k.slice(2), p_pct: n })
      : await supabase.rpc('admin_save_setting', { p_key: k, p_value: n });
    setBusy(null);
    if (error) return toast.show(errMsg(error), 'err');
    setOrig(o => ({ ...o, [k]: vals![k] })); toast.show('تم الحفظ ✓');
  };

  const field = (k: string, label: string, unit: string, hint?: string) => {
    const changed = vals![k] !== orig[k];
    return (
      <View key={k} style={ui.card}>
        <Text style={ui.h}>{label}</Text>
        {!!hint && <Text style={ui.sub}>{hint}</Text>}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <TextInput value={vals![k]} onChangeText={t => setVals(v => ({ ...v!, [k]: t }))} keyboardType="decimal-pad" style={[ui.input, { flex: 1 }]} />
          <Text style={{ color: C.mute, fontWeight: '800', width: 34, textAlign: 'center' }}>{unit}</Text>
          <View style={{ width: 80 }}><Btn label="حفظ" small disabled={!changed} loading={busy === k} onPress={() => save(k)} /></View>
        </View>
      </View>
    );
  };

  const services = vals ? Object.keys(vals).filter(k => k.startsWith('c:')) : [];
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {!vals ? <Empty icon="⏳" title="جاري التحميل" /> : <>
          <Text style={[ui.label, { fontSize: 14 }]}>العمولات</Text>
          {services.map(k => field(k, SERVICE_NAME[k.slice(2)] || k.slice(2), '%', 'من 0 إلى 50'))}
          <Text style={[ui.label, { fontSize: 14, marginTop: 14 }]}>الإعدادات</Text>
          {SETTINGS.map(s => field(s.k, s.label, s.unit, s.hint))}
          <Text style={ui.note}>التغييرات تسري على الطلبات الجديدة فقط.</Text>
        </>}
      </ScrollView>
      {toast.node}
    </View>
  );
}
