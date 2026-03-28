// src/screens/TrackScreen.jsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const C = {
  bg: '#0a0f1a', surface: '#111827', surfaceHi: '#1a2236',
  border: '#1f2d45', orange: '#f97316', blue: '#3b82f6',
  green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  purple: '#a855f7', text: '#f1f5f9', textMid: '#94a3b8', textDim: '#475569',
};

const STATUS_COLOR = {
  'Booked': C.blue, 'Picked Up': C.orange, 'In Transit': C.blue,
  'Out for Delivery': C.orange, 'Delivered': C.green,
  'RTO': C.red, 'NDR': C.yellow, 'Pending': C.yellow,
};

function TimelineEvent({ event, isFirst, isLast }) {
  const color = STATUS_COLOR[event.status] || C.blue;
  const isNDR = event.type === 'NDR';
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Line + dot */}
      <View style={{ alignItems: 'center', width: 24 }}>
        <View style={[s.dot, { backgroundColor: isFirst || isLast ? color : C.surfaceHi, borderColor: color }]} />
        {!isLast && <View style={[s.line, { backgroundColor: color + '40' }]} />}
      </View>
      {/* Content */}
      <View style={[s.eventCard, { borderColor: isNDR ? C.yellow + '40' : C.border, marginBottom: isLast ? 0 : 12 }]}>
        <Text style={[s.eventStatus, { color }]}>{event.status}</Text>
        {!!event.description && <Text style={s.eventDesc}>{event.description}</Text>}
        {!!event.location    && <Text style={s.eventLoc}>📍 {event.location}</Text>}
        <Text style={s.eventTime}>
          {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    </View>
  );
}

export default function TrackScreen() {
  const [awb,     setAwb]     = useState('');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  async function track() {
    if (!awb.trim()) return;
    setLoading(true); setData(null);
    try {
      const res = await api.get(`/ops/shipment-timeline/${awb.trim()}`);
      setData(res?.data || res);
    } catch (err) {
      Alert.alert('Not found', err?.message || 'Shipment not found');
    } finally {
      setLoading(false);
    }
  }

  const timeline = data?.timeline ? [...data.timeline].reverse() : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">

        <Text style={s.title}>Track Shipment</Text>

        {/* Search */}
        <View style={s.searchRow}>
          <TextInput
            style={s.input}
            value={awb}
            onChangeText={setAwb}
            placeholder="Enter AWB number…"
            placeholderTextColor={C.textDim}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={track}
          />
          <TouchableOpacity style={s.btn} onPress={track} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Track</Text>}
          </TouchableOpacity>
        </View>

        {/* Shipment info */}
        {data && (
          <>
            <View style={s.infoCard}>
              <Text style={s.awbText}>{data.awb}</Text>
              <View style={{ backgroundColor: (STATUS_COLOR[data.status] || C.blue) + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 }}>
                <Text style={{ color: STATUS_COLOR[data.status] || C.blue, fontSize: 12, fontWeight: '700' }}>{data.status}</Text>
              </View>
              <View style={s.infoGrid}>
                {[
                  { l: 'Consignee',   v: data.consignee   },
                  { l: 'Destination', v: data.destination },
                  { l: 'Courier',     v: data.courier     },
                  { l: 'Client',      v: data.client?.company },
                ].filter(f => f.v).map(f => (
                  <View key={f.l} style={s.infoItem}>
                    <Text style={s.infoLabel}>{f.l}</Text>
                    <Text style={s.infoValue}>{f.v}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={s.sectionLabel}>TRACKING HISTORY — {timeline.length} events</Text>
            <View style={s.timelineCard}>
              {timeline.length === 0
                ? <Text style={{ color: C.textDim, fontSize: 13 }}>No tracking events yet</Text>
                : timeline.map((e, i) => (
                    <TimelineEvent key={i} event={e} isFirst={i === 0} isLast={i === timeline.length - 1} />
                  ))
              }
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title:       { fontSize: 20, fontWeight: '900', color: '#f1f5f9', marginBottom: 16 },
  searchRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  input:       { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2d45', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#f1f5f9', fontFamily: 'monospace' },
  btn:         { backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  btnText:     { color: '#fff', fontWeight: '800', fontSize: 14 },
  infoCard:    { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2d45', borderRadius: 14, padding: 16, marginBottom: 20 },
  awbText:     { fontSize: 20, fontWeight: '900', color: '#f97316', fontFamily: 'monospace' },
  infoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  infoItem:    { backgroundColor: '#1a2236', borderRadius: 10, padding: 10, minWidth: '45%', flex: 1 },
  infoLabel:   { fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue:   { fontSize: 13, color: '#f1f5f9', fontWeight: '600' },
  sectionLabel:{ fontSize: 10, fontWeight: '700', color: '#475569', letterSpacing: 1, marginBottom: 12 },
  timelineCard:{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2d45', borderRadius: 14, padding: 16 },
  dot:         { width: 16, height: 16, borderRadius: 8, borderWidth: 2, zIndex: 1 },
  line:        { width: 2, flex: 1, minHeight: 20 },
  eventCard:   { flex: 1, backgroundColor: '#1a2236', borderWidth: 1, borderRadius: 10, padding: 12 },
  eventStatus: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  eventDesc:   { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginBottom: 4 },
  eventLoc:    { fontSize: 11, color: '#475569', marginBottom: 4 },
  eventTime:   { fontSize: 10, color: '#475569', fontFamily: 'monospace' },
});
