import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';

const { width } = Dimensions.get('window');
const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#08162E';
const WHITE = '#FFFFFF';
const GOLD = '#D4AF37';
const SUCCESS = '#10B981';
const INFO = '#3B82F6';

export default function HomeScreenGuru({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId) => {
    try {
      const response = await apiClient.get(`guru/guru_get_stats.php?user_id=${userId}`);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.data);
      } else {
        Alert.alert("Gagal", response.data?.message || "Gagal memuat data dashboard.");
      }
    } catch (error) {
      console.error("Fetch Stats Error:", error);
      Alert.alert("Error", "Gagal terhubung ke server.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(userData.id).then(() => setRefreshing(false));
  };

  const handleLogout = async () => {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Keluar", 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE_PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerSection}>
          <Image
            source={require('../../../../assets/batik_cirebon.png')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.12, resizeMode: 'repeat' }]}
          />
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{userData?.nama?.charAt(0) || 'G'}</Text>
                </View>
                <View>
                  <Text style={styles.welcomeText}>WALI KELAS,</Text>
                  <Text style={styles.userName}>{userData?.nama || 'Guru'}</Text>
                  <View style={styles.classBadge}>
                     <Text style={styles.classBadgeText}>{stats?.guru?.kelas_wali || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert("Notifikasi", "Belum ada pesan baru.")}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  {stats?.notif_unread > 0 && <View style={styles.notifDot} />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]} onPress={handleLogout}>
                  <Feather name="log-out" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* DASHBOARD SUMMARY CARD */}
            <View style={styles.summaryCard}>
               <View style={styles.summaryContent}>
                  <View>
                    <Text style={styles.summaryLabel}>Kehadiran Hari Ini</Text>
                    <Text style={styles.summaryValue}>{stats?.persentase_hadir || 0}%</Text>
                    <Text style={styles.summarySub}>{stats?.absensi_today || 0} dari {stats?.total_siswa || 0} Siswa</Text>
                  </View>
                  <View style={styles.progressCircle}>
                     {/* Simplified Progress (View based) */}
                     <View style={[styles.progressBg, { height: 60, width: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <MaterialCommunityIcons name="account-check" size={28} color={GOLD} />
                     </View>
                  </View>
               </View>
               <View style={styles.summaryFooter}>
                  <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.footerText}>Data berdasarkan jadwal distribusi sesi {stats?.jadwal_hari_ini?.sesi || '-'}</Text>
               </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentBody}>
           {/* QUICK ACTIONS GRID */}
           <Text style={styles.sectionTitle}>Menu Utama</Text>
           <View style={styles.menuGrid}>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DaftarSiswaWali')}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="people" size={24} color="#3B82F6" />
                 </View>
                 <Text style={styles.menuLabel}>Daftar Siswa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AbsensiKonsumsi')}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialCommunityIcons name="clipboard-check" size={24} color="#22C55E" />
                 </View>
                 <Text style={styles.menuLabel}>Absensi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Segera Hadir", "Fitur Jadwal sedang disiapkan.")}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
                    <Ionicons name="calendar" size={24} color="#F59E0B" />
                 </View>
                 <Text style={styles.menuLabel}>Jadwal MBG</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('RekapKelas')}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="stats-chart" size={24} color="#EC4899" />
                 </View>
                 <Text style={styles.menuLabel}>Rekap Kelas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Segera Hadir", "Fitur Menu sedang disiapkan.")}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="restaurant" size={24} color="#8B5CF6" />
                 </View>
                 <Text style={styles.menuLabel}>Info Nutrisi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Segera Hadir", "Fitur Profil sedang disiapkan.")}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="person" size={24} color="#64748B" />
                 </View>
                 <Text style={styles.menuLabel}>Profil Guru</Text>
              </TouchableOpacity>
           </View>

           {/* TODAY'S INFO CARD */}
           <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                 <Text style={styles.infoTitle}>Jadwal Hari Ini</Text>
                 <View style={styles.sessionBadge}>
                    <Text style={styles.sessionText}>{stats?.jadwal_hari_ini?.sesi?.toUpperCase() || 'TIDAK ADA'}</Text>
                 </View>
              </View>
              
              {stats?.jadwal_hari_ini ? (
                <View style={styles.infoContent}>
                   <View style={styles.infoRow}>
                      <Ionicons name="business" size={18} color={BLUE_PRIMARY} />
                      <Text style={styles.infoText}>{stats?.jadwal_hari_ini?.nama_kantin}</Text>
                   </View>
                   <View style={styles.infoRow}>
                      <Ionicons name="fast-food" size={18} color={BLUE_PRIMARY} />
                      <Text style={styles.infoText}>Menu: Paket Nasi & Ayam Bakar</Text>
                   </View>
                   <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AbsensiKonsumsi')}>
                      <Text style={styles.actionButtonText}>Konfirmasi Kehadiran</Text>
                      <Ionicons name="chevron-forward" size={16} color={WHITE} />
                   </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyInfo}>
                   <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
                   <Text style={styles.emptyText}>Tidak ada jadwal distribusi hari ini</Text>
                </View>
              )}
           </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { 
    backgroundColor: BLUE_PRIMARY, 
    paddingHorizontal: 25, 
    paddingTop: 20, 
    paddingBottom: 40, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40, 
    overflow: 'hidden' 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: WHITE },
  welcomeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1.5 },
  userName: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  classBadge: { 
    backgroundColor: GOLD, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    alignSelf: 'flex-start', 
    marginTop: 4 
  },
  classBadgeText: { fontSize: 10, fontWeight: '900', color: BLUE_PRIMARY },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: BLUE_PRIMARY
  },

  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: WHITE, marginVertical: 4 },
  summarySub: { fontSize: 11, color: GOLD, fontWeight: '700' },
  summaryFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)' 
  },
  footerText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 6, fontWeight: '600' },

  contentBody: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK, marginBottom: 20 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { 
    width: (width - 70) / 3, 
    alignItems: 'center', 
    marginBottom: 25 
  },
  menuIconBox: { 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  menuLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center' },

  infoCard: { 
    backgroundColor: WHITE, 
    borderRadius: 28, 
    padding: 20, 
    marginTop: 10, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 15 
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
  sessionBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sessionText: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#475569', marginLeft: 12, fontWeight: '600' },
  actionButton: { 
    backgroundColor: BLUE_PRIMARY, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 15, 
    marginTop: 10,
    gap: 8
  },
  actionButtonText: { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  emptyInfo: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});
