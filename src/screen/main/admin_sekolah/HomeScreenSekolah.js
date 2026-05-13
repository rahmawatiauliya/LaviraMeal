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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';


const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const BLUE_ACCENT = '#3B82F6';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const DANGER = '#F43F5E';
const ACCENT = '#38BDF8';
const WARNING = '#F59E0B';

export default function HomeScreenSekolah({ navigation }) {
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState({
    total_siswa: 0,
    saldo: 38000,
    pengambilan_hari_ini: 0,
    status_distribusi: 'Menunggu',
    menus: [],
    dana_kaget: null
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Modals & States
  const [showDanaKagetModal, setShowDanaKagetModal] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [classList, setClassList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  
  // Dana Kaget Flow
  const [danaAmount, setDanaAmount] = useState('');
  const [danaQuota, setDanaQuota] = useState('');
  const [isCreatingDana, setIsCreatingDana] = useState(false);
  const [newDanaLink, setNewDanaLink] = useState(null);

  const fetchStats = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (!storedUser) {
        setLoading(false);
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      
      const response = await apiClient.get(`sekolah/sekolah_get_stats.php?sekolah_id=${parsedUser.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
      const interval = setInterval(() => {
        fetchStats();
      }, 3000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  };

  const handleCreateDanaKaget = async () => {
    if (!userData) return;
    if (!danaAmount || !danaQuota) {
      Alert.alert("Error", "Mohon lengkapi nominal dan kuota");
      return;
    }
    
    setIsCreatingDana(true);
    try {
      const resp = await apiClient.post('sekolah/sekolah_create_dana_kaget.php', {
        sekolah_id: userData.sekolah_id,
        amount: parseInt(danaAmount),
        quota: parseInt(danaQuota)
      });
      
      if (resp.data.status === 'success') {
        setNewDanaLink(resp.data.data.share_link);
        fetchStats();
      }
    } catch (error) {
      Alert.alert("Gagal", "Gagal membuat Dana Kaget.");
    } finally {
      setIsCreatingDana(false);
    }
  };

  const fetchClasses = async () => {
    if (!userData) return;
    try {
      const response = await apiClient.get(`sekolah/sekolah_get_kelas.php?sekolah_id=${userData.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setClassList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleTransferDanaKelas = async () => {
    if (!userData || !selectedKelas || !transferAmount) {
      Alert.alert("Error", "Mohon pilih kelas dan isi nominal transfer");
      return;
    }

    setIsTransferring(true);
    try {
      const response = await apiClient.post('sekolah/sekolah_transfer_dana_kelas.php', {
        sekolah_id: userData.sekolah_id,
        kelas: selectedKelas,
        amount: parseInt(transferAmount)
      });

      if (response.data.status === 'success') {
        Alert.alert("Berhasil", response.data.message);
        setShowTransferModal(false);
        setTransferAmount('');
        setSelectedKelas('');
        fetchStats();
      }
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal melakukan transfer dana kelas.");
    } finally {
      setIsTransferring(false);
    }
  };

  const formatPTS = (val) => `${parseInt(val || 0).toLocaleString('id-ID')} PTS`;
  const isLargeScreen = width > 768;
  const currentPoints = Math.floor(stats.saldo || 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* FIXED HEADER */}
      <View style={styles.headerFixed}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={styles.batikOverlay}
        />
        <SafeAreaView>
          <View style={[styles.headerTop, isLargeScreen && styles.centeredContent]}>
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.avatarContainer}>
                {userData?.foto ? (
                  <Image source={{ uri: userData.foto }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFill}><Text style={styles.avatarText}>{userData?.nama?.charAt(0) || 'A'}</Text></View>
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.welcomeText}>ADMINISTRATOR SEKOLAH</Text>
                <Text style={styles.roleText}>{userData?.nama_sekolah || 'LAVIRA MEAL'}</Text>
                <Text style={styles.schoolSubText}>{userData?.nama || 'Admin'}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* FLOATING SHEET */}
      <View style={styles.whiteSection}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
          contentContainerStyle={[
            { paddingBottom: 150 },
            isLargeScreen && styles.centeredContent
          ]}
        >
          {/* POINT CARD */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.walletHeaderRow}>
                  <Text style={styles.walletLabel}>POINT OPERASIONAL</Text>
                  <View style={styles.realtimeBadgeMini}>
                    <View style={styles.pingSmall} />
                    <Text style={styles.realtimeTextMini}>Real-time</Text>
                  </View>
                </View>
                <Text style={styles.walletValue}>{currentPoints} PTS</Text>
                <Text style={styles.pointNote}>*1 Point = Rp 15.000</Text>
              </View>
            </View>
          </View>

          {/* DANA KAGET ACTIVE BANNER */}
          {stats.dana_kaget && (
            <TouchableOpacity style={styles.danaKagetBanner} onPress={() => navigation.navigate('DanaKagetList')}>
              <View style={styles.row}>
                <Ionicons name="gift" size={20} color="#92400E" />
                <Text style={styles.danaKagetText}>Dana Kaget Aktif: {formatPTS(stats.dana_kaget.amount)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#92400E" />
            </TouchableOpacity>
          )}

          {/* METRICS GRID */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.metricIconBox, { backgroundColor: '#DCFCE7' }]}><Ionicons name="people" size={20} color={SUCCESS} /></View>
              <Text style={styles.metricVal}>{stats.total_siswa}</Text>
              <Text style={styles.metricLab}>Total Siswa</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.metricIconBox, { backgroundColor: '#DBEAFE' }]}><Ionicons name="storefront" size={20} color={ACCENT} /></View>
              <Text style={styles.metricVal}>{stats.total_kantin || 0}</Text>
              <Text style={styles.metricLab}>Kantin Aktif</Text>
            </View>
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: '#FAF5FF' }]}
              onPress={() => navigation.navigate('VerifikasiKantin')}
            >
              <View style={[styles.metricIconBox, { backgroundColor: '#F3E8FF' }]}><Ionicons name="shield-checkmark" size={20} color="#8B5CF6" /></View>
              <View style={styles.rowBetween}>
                <Text style={styles.metricVal}>{stats.pending_kantin || 0}</Text>
                {stats.pending_kantin > 0 && <View style={styles.badgeDot} />}
              </View>
              <Text style={styles.metricLab}>Verifikasi Kantin</Text>
            </TouchableOpacity>
          </View>


          {/* MENU KANTIN SECTION */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Menu Kantin Hari Ini</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MonitoringMenu')}>
                <Text style={styles.seeAllText}>Pantau Menu</Text>
              </TouchableOpacity>
            </View>
            
            {stats.menus && stats.menus.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuScroll}>
                {stats.menus.map((menu, idx) => (
                  <TouchableOpacity key={idx} style={styles.menuCard} onPress={() => navigation.navigate('DetailMenu', { menu_id: menu.id })}>
                    <Image source={{ uri: menu.foto }} style={styles.menuImg} />
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuName} numberOfLines={1}>{menu.nama_menu}</Text>
                      <Text style={styles.kantinName} numberOfLines={1}>{menu.nama_kantin}</Text>
                      <View style={styles.menuPriceRow}>
                        <Text style={styles.menuPrice}>{formatPTS(menu.harga)}</Text>
                        <View style={[styles.statusMiniBadge, { backgroundColor: menu.stok > 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                          <Text style={[styles.statusMiniText, { color: menu.stok > 0 ? SUCCESS : DANGER }]}>
                            {menu.stok > 0 ? 'Ready' : 'Habis'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyMenu}>
                <Ionicons name="restaurant-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>Belum ada menu yang diposting hari ini</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <View style={[styles.bottomNavInner, isLargeScreen && styles.centeredContent]}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Beranda</Text>
            <View style={styles.activeIndicator} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ManajemenKelas')}>
            <Ionicons name="layers-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Kelas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LaporanSekolah')}>
            <Ionicons name="bar-chart-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Laporan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
            <Ionicons name="person-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DANA KAGET MODAL */}
      <Modal visible={showDanaKagetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalCentered}>
            <View style={styles.modalCard}>
              <View style={styles.modalCloseRow}>
                <Text style={styles.modalHeaderTitle}>Buat Dana Kaget</Text>
                <TouchableOpacity onPress={() => { setShowDanaKagetModal(false); setNewDanaLink(null); }}>
                  <Feather name="x" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {!newDanaLink ? (
                <>
                  <Text style={styles.fieldLabel}>Total Nominal (Saldo: {currentPoints} PTS)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput 
                      style={styles.tInput} 
                      placeholder="Jumlah Poin" 
                      keyboardType="numeric" 
                      value={danaAmount}
                      onChangeText={setDanaAmount}
                    />
                    <Text style={styles.suffix}>PTS</Text>
                  </View>
                  <Text style={styles.fieldLabel}>Kuota (Jumlah Siswa)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput 
                      style={styles.tInput} 
                      placeholder="Contoh: 100" 
                      keyboardType="numeric" 
                      value={danaQuota}
                      onChangeText={setDanaQuota}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { backgroundColor: GOLD }]} 
                    onPress={handleCreateDanaKaget}
                    disabled={isCreatingDana}
                  >
                    {isCreatingDana ? <ActivityIndicator color={WHITE} /> : (
                      <Text style={styles.primaryBtnText}>Sebarkan Sekarang</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.successIconWrap}>
                    <Ionicons name="checkmark-circle" size={60} color={SUCCESS} />
                  </View>
                  <Text style={[styles.sheetTitle, { marginTop: 15, color: BLUE_PRIMARY }]}>Dana Kaget Dibuat!</Text>
                  <Text style={styles.modalDesc}>Bagikan link di bawah ini ke siswa Anda agar mereka bisa klaim Point ini.</Text>
                  <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>{newDanaLink}</Text>
                  </View>
                  <TouchableOpacity style={styles.shareBtn} onPress={() => Share.share({ message: `Ayo klaim Dana Kaget dari sekolah! Klik link ini: ${newDanaLink}` })}>
                    <Ionicons name="share-social" size={20} color={WHITE} />
                    <Text style={styles.shareBtnText}>Bagikan Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal visible={showTransferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalCentered}>
            <View style={styles.modalCard}>
              <View style={styles.modalCloseRow}>
                <Text style={styles.modalHeaderTitle}>Transfer Dana Kelas</Text>
                <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                  <Feather name="x" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Pilih Kelas Tujuan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                {classList.map((item, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.classSelector, 
                      selectedKelas === item.kelas && { backgroundColor: BLUE_PRIMARY, borderColor: BLUE_PRIMARY }
                    ]}
                    onPress={() => setSelectedKelas(item.kelas)}
                  >
                    <Text style={[styles.classSelectorText, selectedKelas === item.kelas && { color: WHITE }]}>
                      {item.kelas}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Nominal Transfer (Saldo: {currentPoints} PTS)</Text>
              <View style={styles.inputWrap}>
                <TextInput 
                  style={styles.tInput} 
                  placeholder="Contoh: 100" 
                  keyboardType="numeric" 
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                />
                <Text style={styles.suffix}>PTS</Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleTransferDanaKelas}
                disabled={isTransferring}
              >
                {isTransferring ? <ActivityIndicator color={WHITE} /> : (
                  <Text style={styles.primaryBtnText}>Transfer Sekarang</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* QUICK ACTION SHEET */}
      <Modal visible={quickActionModal} transparent animationType="fade">
         <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setQuickActionModal(false)}>
            <View style={styles.actionSheet}>
               <Text style={styles.sheetTitle}>Portal Administratif</Text>
               <View style={styles.sheetGrid}>
                  {[
                    { label: 'Transfer', icon: 'send-outline', color: '#4f46e5', press: () => { setQuickActionModal(false); fetchClasses(); setShowTransferModal(true); } },
                    { label: 'Dana Kaget', icon: 'gift-outline', color: GOLD, press: () => { setQuickActionModal(false); setShowDanaKagetModal(true); } },
                    { label: 'Guru', icon: 'school-outline', color: '#6366f1', press: () => { navigation.navigate('ManajemenGuru'); setQuickActionModal(false); } },
                    { label: 'Kelas', icon: 'layers-outline', color: '#0ea5e9', press: () => { navigation.navigate('ManajemenKelas'); setQuickActionModal(false); } },
                    { label: 'Report', icon: 'stats-chart-outline', color: '#f59e0b', press: () => { navigation.navigate('LaporanSekolah'); setQuickActionModal(false); } },
                    { label: 'Pantau Menu', icon: 'restaurant-outline', color: '#ec4899', press: () => { navigation.navigate('MonitoringMenu'); setQuickActionModal(false); } },
                    { label: 'Atur Poin', icon: 'star-outline', color: '#8b5cf6', press: () => { navigation.navigate('ManajemenPoin'); setQuickActionModal(false); } },
                    { label: 'Pengaturan', icon: 'settings-outline', color: '#64748b', press: () => { navigation.navigate('Settings'); setQuickActionModal(false); } },
                  ].map((item, i) => (
                    <TouchableOpacity key={i} style={styles.sheetItem} onPress={item.press}>
                       <View style={[styles.sheetIconBox, { backgroundColor: item.color + '15' }]}><Ionicons name={item.icon} size={24} color={item.color} /></View>
                       <Text style={styles.sheetLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
         </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  centeredContent: { width: '100%', maxWidth: 1000, alignSelf: 'center' },
  
  headerFixed: { paddingHorizontal: 25, paddingBottom: 50, paddingTop: 10 },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 14 },
  avatarFill: { width: '100%', height: '100%', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: WHITE },
  welcomeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1 },
  roleText: { fontSize: 16, fontWeight: 'bold', color: WHITE, marginTop: 2 },
  schoolSubText: { fontSize: 12, color: GOLD, fontWeight: '600', marginTop: 1 },


  whiteSection: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -20 },
  
  walletCard: { backgroundColor: WHITE, borderRadius: 28, padding: 25, marginHorizontal: 20, marginTop: 25, elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
  walletHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  realtimeBadgeMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pingSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS, marginRight: 5 },
  realtimeTextMini: { fontSize: 9, color: SUCCESS, fontWeight: '800' },
  walletValue: { fontSize: 28, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 5 },
  pointNote: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 8 },

  danaKagetBanner: { backgroundColor: '#FFFBEB', flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: '#FEF3C7', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  danaKagetText: { fontSize: 13, fontWeight: '700', color: '#92400E', marginLeft: 10 },

  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 20, marginTop: 25 },
  metricCard: { flex: 1, borderRadius: 24, padding: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, minHeight: 110 },
  metricIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricVal: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY },
  metricLab: { fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DANGER },

  sectionContainer: { marginTop: 30, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: BLUE_DARK },
  seeAllText: { color: BLUE_ACCENT, fontWeight: '800', fontSize: 13 },


  menuScroll: { marginTop: 5 },
  menuCard: { width: 180, backgroundColor: WHITE, borderRadius: 22, marginRight: 15, padding: 12, elevation: 4, shadowOpacity: 0.05 },
  menuImg: { width: '100%', height: 110, borderRadius: 16, marginBottom: 12 },
  menuInfo: { paddingHorizontal: 2 },
  menuName: { fontSize: 14, fontWeight: '800', color: BLUE_DARK },
  kantinName: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  menuPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  menuPrice: { fontSize: 13, fontWeight: '900', color: SUCCESS },
  statusMiniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusMiniText: { fontSize: 9, fontWeight: '900' },
  emptyMenu: { width: '100%', height: 140, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 10, fontWeight: '600' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  bottomNavInner: { flex: 1, flexDirection: 'row', paddingBottom: 15, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  navLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
  activeIndicator: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE_PRIMARY, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalCentered: { width: '100%', maxWidth: 500 },
  modalCard: { backgroundColor: WHITE, borderRadius: 32, padding: 25, width: '100%' },
  modalCloseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderTitle: { fontSize: 19, fontWeight: '900', color: BLUE_PRIMARY },
  modalDesc: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10, marginTop: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 18, height: 56, borderWidth: 1, borderColor: '#E2E8F0' },
  prefix: { fontSize: 16, fontWeight: '900', color: BLUE_PRIMARY, marginRight: 8 },
  suffix: { fontSize: 14, fontWeight: '800', color: '#64748B', marginLeft: 8 },
  tInput: { flex: 1, fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
  primaryBtn: { backgroundColor: BLUE_PRIMARY, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  primaryBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  
  successIconWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  linkContainer: { backgroundColor: '#F1F5F9', padding: 18, borderRadius: 16, marginTop: 20, width: '100%' },
  linkText: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: '700', textAlign: 'center' },
  shareBtn: { backgroundColor: ACCENT, width: '100%', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  shareBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold', marginLeft: 12 },
  classSelector: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 12, backgroundColor: '#F8FAFC' },
  classSelectorText: { fontSize: 14, fontWeight: '800', color: '#64748B' },

  overlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  sheetTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', textAlign: 'center', marginBottom: 25, textTransform: 'uppercase', letterSpacing: 1.5 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sheetItem: { width: '22%', alignItems: 'center', marginBottom: 15 },
  sheetIconBox: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  sheetLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748B', textAlign: 'center' }
});
