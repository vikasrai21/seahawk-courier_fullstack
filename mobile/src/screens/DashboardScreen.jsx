// src/screens/DashboardScreen.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const C = {
  bg:        '#0a0f1a',
  surface:   '#111827',
  surfaceHi: '#1a2236',
  border:    '#1f2d45',
  orange:    '#f97316',
  blue:      '#3b82f6',
  green:     '#22c55e',
  red:       '#ef4444',
  yellow:    '#eab308',
  purple:    '#a855f7',
  text:      '#f1f5f9',
  textMid:   '#94a3b8',
  textDim:   '#475569',
};

const fmt    = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent, emoji }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: accent }]}>
      <Text style={styles.kpiEmoji}>{emoji}</Text>
      <Text style={[styles.kpiValue, { color: C.text }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ── Alert Banner ─────────────────────────────────────────────────────────
function AlertBanner({ actions }) {
  if (!actions?.total) return null;
  return (
    <View style={styles.alertBanner}>
      <Text style={styles.alertIcon}>🔔</Text>
      <Text style={styles.alertText}>
        {actions.total} item{actions.total > 1 ? 's' : ''} need attention
        {actions.pendingNDRs > 0  ? ` · ${actions.pendingNDRs} NDRs` : ''}
        {actions.rtoShipments > 0 ? ` · ${actions.rtoShipments} RTOs` : ''}
        {actions.todayPickups > 0 ? ` · ${actions.todayPickups} Pickups` : ''}
      </Text>
    </View>
  );
}

// ── Status Row ────────────────────────────────────────────────────────────
function StatusRow({ label, value, color }) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color }]}>{fmtNum(value)}</Text>
    </View>
  );
}

// ── Recent Activity Item ──────────────────────────────────────────────────
function ActivityItem({ item }) {
  const icons = { CREATE: '➕', STATUS_CHANGE: '🔄', DELETE: '🗑️', LOGIN: '🔐' };
  const verbs = { CREATE: 'created', STATUS_CHANGE: 'updated', DELETE: 'deleted', LOGIN: 'logged in' };
  return (
    <View style={styles.activityItem}>
      <Text style={styles.activityIcon}>{icons[item.action] || '✏️'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={{ color: C.text, fontWeight: '700' }}>{item.user}</Text>
          {' '}<Text style={{ color: C.textDim }}>{verbs[item.action] || 'modified'}</Text>
          {item.entityId ? <Text style={{ color: C.orange }}> {item.entityId}</Text> : ''}
        </Text>
        <Text style={styles.activityTime}>
          {item.time ? new Date(item.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await api.get('/ops/dashboard-summary');
      setData(res?.data || res);
    } catch (err) {
      if (!isRefresh) Alert.alert('Error', err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load(true);
  }

  const today  = data?.today;
  const profit = data?.profit;
  const actions= data?.pendingActions;

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={{ color: C.textDim, marginTop: 12, fontSize: 13 }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, <Text style={{ color: C.orange }}>{user?.name?.split(' ')[0]}</Text>
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{user?.role}</Text>
          </View>
        </View>

        {/* Alert Banner */}
        <AlertBanner actions={actions} />

        {/* KPI Grid */}
        <Text style={styles.sectionLabel}>TODAY</Text>
        <View style={styles.kpiGrid}>
          <KpiCard label="Shipments"     value={fmtNum(today?.total     || 0)} accent={C.orange} emoji="📦" />
          <KpiCard label="Delivered"     value={fmtNum(today?.delivered || 0)} accent={C.green}  emoji="✅" />
          <KpiCard label="In Transit"    value={fmtNum(today?.inTransit || 0)} accent={C.blue}   emoji="🚚" />
          <KpiCard label="Revenue"       value={fmt(today?.amount       || 0)} accent={C.orange} emoji="💰" />
        </View>

        {/* 30-day Revenue */}
        {profit && (
          <>
            <Text style={styles.sectionLabel}>LAST 30 DAYS</Text>
            <View style={styles.kpiGrid}>
              <KpiCard label="Total Revenue"  value={fmt(profit.totalRevenue    || 0)} accent={C.green}  emoji="📈" />
              <KpiCard label="Shipments"      value={fmtNum(profit.totalShipments|| 0)} accent={C.blue}  emoji="📊" />
              <KpiCard label="Avg / Shipment" value={fmt(profit.avgPerShipment  || 0)} accent={C.yellow} emoji="💹" />
              <KpiCard label="Delayed"        value={fmtNum(data?.delayedCount  || 0)} accent={C.red}    emoji="⏰" />
            </View>
          </>
        )}

        {/* Status breakdown */}
        <Text style={styles.sectionLabel}>STATUS BREAKDOWN</Text>
        <View style={styles.card}>
          <StatusRow label="Delivered"   value={today?.delivered  || 0} color={C.green}  />
          <StatusRow label="In Transit"  value={today?.inTransit  || 0} color={C.blue}   />
          <StatusRow label="Pending"     value={today?.pending    || 0} color={C.yellow} />
          <StatusRow label="RTO"         value={today?.rto        || 0} color={C.red}    />
        </View>

        {/* RTO Alerts */}
        {data?.rtoAlerts?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RTO ALERTS</Text>
            <View style={styles.card}>
              {data.rtoAlerts.map(a => (
                <View key={a.courier} style={styles.rtoRow}>
                  <Text style={styles.rtoCourier}>{a.courier}</Text>
                  <Text style={styles.rtoRate}>{a.rate}% RTO</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent Activity */}
        {data?.activity?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
            <View style={styles.card}>
              {data.activity.slice(0, 6).map((item, i) => (
                <ActivityItem key={item.id || i} item={item} />
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
  },
  date: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  headerBadge: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    color: C.orange,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234,179,8,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertIcon: { fontSize: 14 },
  alertText: {
    flex: 1,
    color: C.yellow,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 2,
    borderRadius: 14,
    padding: 14,
    width: '47.5%',
  },
  kpiEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    color: C.textDim,
    fontWeight: '600',
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    flex: 1,
    fontSize: 13,
    color: C.textMid,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  rtoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  rtoCourier: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: '600',
  },
  rtoRate: {
    fontSize: 13,
    color: C.red,
    fontWeight: '800',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    gap: 10,
  },
  activityIcon: { fontSize: 14, marginTop: 1 },
  activityText: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 10,
    color: C.textDim,
    marginTop: 2,
    fontFamily: 'monospace',
  },
});
