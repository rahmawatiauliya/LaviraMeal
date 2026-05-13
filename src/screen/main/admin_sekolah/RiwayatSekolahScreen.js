import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const DANGER = '#F43F5E';

export default function RiwayatSekolahScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [userData, setUserData] = useState(null);

  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);

      const response = await apiClient.get(`sekolah/sekolah_get_riwayat.php?sekolah_id=${parsedUser.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setRiwayat(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching riwayat:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'MINTA_SALDO': return "wallet-outline";
      case 'DANA_KAGET': return "gift-outline";
      case 'TRANSFER': return "send-outline";
      default: return "notifications-outline";
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'MINTA_SALDO': return BLUE_PRIMARY;
      case 'DANA_KAGET': return GOLD;
      case 'TRANSFER': return SUCCESS;
      default: return '#64748B';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'MINTA_SALDO': return '#EEF2FF';
      case 'DANA_KAGET': return '#FFFBEB';
      case 'TRANSFER': return '#F0FDF4';
      default: return '#F1F5F9';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={BLUE_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Aktivitas</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE_PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
        >
          {riwayat.length > 0 ? riwayat.map((item, idx) => (
            <View key={idx} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: getBgColor(item.type) }]}>
                <Ionicons 
                  name={getIcon(item.type)} 
                  size={22} 
                  color={getColor(item.type)} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.itemHeader}>
                    <Text style={styles.historyMessage}>{item.message}</Text>
                    <Text style={styles.historyTime}>{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.historyDetail}>{item.detail}</Text>
                <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
              <Text style={styles.emptySubtitle}>Aktivitas sekolah Anda akan muncul di sini.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BLUE_PRIMARY },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMessage: { fontSize: 15, fontWeight: '700', color: BLUE_DARK, flex: 1 },
  historyTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  historyDetail: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  historyDate: { fontSize: 11, color: '#94A3B8', marginTop: 8, fontWeight: '500' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_DARK, marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }
});
