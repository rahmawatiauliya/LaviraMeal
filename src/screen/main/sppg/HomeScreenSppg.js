import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  Animated,
  Alert,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F5F7FA';

export default function HomeScreenSppg({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const isTablet = width > 480 && width <= 768;

  const [stats, setStats] = useState({
    total_sekolah: 0,
    total_verifikasi: 0,
    kantin_aktif: 0,
    point_bulan_ini: 0,
    grafik_konsumsi: [35, 45, 40, 55, 50, 65, 70]
  });
  const [balance, setBalance] = useState(75250000);
  const [userName, setUserName] = useState('Admin');
  const [profileImage, setProfileImage] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingKantinCount, setPendingKantinCount] = useState(0);
  const [sppgId, setSppgId] = useState(null);
  const [activeTransType, setActiveTransType] = useState(null); // 'kirim' or 'topup'
  const [transAmount, setTransAmount] = useState('');
  const [transHistory, setTransHistory] = useState([]);

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const init = async () => {
      const userData = await loadUserData();
      if (userData && userData.sppg_id) {
        fetchStats(userData.sppg_id);
      }
    };
    init();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.nama || 'Admin');
        setProfileImage(parsed.foto);
        setSppgId(parsed.sppg_id);
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const fetchStats = async (sppgId) => {
    try {
      if (!sppgId) {
        const userData = await AsyncStorage.getItem('user_data');
        const parsed = userData ? JSON.parse(userData) : null;
        sppgId = parsed?.sppg_id;
      }

      if (!sppgId) return;

      const response = await apiClient.get(`sppg/sppg_get_stats.php?sppg_id=${sppgId}`);
      if (response && response.data && response.data.status === 'success') {
        const newData = response.data.data || {};
        setStats({
          total_sekolah: newData.total_sekolah || 0,
          total_verifikasi: newData.total_verifikasi || 0,
          kantin_aktif: newData.kantin_aktif || 0,
          point_bulan_ini: newData.point_bulan_ini || 0,
          poin_distribusi: newData.poin_distribusi || 0,
          notifikasi: newData.notifikasi || [],
          grafik_konsumsi: newData.grafik_konsumsi || []
        });
        setPendingKantinCount(newData.total_verifikasi || 0);

        if (newData.riwayat_transaksi) {
          setTransHistory(newData.riwayat_transaksi);
        }
      }
    } catch (error) {
      console.error('Fetch Stats Error:', error);
      const msg = error.response?.data?.message || "Gagal menghubungkan ke server untuk mengambil data statistik.";
      Alert.alert("Masalah Koneksi", msg);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(sppgId).finally(() => setRefreshing(false));
  };

  const handleTransaction = async () => {
    const amount = parseInt(transAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Masukkan jumlah poin yang valid");
      return;
    }

    try {
      if (activeTransType === 'kirim') {
        if (amount > balance) {
          Alert.alert("Gagal", "Saldo poin tidak mencukupi.");
          return;
        }
        const newTrans = {
          ref: 'Distribusi Sekolah',
          amount: amount,
          date: 'Baru saja',
          status: 'Success',
          type: 'Kirim'
        };
        setBalance(prev => prev - amount);
        setTransHistory(prev => [newTrans, ...prev]);
        setActiveTransType(null);
        setTransAmount('');
        Alert.alert("Berhasil", `Poin senilai ${amount.toLocaleString('id-ID')} telah dikirim.`);
      } else {
        const newTrans = {
          ref: 'Manual Transfer',
          amount: amount,
          date: 'Baru saja',
          status: 'Success'
        };
        setBalance(prev => prev + amount);
        setTransHistory(prev => [newTrans, ...prev]);
        setActiveTransType(null);
        setTransAmount('');
        Alert.alert("Berhasil", `Top Up Rp ${amount.toLocaleString('id-ID')} telah diproses.`);
      }
    } catch (error) {
      Alert.alert("Error", "Koneksi ke server bermasalah.");
      console.error(error);
    }
  };

  const handleLogPress = (item) => {
    if (!item || !navigation) return;
    try {
      if (item.type === 'Verifikasi' || item.status === 'Baru') {
        navigation.navigate('PersetujuanRegistrasi');
      } else if (item.type === 'Kirim') {
        navigation.navigate('Laporan');
      } else if (item.status === 'Warning' || item.type === 'Alert') {
        navigation.navigate('MonitoringMenu');
      }
    } catch (err) {
      console.warn("Navigation Error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FIXED HEADER */}
      <View style={styles.headerFixed}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={styles.batikOverlay}
        />
        <SafeAreaView>
          <View style={[styles.topNav, isLargeScreen && styles.centeredContent]}>
            <View style={styles.avatarRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.avatarContainer}>
                {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImg} /> : <View style={styles.avatarFill}><Text style={styles.avatarInitial}>{(userName || 'A').charAt(0).toUpperCase()}</Text></View>}
              </TouchableOpacity>
              <View style={styles.branding}>
                <Text style={styles.brandTag}>Selamat datang,</Text>
                <Text style={styles.brandMain}>Admin SPPG {userName}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notifCircle}
              onPress={() => navigation.navigate('NotificationList')}
            >
              <Ionicons name="notifications-outline" size={24} color={WHITE} />
              {(pendingKantinCount > 0 || (stats.notifikasi && stats.notifikasi.length > 0)) && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{pendingKantinCount + (stats.notifikasi ? stats.notifikasi.length : 0)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* SPOTLIGHT POINTS BALANCE CARD */}
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightLeft}>
              <Text style={styles.spotlightLabel}>Alokasi Poin Terdistribusi</Text>
              <Text style={styles.spotlightVal}>{Number(stats.poin_distribusi || 0).toLocaleString('id-ID')} PTS</Text>
              <Text style={styles.spotlightSub}>Setara Rp {Number((stats.poin_distribusi || 0) * 15000).toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.spotlightRight}>
              <View style={styles.badgeMbg}>
                <Text style={styles.badgeMbgText}>MBG</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* SCROLLABLE CONTENT SHEET */}
      <View style={styles.whiteSection}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: 120 },
            isLargeScreen && styles.centeredContent
          ]}
        >
          <View style={{ paddingHorizontal: 25, paddingTop: 25 }}>
            {/* QUICK ACTIONS ROW */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('AturJadwalPoin')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="calendar" size={22} color="#4F46E5" />
                </View>
                <Text style={styles.quickActionLabel}>Jadwal Poin</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('MonitoringMenu')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FFF1F2' }]}>
                  <Ionicons name="restaurant" size={22} color="#F43F5E" />
                </View>
                <Text style={styles.quickActionLabel}>Pantau Menu</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('PersetujuanRegistrasi')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#F59E0B" />
                  {pendingKantinCount > 0 && (
                    <View style={styles.quickActionBadge}>
                      <Text style={styles.quickActionBadgeText}>{pendingKantinCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickActionLabel}>Verifikasi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Laporan')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="bar-chart" size={22} color="#10B981" />
                </View>
                <Text style={styles.quickActionLabel}>Laporan</Text>
              </TouchableOpacity>
            </View>

            {/* OVERVIEW STATS */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Ringkasan Informasi</Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate('Sekolah')}>
                  <Text style={styles.statsVal}>{stats.total_sekolah}</Text>
                  <Text style={styles.statsLab}>Sekolah</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate('PersetujuanRegistrasi')}>
                  <Text style={[styles.statsVal, { color: '#F59E0B' }]}>{stats.total_verifikasi}</Text>
                  <Text style={styles.statsLab}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate('Kantin')}>
                  <Text style={[styles.statsVal, { color: '#10B981' }]}>{stats.kantin_aktif}</Text>
                  <Text style={styles.statsLab}>Kantin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* LOG AKTIVITAS */}
          <View style={[styles.logContainer, { marginTop: 25 }]}>
            <View style={styles.logHeader}>
              <Text style={styles.logTitle}>Log Aktivitas Terbaru</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Laporan')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {transHistory.map((item, index) => (
              <TouchableOpacity key={index} style={styles.logItem} onPress={() => handleLogPress(item)}>
                <View style={[styles.logIconBox, {
                  backgroundColor: item.type === 'Kirim' ? '#ECFDF5' : (item.status === 'Baru' ? '#FFF7ED' : '#FEF2F2')
                }]}>
                  <Ionicons
                    name={item.type === 'Kirim' ? 'card' : (item.status === 'Baru' ? 'shield' : 'alert-circle')}
                    size={22}
                    color={item.type === 'Kirim' ? '#10B981' : (item.status === 'Baru' ? '#F59E0B' : '#EF4444')}
                  />
                </View>
                <View style={styles.logTextContainer}>
                  <Text style={styles.logItemName}>{item.ref}</Text>
                  <Text style={styles.logItemSub}>
                    {item.type === 'Kirim' ? 'Auto-Monthly' : (item.status === 'Baru' ? 'Menunggu verifikasi' : 'Belum posting menu')} • {item.date}
                  </Text>
                </View>
                <Text style={[styles.logStatus, {
                  color: item.type === 'Kirim' ? '#10B981' : (item.status === 'Baru' ? '#F59E0B' : '#EF4444')
                }]}>
                  {item.type === 'Kirim' ? `+${Number(item.amount || 0).toLocaleString('id-ID')}` : (item.status === 'Baru' ? 'Baru' : '!')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <View style={[styles.bottomNavInner, isLargeScreen && styles.centeredContent]}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="grid" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sekolah')}>
            <Ionicons name="business-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Sekolah</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Laporan')}>
            <Ionicons name="bar-chart-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Laporan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
            <Ionicons name="person-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  centeredContent: { width: '100%', maxWidth: 1000, alignSelf: 'center' },
  headerFixed: { paddingHorizontal: 20, paddingBottom: 25, paddingTop: 10 },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 12 },
  avatarFill: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: WHITE, fontWeight: 'bold', fontSize: 18 },
  branding: { marginLeft: 12 },
  brandTag: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  brandMain: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  notifCircle: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#F43F5E', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BLUE_PRIMARY },
  notifBadgeText: { color: WHITE, fontSize: 8, fontWeight: 'bold' },

  // SPOTLIGHT CARD STYLES
  spotlightCard: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 24, padding: 20, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotlightLeft: { flex: 1 },
  spotlightLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  spotlightVal: { color: WHITE, fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  spotlightSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  badgeMbg: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeMbgText: { color: WHITE, fontSize: 11, fontWeight: 'bold' },

  whiteSection: { flex: 1, backgroundColor: '#F5F7FA', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -20 },

  // QUICK ACTIONS ROW
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 5 },
  quickActionItem: { alignItems: 'center', width: '23%' },
  quickActionIcon: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  quickActionLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginTop: 8, textAlign: 'center' },
  quickActionBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F43F5E', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: WHITE },
  quickActionBadgeText: { color: WHITE, fontSize: 8, fontWeight: 'bold' },

  // OVERVIEW STATS
  statsSection: { marginTop: 30 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: BLUE_PRIMARY, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statsCard: { width: '31%', backgroundColor: WHITE, borderRadius: 20, padding: 15, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  statsVal: { fontSize: 22, fontWeight: 'bold', color: '#4F46E5' },
  statsLab: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', marginTop: 4 },

  logContainer: { marginTop: 30, backgroundColor: WHITE, borderRadius: 28, padding: 25, marginHorizontal: 25, marginBottom: 50, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  seeAllText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 13 },
  logItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  logTextContainer: { flex: 1, marginLeft: 15 },
  logItemName: { fontSize: 15, fontWeight: 'bold', color: BLUE_PRIMARY },
  logItemSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  logStatus: { fontSize: 14, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  bottomNavInner: { flex: 1, flexDirection: 'row', paddingBottom: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 }
});