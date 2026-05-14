import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, 
  StatusBar, FlatList, ActivityIndicator, Alert, ScrollView, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const SUCCESS = '#10B981';

export default function LaporanKantinScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    total_pts: 0,
    total_transaksi: 0,
    rata_rata: 0,
    transaksi_minggu_ini: 0
  });
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const dataStr = await AsyncStorage.getItem('user_data');
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      setUserData(parsed);
      fetchData(parsed.id);
    }
  };

  const fetchData = useCallback(async (kantinId) => {
    if (!kantinId) return;
    try {
      // setLoading(true);
      // const res = await apiClient.get(`kantin/kantin_get_laporan.php?kantin_id=${kantinId}`);
      // if (res.data.status === 'success') {
      //   setStats(res.data.stats);
      //   setRiwayat(res.data.riwayat);
      // }
      
      // Mock data for now
      setStats({
        total_pts: 84,
        total_transaksi: 84,
        rata_rata: 1,
        transaksi_minggu_ini: 250
      });
      setRiwayat([
        { id: 1, nama: 'Siswa: Ahmad Fauzi', sub: 'Kelas 10-A · 14 Mei 2026', amount: 1 },
        { id: 2, nama: 'Siswa: Siti Aminah', sub: 'Kelas 11-B · 14 Mei 2026', amount: 1 },
        { id: 3, nama: 'Siswa: Budi Santoso', sub: 'Kelas 12-C · 13 Mei 2026', amount: 1 },
      ]);
    } catch (error) {
      console.error('Fetch Laporan Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id) {
        fetchData(userData.id);
      }
    }, [userData?.id])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.id) fetchData(userData.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [userData?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(userData?.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
        <Image 
          source={require('../../../../assets/batik_cirebon.png')} 
          style={styles.batikOverlay} 
        />
        <SafeAreaView>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Laporan Kantin</Text>
            <View style={styles.iconBtn}>
              <Feather name="bar-chart-2" size={22} color={WHITE} />
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Pantau pendapatan dan transaksi Anda secara realtime</Text>
        </SafeAreaView>
      </View>

      <View style={styles.whiteSection}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="wallet" size={20} color={SUCCESS} />
              </View>
              <Text style={styles.metricVal}>{Number(stats.total_pts).toLocaleString('id-ID')}</Text>
              <Text style={styles.metricLab}>Total PTS Didapat</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="receipt" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.metricVal}>{stats.total_transaksi}</Text>
              <Text style={styles.metricLab}>Total Transaksi</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="trending-up" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.metricVal}>{stats.rata_rata}</Text>
              <Text style={styles.metricLab}>Rata-rata PTS/Siswa</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.metricVal}>{stats.transaksi_minggu_ini}</Text>
              <Text style={styles.metricLab}>Transaksi Minggu Ini</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Transaksi Terkini</Text>
              <View style={styles.realtimeBadge}>
                 <View style={styles.liveDot} />
                 <Text style={styles.realtimeText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {riwayat.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View style={styles.listIconBox}>
                    <Ionicons name="person" size={20} color={BLUE_PRIMARY} />
                  </View>
                  <View style={styles.listBody}>
                    <Text style={styles.listTitle}>{item.nama}</Text>
                    <Text style={styles.listSub}>{item.sub}</Text>
                  </View>
                  <View style={styles.listTail}>
                    <Text style={[styles.listAmount, { color: SUCCESS }]}>+{item.amount} PTS</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeKantin')}>
          <Ionicons name="grid-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color={BLUE_PRIMARY} />
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Laporan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  header: { paddingHorizontal: 25, paddingBottom: 60, paddingTop: 20, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: WHITE },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  whiteSection: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 25, paddingTop: 30, marginTop: -30 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  metricCard: { width: '48%', backgroundColor: WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  metricVal: { fontSize: 22, fontWeight: 'bold', color: BLUE_PRIMARY },
  metricLab: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', marginTop: 5 },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  realtimeText: { fontSize: 8, fontWeight: '900', color: '#EF4444' },

  listContainer: { backgroundColor: WHITE, borderRadius: 24, paddingHorizontal: 5, paddingVertical: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  listBody: { flex: 1, marginLeft: 15 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  listSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  listTail: { alignItems: 'flex-end' },
  listAmount: { fontSize: 14, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
});
