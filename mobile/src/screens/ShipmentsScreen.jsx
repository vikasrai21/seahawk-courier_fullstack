// src/screens/ShipmentsScreen.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const C = {
  bg: '#0a0f1a', surface: '#111827', surfaceHi: '#1a2236',
  border: '#1f2d45', orange: '#f97316', blue: '#3b82f6',
  green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  text: '#f1f5f9', textMid: '#94a3b8', textDim: '#475569',
};

const STATUS_COLOR = {
  'Delivered': C.green, 'In Transit': C.blue,
  'Out for Delivery': C.orange, 'Pending': C.yellow,
  'RTO': C.red, 'Booked': C.textMid,
};

function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || C.blue;
  return (
    <View style={{ backgroundColor: `${color}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function ShipmentCard({ item }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.awb}>{item.awb}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={s.consignee} numberOfLines={1}>{item.consignee || '—'}</Text>
      <View style={s.cardBottom}>
        <Text style={s.meta}>{item.destination}</Text>
        <Text style={s.meta}>{item.courier} · {item.weight}kg</Text>
        <Text style={[s.meta, { color: C.orange }]}>
          ₹{Number(item.amount || 0).toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

export default function ShipmentsScreen() {
  const [shipments,  setShipments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 20;

  const statuses = ['', 'Booked', 'In Transit', 'Delivered', 'Pending', 'RTO'];

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (reset) { setPage(1); setLoading(true); }
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const res = await api.get(`/shipments?${params}`);
      const d   = res?.data || res;
      const rows = d?.shipments || d?.data || [];
      setShipments(reset ? rows : [...shipments, ...rows]);
      setTotal(d?.total || 0);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [page, search, status]);

  useEffect(() => { load(true); }, [search, status]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {/* Search */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search AWB / consignee…"
          placeholderTextColor={C.textDim}
          returnKeyType="search"
        />
      </View>

      {/* Status filter pills */}
      <View style={s.filterRow}>
        {statuses.map(st => (
          <TouchableOpacity
            key={st}
            onPress={() => setStatus(st)}
            style={[s.pill, status === st && s.pillActive]}
          >
            <Text style={[s.pillText, status === st && s.pillTextActive]}>
              {st || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && page === 1 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.orange} />
        </View>
      ) : (
        <FlatList
          data={shipments}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ShipmentCard item={item} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.orange} />}
          onEndReached={() => { if (shipments.length < total) { setPage(p => p + 1); load(); } }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<Text style={{ color: C.textDim, textAlign: 'center', marginTop: 40 }}>No shipments found</Text>}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  searchRow: { padding: 12, paddingBottom: 6 },
  searchInput: {
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2d45',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#f1f5f9', fontFamily: 'monospace',
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2d45' },
  pillActive: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)' },
  pillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  pillTextActive: { color: '#f97316' },
  card: {
    backgroundColor: '#111827', borderRadius: 14,
    borderWidth: 1, borderColor: '#1f2d45', padding: 14,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  awb: { fontSize: 13, fontWeight: '800', color: '#f97316', fontFamily: 'monospace' },
  consignee: { fontSize: 13, color: '#f1f5f9', fontWeight: '600', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  meta: { fontSize: 11, color: '#475569' },
});
