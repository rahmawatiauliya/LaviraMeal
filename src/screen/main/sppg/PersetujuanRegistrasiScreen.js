import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function PersetujuanRegistrasiScreen({ navigation }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('sppg/get_pending_kantin.php');
      if (response.data.status === 'success') {
        setPendingUsers(response.data.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal mengambil data pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = (userId, userName) => {
    Alert.alert(
      'Konfirmasi ACC',
      `Setujui pendaftaran kantin atas nama ${userName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: async () => {
            try {
              setActionLoading(userId);
              const response = await apiClient.post('sppg/approve_kantin.php', {
                user_id: userId,
              });
              if (response.data.status === 'success') {
                Alert.alert('Sukses', 'Registrasi kantin berhasil disetujui');
                fetchPendingUsers();
              } else {
                Alert.alert('Gagal', response.data.message);
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal memproses persetujuan');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.nama || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama}</Text>
          <Text style={styles.userRole}>Calon Pengelola Kantin</Text>
        </View>
        <View style={styles.badgePending}>
          <Text style={styles.badgeText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="user" size={14} color="#64748b" />
          <Text style={styles.infoText}>Username: {item.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="mail" size={14} color="#64748b" />
          <Text style={styles.infoText}>Email: {item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="calendar" size={14} color="#64748b" />
          <Text style={styles.infoText}>Tgl Daftar: {item.created_at}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.approveBtn}
        onPress={() => handleApprove(item.id, item.nama)}
        disabled={actionLoading === item.id}
      >
        {actionLoading === item.id ? (
          <ActivityIndicator color={WHITE} />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
            <Text style={styles.approveBtnTxt}>Setujui Registrasi (ACC)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Persetujuan Registrasi</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE_PRIMARY} />
          <Text style={styles.loadingTxt}>Memuat data...</Text>
        </View>
      ) : pendingUsers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Tidak Ada Antrean</Text>
          <Text style={styles.emptySub}>Semua pendaftaran kantin sudah diproses.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingUsers}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: WHITE,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  listContent: { padding: 20, paddingBottom: 50 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badgePending: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#c2410c' },
  cardBody: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 15,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 10 },
  approveBtn: {
    backgroundColor: BLUE_PRIMARY,
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  approveBtnTxt: { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: '500' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});
