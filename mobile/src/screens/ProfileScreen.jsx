// src/screens/ProfileScreen.jsx
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#0a0f1a', surface: '#111827', border: '#1f2d45',
  orange: '#f97316', red: '#ef4444',
  text: '#f1f5f9', textMid: '#94a3b8', textDim: '#475569',
};

const ROLE_COLOR = { ADMIN: '#a855f7', OPS_MANAGER: '#3b82f6', STAFF: '#22c55e', CLIENT: '#f97316' };

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  }

  const roleColor = ROLE_COLOR[user?.role] || C.orange;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={{ padding: 24 }}>

        {/* Avatar */}
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <View style={[s.roleBadge, { backgroundColor: roleColor + '18', borderColor: roleColor + '40' }]}>
              <Text style={[s.roleText, { color: roleColor }]}>{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={s.card}>
          {[
            { label: 'Branch', value: user?.branch || 'Not set' },
            { label: 'Phone',  value: user?.phone  || 'Not set' },
            { label: 'Role',   value: user?.role   || '—' },
          ].map(item => (
            <View key={item.label} style={s.row}>
              <Text style={s.rowLabel}>{item.label}</Text>
              <Text style={s.rowValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* App info */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>App version</Text>
            <Text style={s.rowValue}>2.0.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Backend</Text>
            <Text style={[s.rowValue, { fontSize: 10 }]}>Railway · Production</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  avatarRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar:     { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(249,115,22,0.15)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 26, fontWeight: '900', color: C.orange },
  name:       { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 2 },
  email:      { fontSize: 12, color: C.textDim, marginBottom: 6 },
  roleBadge:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  roleText:   { fontSize: 11, fontWeight: '700' },
  card:       { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 4, marginBottom: 14 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLabel:   { fontSize: 13, color: C.textMid, fontWeight: '500' },
  rowValue:   { fontSize: 13, color: C.text, fontWeight: '600' },
  logoutBtn:  { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: C.red, fontSize: 15, fontWeight: '800' },
});
