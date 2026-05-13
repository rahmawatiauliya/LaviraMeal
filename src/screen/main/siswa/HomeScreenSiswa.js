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

export default function HomeScreenSiswa({ navigation }) {
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    saldo: 0,
    poin: 0,
    absensi_hari_ini: 'Belum',
    riwayat: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(parsed);
        fetchSiswaStats(parsed.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiswaStats = async (userId) => {
    try {
      // Endpoint ini mungkin perlu dibuat di backend
      const response = await apiClient.get(`siswa/siswa_get_stats.php?user_id=${userId}`);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (error) {
      console.log("Stats error:", error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData().then(() => setRefreshing(false));
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

  const formatIDR = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;

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
                  <Text style={styles.avatarText}>{userData?.nama?.charAt(0) || 'S'}</Text>
                </View>
                <View>
                  <Text style={styles.welcomeText}>SELAMAT DATANG,</Text>
                  <Text style={styles.userName}>{userData?.nama || 'Siswa'}</Text>
                  <Text style={styles.schoolName}>{userData?.nama_sekolah || 'LAVIRA MEAL'}</Text>
                </View>
              </View>

            </View>

          </SafeAreaView>
        </View>

        <View style={styles.contentBody}>
            {/* WALLET CARD */}
            <View style={styles.walletCard}>
              <View style={styles.walletInfo}>
                <View>
                  <Text style={styles.walletLabel}>Saldo Makan Aktif</Text>
                  <Text style={styles.walletValue}>{Number(stats.saldo || 0).toLocaleString('id-ID')} PTS</Text>
                  <Text style={styles.pointNoteMini}>*1 Point = Rp 15.000</Text>
                </View>

              </View>
            </View>

          {/* QUICK ACTIONS */}
          <View style={styles.actionGrid}>
             <TouchableOpacity style={styles.actionItem} onPress={() => setShowQRModal(true)}>
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="qr-code" size={22} color={SUCCESS} /></View>
                <Text style={styles.actionLabel}>QR Saya</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RiwayatSiswa')}>
                <View style={[styles.actionIcon, { backgroundColor: '#FDF2F8' }]}><Ionicons name="receipt" size={22} color="#D946EF" /></View>
                <Text style={styles.actionLabel}>Riwayat</Text>
             </TouchableOpacity>
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Lihat Semua</Text></TouchableOpacity>
          </View>

          {stats.riwayat.length > 0 ? stats.riwayat.map((item, idx) => (
             <View key={idx} style={styles.activityCard}>
                <View style={styles.activityIcon}><Ionicons name="fast-food-outline" size={20} color={BLUE_PRIMARY} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.activityName}>{item.message}</Text>
                   <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: item.type === 'masuk' ? SUCCESS : '#EF4444' }]}>
                  {item.type === 'masuk' ? '+' : '-'}{item.amount} PTS
                </Text>
             </View>
          )) : (
            <View style={styles.emptyActivity}>
               <Text style={styles.emptyText}>Belum ada pengambilan makanan</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>


      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSiswa')}>
           <Ionicons name="grid" size={24} color={BLUE_PRIMARY} />
           <Text style={[styles.navLabel, {color: BLUE_PRIMARY}]}>Home</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RiwayatSiswa')}>
           <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
           <Text style={styles.navLabel}>Riwayat</Text>
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
              <Text style={styles.modalHeaderTitle}>QR Code Siswa</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrModalContent}>
              <Text style={styles.qrNote}>Tunjukkan QR ini ke petugas kantin atau sekolah untuk verifikasi.</Text>
              
              <View style={styles.qrWrapperModal}>
                <View style={styles.qrBgModal}>
                  {stats.qr_code_token ? (
                    <QRCode value={stats.qr_code_token} size={200} color={BLUE_PRIMARY} />
                  ) : (
                    <ActivityIndicator size="large" color={BLUE_PRIMARY} />
                  )}
                </View>
              </View>

              <View style={styles.studentInfoBox}>
                <Text style={styles.infoName}>{userData?.nama}</Text>
                <Text style={styles.infoNis}>NIS: {userData?.username}</Text>
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
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  walletCard: { backgroundColor: WHITE, borderRadius: 28, padding: 22, elevation: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, marginBottom: 30 },
  walletInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  walletValue: { fontSize: 24, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 4 },
  pointNoteMini: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 5 },
  pointContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pointText: { fontSize: 11, fontWeight: '800', color: '#B45309', marginLeft: 5 },
  walletDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },

  contentBody: { paddingHorizontal: 25, marginTop: -30 },
  qrSection: { alignItems: 'center', marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK },
  sectionSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  qrWrapper: { alignItems: 'center', marginTop: 20 },
  qrBg: { backgroundColor: WHITE, padding: 20, borderRadius: 25, elevation: 10, shadowOpacity: 0.1 },
  scanTarget: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#F1F5F9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  scanText: { fontSize: 13, fontWeight: '800', color: BLUE_PRIMARY, marginLeft: 10 },

  actionGrid: { flexDirection: 'row', justifyContent: 'center', marginBottom: 35, gap: 30 },
  actionItem: { alignItems: 'center', width: 80 },
  actionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },

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
  floatingScanBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },
  navMainInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: WHITE, elevation: 15 },

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
