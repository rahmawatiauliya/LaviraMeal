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
  useWindowDimensions,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const ACCENT = '#38BDF8';

export default function HomeScreenKantin({ navigation }) {
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    total_pendapatan: 0,
    transaksi_hari_ini: 0,
    riwayat: [],
    notifikasi: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadUserData();
    
    // Real-time polling every 10 seconds
    const interval = setInterval(() => {
      if (userData?.id) {
        fetchKantinStats(userData.id);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userData?.id]);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id) {
        fetchKantinStats(userData.id);
      }
    }, [userData?.id])
  );

  const loadUserData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(parsed);
        fetchKantinStats(parsed.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKantinStats = async (kantinId) => {
    try {
      // Mock data simulasi yang persisten
      const currentEarning = await AsyncStorage.getItem('simulated_kantin_earning') || '450';
      const feedbackQueue = await AsyncStorage.getItem('simulated_feedbacks') || '[]';
      const feedbacks = JSON.parse(feedbackQueue);

      setStats({
        total_pendapatan: parseInt(currentEarning),
        transaksi_hari_ini: parseInt(currentEarning), // 1 PTS = 1 Transaksi
        riwayat: [
          { id: 1, message: 'Transaksi Siswa Simulasi', amount: 1, type: 'masuk', created_at: new Date().toISOString() },
        ],
        notifikasi: feedbacks.length > 0 ? feedbacks : [
          { id: 1, user: 'Ahmad Fauzi', rating: 5, comment: 'Makanannya enak sekali!', photo: true },
          { id: 2, user: 'Siti Aminah', rating: 4, comment: 'Porsinya pas, tapi sayurnya kurang garam.', photo: false },
        ]
      });
    } catch (error) {
      console.log("Stats error:", error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData().then(() => setRefreshing(false));
  };

  const formatIDR = (val) => `Rp ${(parseInt(val || 0) * 15000).toLocaleString('id-ID')}`;

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
                  <Text style={styles.avatarText}>{userData?.nama?.charAt(0) || 'K'}</Text>
                </View>
                <View>
                  <Text style={styles.welcomeText}>DASHBOARD KANTIN,</Text>
                  <Text style={styles.userName}>{userData?.nama || 'Nama Kantin'}</Text>
                  <Text style={styles.schoolName}>{userData?.nama_sekolah || 'LAVIRA MEAL'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.notificationBtn}>
                <Ionicons name="notifications" size={22} color={WHITE} />
                {stats.notifikasi.length > 0 && <View style={styles.notifBadge} />}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentBody}>
            {/* EARNINGS CARD */}
            <View style={styles.walletCard}>
              <View style={styles.walletInfo}>
                <View>
                  <Text style={styles.walletLabel}>Pendapatan Hari Ini</Text>
                  <Text style={styles.walletValue}>{Number(stats.total_pendapatan || 0).toLocaleString('id-ID')} PTS</Text>
                  <Text style={styles.pointNoteMini}>Estimasi: {formatIDR(stats.total_pendapatan)}</Text>
                </View>
                <View style={styles.transactionBadge}>
                   <Text style={styles.transactionCount}>{stats.transaksi_hari_ini}</Text>
                   <Text style={styles.transactionLabel}>Transaksi</Text>
                </View>
              </View>
            </View>

          {/* QUICK ACTIONS */}
          <View style={styles.actionGrid}>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ScannerKantin')}>
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="scan" size={22} color={SUCCESS} /></View>
                <Text style={styles.actionLabel}>Scan Siswa</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => setShowQRModal(true)}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFFBEB' }]}><Ionicons name="qr-code" size={22} color={GOLD} /></View>
                <Text style={styles.actionLabel}>QR Kantin</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MonitoringMenu')}>
                <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}><Ionicons name="fast-food" size={22} color={ACCENT} /></View>
                <Text style={styles.actionLabel}>Menu</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('LaporanKantin')}>
                <View style={[styles.actionIcon, { backgroundColor: '#FDF2F8' }]}><Ionicons name="stats-chart" size={22} color="#D946EF" /></View>
                <Text style={styles.actionLabel}>Laporan</Text>
             </TouchableOpacity>
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Lihat Semua</Text></TouchableOpacity>
          </View>

          {stats.riwayat.length > 0 ? stats.riwayat.map((item, idx) => (
             <View key={idx} style={styles.activityCard}>
                <View style={styles.activityIcon}><Ionicons name="person-circle-outline" size={20} color={BLUE_PRIMARY} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.activityName}>{item.message}</Text>
                   <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: SUCCESS }]}>
                  +{item.amount} PTS
                </Text>
             </View>
          )) : (
            <View style={styles.emptyActivity}>
               <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
            </View>
          )}

          {/* FEEDBACK SECTION */}
          <View style={[styles.activityHeader, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>Ulasan Siswa</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Lihat Semua</Text></TouchableOpacity>
          </View>

          {stats.notifikasi.length > 0 ? stats.notifikasi.map((notif, idx) => (
             <View key={idx} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                   <Text style={styles.feedbackUser}>{notif.user}</Text>
                   <View style={styles.starsRow}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name="star" size={10} color={s <= notif.rating ? GOLD : '#E2E8F0'} />
                      ))}
                   </View>
                </View>
                <Text style={styles.feedbackComment} numberOfLines={2}>{notif.comment}</Text>
                {notif.photo && (
                   <View style={styles.photoTag}>
                      <Ionicons name="image-outline" size={12} color={BLUE_PRIMARY} />
                      <Text style={styles.photoTagText}>Lampiran Foto</Text>
                   </View>
                )}
             </View>
          )) : (
            <View style={styles.emptyActivity}>
               <Text style={styles.emptyText}>Belum ada ulasan siswa</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>


      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem}>
           <Ionicons name="grid" size={24} color={BLUE_PRIMARY} />
           <Text style={[styles.navLabel, {color: BLUE_PRIMARY}]}>Beranda</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LaporanKantin')}>
           <Ionicons name="stats-chart-outline" size={24} color="#94A3B8" />
           <Text style={styles.navLabel}>Laporan</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
           <Ionicons name="person-outline" size={24} color="#94A3B8" />
           <Text style={styles.navLabel}>Profil</Text>
         </TouchableOpacity>
      </View>

      {/* QR MODAL */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCloseRow}>
              <Text style={styles.modalHeaderTitle}>QR Code Kantin</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrModalContent}>
              <Text style={styles.qrNote}>Tunjukkan QR ini jika siswa ingin melakukan scan manual ke kantin Anda.</Text>
              
              <View style={styles.qrWrapperModal}>
                <View style={styles.qrBgModal}>
                  <QRCode value={userData?.username || 'KANTIN-LAVIRA'} size={200} color={BLUE_PRIMARY} />
                </View>
              </View>

              <View style={styles.studentInfoBox}>
                <Text style={styles.infoName}>{userData?.nama}</Text>
                <Text style={styles.infoNis}>KODE: {userData?.username}</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQRModal(false)}>
                <Text style={styles.closeBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerSection: { backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25, paddingTop: 50, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: WHITE },
  welcomeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  schoolName: { fontSize: 11, color: GOLD, fontWeight: '700', marginTop: 2 },
  
  walletCard: { backgroundColor: WHITE, borderRadius: 28, padding: 22, elevation: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, marginBottom: 30 },
  walletInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  walletValue: { fontSize: 24, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 4 },
  pointNoteMini: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 5 },
  transactionBadge: { alignItems: 'center', backgroundColor: '#F1F5F9', padding: 10, borderRadius: 15 },
  transactionCount: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  transactionLabel: { fontSize: 8, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },

  contentBody: { paddingHorizontal: 25, marginTop: -30 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK },
  
  actionGrid: { flexDirection: 'row', justifyContent: 'center', marginBottom: 35, gap: 20 },
  actionItem: { alignItems: 'center', width: 80 },
  actionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewAll: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: '800' },
  activityCard: { backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2 },
  activityIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: BLUE_DARK },
  activityTime: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  activityAmount: { fontSize: 14, fontWeight: '900', color: SUCCESS },
  emptyActivity: { backgroundColor: WHITE, padding: 30, borderRadius: 25, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  notificationBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: BLUE_PRIMARY },

  feedbackCard: { backgroundColor: WHITE, borderRadius: 20, padding: 15, marginBottom: 12, elevation: 2 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  feedbackUser: { fontSize: 13, fontWeight: 'bold', color: BLUE_DARK },
  starsRow: { flexDirection: 'row', gap: 2 },
  feedbackComment: { fontSize: 11, color: '#64748B', lineHeight: 16 },
  photoTag: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  photoTagText: { fontSize: 9, fontWeight: 'bold', color: BLUE_PRIMARY },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
  scanBtnContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  // Modal Styles
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
