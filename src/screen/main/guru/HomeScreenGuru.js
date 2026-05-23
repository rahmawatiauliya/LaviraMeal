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
  useWindowDimensions,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const ACCENT = '#38BDF8';
const SOFT_BG = '#F8FAFC';

const { width } = Dimensions.get('window');

export default function HomeScreenGuru({ navigation }) {
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [canteenStats, setCanteenStats] = useState({
    saldo: 0,
    poin: 0,
    riwayat: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh stats when screen focused
  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id) {
        fetchStats(userData.id);
        fetchCanteenStats(userData.id);
      }
    }, [userData?.id])
  );

  const loadInitialData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        await fetchStats(user.id);
        await fetchCanteenStats(user.id);
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
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const fetchCanteenStats = async (userId) => {
    const idToUse = userId || userData?.id;
    if (!idToUse) return;

    try {
      const response = await apiClient.get(`guru/guru_get_riwayat.php?user_id=${idToUse}`);
      if (response.data && response.data.status === 'success') {
        const mapped = response.data.riwayat.map(x => ({
          id: x.id,
          message: x.message || x.category,
          amount: parseFloat(x.nominal),
          type: x.type,
          created_at: x.created_at,
          nama_kantin: x.nama_kantin
        }));
        setCanteenStats({
          saldo: response.data.saldo,
          poin: response.data.poin,
          riwayat: mapped
        });
      }
    } catch (error) {
      console.error("Canteen stats error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userData?.id) {
      await fetchStats(userData.id);
      await fetchCanteenStats(userData.id);
    }
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }
        }
      ]
    );
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
            style={[StyleSheet.absoluteFillObject, { opacity: 0.15, resizeMode: 'repeat' }]}
          />
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{(stats?.guru?.nama || userData?.nama || 'G').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeText}>SELAMAT DATANG GURU,</Text>
                  <Text style={styles.userName}>{stats?.guru?.nama || userData?.nama || 'Guru'}</Text>
                  <Text style={styles.schoolName}>{stats?.guru?.nama_sekolah || userData?.nama_sekolah || 'LAVIRA MEAL'}</Text>

                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert("Notifikasi", "Belum ada pesan baru.")}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  {stats?.notif_unread > 0 && <View style={styles.notifDot} />}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentBody}>
          {/* CANTEEN WALLET CARD */}
          <View style={styles.walletCard}>
            <View style={styles.walletInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>Saldo Makan Aktif Guru</Text>
                <Text style={styles.walletValue}>{Number(canteenStats.saldo || 0).toLocaleString('id-ID')} PTS</Text>
                <Text style={styles.pointNoteMini}>*1 Point = Rp 15.000</Text>
              </View>
              <TouchableOpacity style={styles.miniQrContainer} onPress={() => setShowQRModal(true)}>
                 <QRCode 
                    value={stats?.guru?.nip || userData?.username || String(userData?.id || 'LAVIRA-GURU')} 
                    size={60} 
                    color={BLUE_PRIMARY} 
                 />
                 <Text style={styles.miniQrText}>TAP QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CANTEEN QUICK ACTIONS */}
          <View style={styles.actionGrid}>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('QRScanner')}>
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="scan" size={22} color={SUCCESS} /></View>
                <Text style={styles.actionLabel}>Scan QR</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => setShowQRModal(true)}>
                <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}><Ionicons name="qr-code" size={22} color={ACCENT} /></View>
                <Text style={styles.actionLabel}>QR Saya</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RiwayatGuru')}>
                <View style={[styles.actionIcon, { backgroundColor: '#FDF2F8' }]}><Ionicons name="receipt" size={22} color="#D946EF" /></View>
                <Text style={styles.actionLabel}>Riwayat</Text>
             </TouchableOpacity>
          </View>



          {/* CANTEEN RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Transaksi Makan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RiwayatGuru')}>
              <Text style={styles.viewAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {canteenStats.riwayat.length > 0 ? canteenStats.riwayat.slice(0, 2).map((item, idx) => (
             <TouchableOpacity 
                key={idx} 
                style={styles.activityCard} 
                onPress={() => {
                  setSelectedTransaction(item);
                  setShowDetailModal(true);
                }}
             >
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={item.type === 'masuk' ? "arrow-down-circle" : "fast-food-outline"} 
                    size={20} 
                    color={item.type === 'masuk' ? SUCCESS : BLUE_PRIMARY} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.activityName}>{item.message}</Text>
                   <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: item.type === 'masuk' ? SUCCESS : '#EF4444' }]}>
                  {item.type === 'masuk' ? '+' : '-'}{item.amount} PTS
                </Text>
             </TouchableOpacity>
          )) : (
            <View style={styles.emptyActivity}>
               <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem}>
           <Ionicons name="grid" size={24} color={BLUE_PRIMARY} />
           <Text style={[styles.navLabel, {color: BLUE_PRIMARY}]}>Home</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RiwayatGuru')}>
           <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
           <Text style={styles.navLabel}>Riwayat</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilGuru')}>
           <Ionicons name="person-outline" size={24} color="#94A3B8" />
           <Text style={styles.navLabel}>Profil</Text>
         </TouchableOpacity>
      </View>

      {/* QR MODAL */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCloseRow}>
              <Text style={styles.modalHeaderTitle}>QR Code Guru</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrModalContent}>
              <Text style={styles.qrNote}>Tunjukkan QR ini ke petugas kantin untuk pengambilan makan.</Text>
              
              <View style={styles.qrWrapperModal}>
                <View style={styles.qrBgModal}>
                  <QRCode 
                    value={stats?.guru?.nip || userData?.username || String(userData?.id || 'LAVIRA-GURU')} 
                    size={200} 
                    color={BLUE_PRIMARY} 
                  />
                </View>
              </View>

              <View style={styles.studentInfoBox}>
                <Text style={styles.infoName}>{stats?.guru?.nama || userData?.nama}</Text>
                <Text style={styles.infoNis}>NIP: {stats?.guru?.nip || userData?.username}</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQRModal(false)}>
                <Text style={styles.closeBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DETAIL TRANSAKSI MODAL */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingVertical: 30 }]}>
            <View style={styles.modalCloseRow}>
              <Text style={styles.modalHeaderTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 25 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedTransaction?.type === 'masuk' ? '#F0FDF4' : '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons 
                  name={selectedTransaction?.type === 'masuk' ? "arrow-down" : "restaurant"} 
                  size={32} 
                  color={selectedTransaction?.type === 'masuk' ? SUCCESS : '#EF4444'} 
                />
              </View>
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {selectedTransaction?.type === 'masuk' ? 'Transfer Masuk' : 'Transaksi Keluar'}
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 8 }}>
                {selectedTransaction?.type === 'masuk' ? '+' : '-'}{selectedTransaction?.amount} PTS
              </Text>
              <Text style={{ fontSize: 14, color: GOLD, fontWeight: '700', marginTop: 4 }}>
                Setara Rp {Number(selectedTransaction?.amount * 15000).toLocaleString('id-ID')}
              </Text>
            </View>

            {/* Receipt Details Box */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>STATUS</Text>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, color: SUCCESS, fontWeight: '800' }}>BERHASIL</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>PENGIRIM</Text>
                <Text style={{ fontSize: 12, color: BLUE_DARK, fontWeight: '700' }}>
                  {selectedTransaction?.type === 'masuk' ? 'Admin Sekolah (LaviraMeal)' : 'Petugas Kantin'}
                </Text>
              </View>

              {selectedTransaction?.type === 'keluar' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>KANTIN</Text>
                  <Text style={{ fontSize: 12, color: BLUE_DARK, fontWeight: '700' }}>
                    {selectedTransaction?.nama_kantin || 'Kantin Sekolah'}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>KETERANGAN</Text>
                <Text style={{ fontSize: 12, color: BLUE_DARK, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 15 }} numberOfLines={2}>
                  {selectedTransaction?.message}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>WAKTU</Text>
                <Text style={{ fontSize: 12, color: BLUE_DARK, fontWeight: '700' }}>
                  {selectedTransaction?.created_at ? new Date(selectedTransaction?.created_at).toLocaleString('id-ID') : '-'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>REF ID</Text>
                <Text style={{ fontSize: 12, color: BLUE_PRIMARY, fontWeight: '800', fontFamily: 'monospace' }}>
                  #TX-GURU-{selectedTransaction?.id || '0000'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: WHITE },
  welcomeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  schoolName: { fontSize: 11, color: GOLD, fontWeight: '700', marginTop: 2 },
  classBadge: { backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  classBadgeText: { fontSize: 9, fontWeight: '900', color: BLUE_PRIMARY },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: BLUE_PRIMARY },
  
  walletCard: { backgroundColor: WHITE, borderRadius: 28, padding: 22, elevation: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, marginBottom: 30, marginTop: -30, marginHorizontal: 25 },
  walletInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  walletValue: { fontSize: 24, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 4 },
  pointNoteMini: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 5 },
  miniQrContainer: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  miniQrText: { fontSize: 8, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 4 },

  contentBody: { paddingHorizontal: 25 },
  actionGrid: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, gap: 30 },
  actionItem: { alignItems: 'center', width: 80 },
  actionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  cardSection: { backgroundColor: WHITE, borderRadius: 28, padding: 20, marginBottom: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: BLUE_DARK, marginBottom: 15 },
  summaryCard: { backgroundColor: BLUE_PRIMARY, borderRadius: 20, padding: 18, marginBottom: 20 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: WHITE, marginVertical: 2 },
  summarySub: { fontSize: 11, color: GOLD, fontWeight: '700' },
  progressCircle: { justifyContent: 'center', alignItems: 'center' },
  progressBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: (width - 90) / 3, alignItems: 'center', marginBottom: 20 },
  menuIconBox: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
  menuLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center' },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewAll: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: '800' },
  activityCard: { backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2 },
  activityIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: BLUE_DARK },
  activityTime: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  activityAmount: { fontSize: 14, fontWeight: '900', color: '#EF4444' },
  emptyActivity: { backgroundColor: WHITE, padding: 30, borderRadius: 25, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalCard: { backgroundColor: WHITE, borderRadius: 35, padding: 25, width: '100%', elevation: 20 },
  modalCloseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
  qrModalContent: { alignItems: 'center' },
  qrNote: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  qrWrapperModal: { padding: 15, backgroundColor: '#F8FAFC', borderRadius: 30, marginBottom: 20 },
  qrBgModal: { backgroundColor: WHITE, padding: 15, borderRadius: 20, elevation: 5 },
  studentInfoBox: { alignItems: 'center', marginBottom: 25 },
  infoName: { fontSize: 18, fontWeight: 'bold', color: BLUE_DARK },
  infoNis: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  closeBtn: { backgroundColor: BLUE_PRIMARY, width: '100%', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' }
});
