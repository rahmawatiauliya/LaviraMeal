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
  const [transHistory, setTransHistory] = useState([
    { ref: 'SMAN 1 Klari', type: 'Kirim', amount: 38000, date: '04 May, 22:07', status: 'Success' },
    { ref: 'Kantin Barokah - SDN 01', type: 'Verifikasi', amount: 0, date: '05 May, 09.14', status: 'Baru' },
    { ref: 'SDN 05 Karawang', type: 'Alert', amount: 0, date: 'Baru saja', status: 'Warning' },
  ]);

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
        setStats(prev => ({ ...prev, ...newData }));
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
              onPress={() => navigation.navigate('PersetujuanRegistrasi')}
            >
              <Ionicons name="notifications-outline" size={24} color={WHITE} />
              {pendingKantinCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{pendingKantinCount}</Text>
                </View>
              )}
            </TouchableOpacity>
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
          {/* HERO CONTENT */}
          <View style={styles.heroContent}>
            <Text style={styles.heroSmallTitle}>MONITORING DISTRIBUSI POINT</Text>
            <Text style={[styles.heroMainTitle, isLargeScreen && { fontSize: 36 }]}>Otoritas Wilayah</Text>
            <Text style={styles.heroSubTitle}>Kontrol Distribusi & Verifikasi Terpadu</Text>

            <View style={[styles.actionContainer, isLargeScreen && { flexDirection: 'row', flexWrap: 'wrap' }]}>
              <View style={[styles.actionRow, isLargeScreen && { flex: 2 }]}>
                <TouchableOpacity style={styles.btnJadwal} onPress={() => navigation.navigate('AturJadwalPoin')}>
                  <Ionicons name="calendar" size={18} color={BLUE_PRIMARY} />
                  <Text style={styles.btnJadwalText}>Jadwal Poin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPantau} onPress={() => navigation.navigate('MonitoringMenu')}>
                  <Ionicons name="restaurant" size={18} color={WHITE} />
                  <Text style={styles.btnPantauText}>Pantau Menu</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.btnVerifikasi, isLargeScreen && { flex: 1, marginTop: 0 }]} onPress={() => navigation.navigate('PersetujuanRegistrasi')}>
                <Ionicons name="shield-checkmark" size={18} color={WHITE} />
                <Text style={styles.btnVerifikasiText}>Verifikasi Kantin</Text>
                {pendingKantinCount > 0 && (
                  <View style={styles.btnBadge}>
                    <Text style={styles.btnBadgeText}>{pendingKantinCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* METRICS GRID - RESPONSIVE COLUMNS */}
          <View style={[styles.metricsGrid, isLargeScreen && { justifyContent: 'flex-start', gap: 20 }]}>
            {[
              { label: 'Sekolah', val: stats.total_sekolah, icon: 'grid', color: '#4F46E5', bg: '#EEF2FF', route: 'Sekolah' },
              { label: 'Verifikasi', val: stats.total_verifikasi, icon: 'shield-checkmark', color: '#F59E0B', bg: '#FFF7ED', route: 'PersetujuanRegistrasi' },
              { label: 'Kantin', val: stats.kantin_aktif, icon: 'restaurant', color: '#10B981', bg: '#F0FDF4', route: 'Kantin' },
              { label: 'Point', val: Number(stats.point_bulan_ini || 0).toLocaleString('id-ID'), icon: 'star', color: '#8B5CF6', bg: '#FAF5FF', route: 'AturJadwalPoin' }
            ].map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.metricCard, isLargeScreen && { width: '23.5%' }]} 
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={[styles.metricIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.metricVal, { color: item.color }]}>{item.val}</Text>
                <Text style={styles.metricLab}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LOG AKTIVITAS */}
          <View style={styles.logContainer}>
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
                  {item.type === 'Kirim' ? `+${(Number(item.amount || 0)/1000).toFixed(0)}K` : (item.status === 'Baru' ? 'Baru' : '!')}
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
  headerFixed: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 },
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

  whiteSection: { flex: 1, backgroundColor: '#F5F7FA', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -20 },
  heroContent: { padding: 25 },
  heroSmallTitle: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  heroMainTitle: { color: BLUE_PRIMARY, fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  heroSubTitle: { color: '#64748B', fontSize: 14, marginTop: 5 },

  actionContainer: { marginTop: 25, gap: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  btnJadwal: { flex: 1, height: 50, backgroundColor: WHITE, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  btnJadwalText: { color: BLUE_PRIMARY, fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
  btnPantau: { flex: 1, height: 50, backgroundColor: '#EC4899', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#EC4899', shadowOpacity: 0.2, shadowRadius: 10 },
  btnPantauText: { color: WHITE, fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
  btnVerifikasi: { width: '100%', height: 55, backgroundColor: BLUE_PRIMARY, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 15 },
  btnVerifikasiText: { color: WHITE, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  btnBadge: { position: 'absolute', top: -5, right: 20, backgroundColor: '#F43F5E', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BLUE_PRIMARY },
  btnBadgeText: { color: WHITE, fontSize: 10, fontWeight: 'bold' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingHorizontal: 25, marginTop: 10 },
  metricCard: { width: '48%', backgroundColor: WHITE, borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  metricIconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  metricVal: { fontSize: 24, fontWeight: 'bold', color: BLUE_PRIMARY },
  metricLab: { fontSize: 13, color: '#64748B', fontWeight: 'bold', marginTop: 4 },

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