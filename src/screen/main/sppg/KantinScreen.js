import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  Animated,
  Modal,
  ImageBackground
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function KantinScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [viewLevel, setViewLevel] = useState('schools'); // 'schools' or 'canteens'
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schools, setSchools] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickActionModal, setQuickActionModal] = useState(false);


  // Dashboard detail states
  const [canteenDetailModal, setCanteenDetailModal] = useState(false);
  const [canteenDetailLoading, setCanteenDetailLoading] = useState(false);
  const [selectedCanteenData, setSelectedCanteenData] = useState(null);

  // Animation for transition
  const fadeAnim = useState(new Animated.Value(1))[0];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      const sppg_id = userData.sppg_id;

      // 1. Get Schools in Klari
      const resSchools = await apiClient.get(`sppg/sppg_get_sekolah.php?sppg_id=${sppg_id}`);
      if (resSchools.data && resSchools.data.status === 'success') {
        setSchools(resSchools.data.data || []);
      } else {
        setSchools([]);
      }

      // 2. Get Canteens
      const resCanteens = await apiClient.get(`sppg/sppg_get_kantin.php?sppg_id=${sppg_id}`);
      if (resCanteens.data && resCanteens.data.status === 'success') {
        setCanteens(resCanteens.data.data || []);
      } else {
        setCanteens([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transitionTo = (level, school = null) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setViewLevel(level);
      setSelectedSchool(school);
      setSearchQuery('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleCanteenClick = async (canteen) => {
    setSelectedCanteenData({ ...canteen, dashboard: null });
    setCanteenDetailModal(true);
    setCanteenDetailLoading(true);
    try {
      const res = await apiClient.get(`sppg/get_dashboard_kantin_detail.php?kantin_id=${canteen.kantin_id}`);
      if (res.data && res.data.status === 'success') {
        setSelectedCanteenData(prev => ({
          ...prev,
          dashboard: res.data.data
        }));
      }
    } catch (err) {
      console.error("Error fetching canteen details dashboard:", err);
    } finally {
      setCanteenDetailLoading(false);
    }
  };

  const canteensAtSchool = useMemo(() => {
    if (!selectedSchool) return [];
    return canteens.filter(c => c.sekolah === selectedSchool.nama_sekolah);
  }, [selectedSchool, canteens]);

  const renderSchoolLabel = ({ item }) => {
    const schoolCanteens = canteens.filter(c => c.sekolah === item.nama_sekolah);
    const total = schoolCanteens.length;
    const pending = schoolCanteens.filter(c => c.status === 'Menunggu Verifikasi').length;
    return (
      <TouchableOpacity style={styles.schoolLabel} onPress={() => transitionTo('canteens', item)}>
        <View style={[styles.schoolBullet, { backgroundColor: pending > 0 ? '#ef4444' : (total > 0 ? '#10b981' : '#94a3b8') }]} />
        <Text style={styles.schoolLabelTxt}>{item.nama_sekolah}</Text>
        <View style={styles.labelCount}>
          <Text style={[styles.labelCountTxt, { color: pending > 0 ? '#ef4444' : '#64748b' }]}>{total} Kantin</Text>
          <Feather name="chevron-right" size={14} color="#cbd5e1" style={{ marginLeft: 5 }} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCanteenItem = ({ item }) => (
    <TouchableOpacity
      style={styles.canteenCard}
      onPress={() => handleCanteenClick(item)}
    >
      <Image source={{ uri: item.foto_kantin || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400' }} style={styles.canteenImg} />
      <View style={styles.canteenInfo}>
        <Text style={styles.canteenName}>{item.nama_kantin}</Text>
        <Text style={styles.canteenOwner}>Kelolaan: {item.pengelola}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.miniBadge, { backgroundColor: item.verified_by_school ? '#dcfce7' : '#f1f5f9' }]}>
            <Ionicons name={item.verified_by_school ? "checkmark-circle" : "time-outline"} size={12} color={item.verified_by_school ? "#10b981" : "#94a3b8"} />
            <Text style={[styles.miniBadgeTxt, { color: item.verified_by_school ? "#166534" : "#94a3b8" }]}>Ad. Sekolah</Text>
          </View>
          <View style={[styles.miniBadge, { backgroundColor: item.verified_by_sppg ? '#dcfce7' : '#f1f5f9' }]}>
            <Ionicons name={item.verified_by_sppg ? "checkmark-circle" : "time-outline"} size={12} color={item.verified_by_sppg ? "#10b981" : "#94a3b8"} />
            <Text style={[styles.miniBadgeTxt, { color: item.verified_by_sppg ? "#166534" : "#94a3b8" }]}>Ad. SPPG</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <ImageBackground source={require('../../../../assets/batik_cirebon.png')} style={styles.headerBg} imageStyle={styles.batikImage}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => viewLevel === 'canteens' ? transitionTo('schools') : navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={WHITE} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.headerTitle}>{viewLevel === 'schools' ? 'Manajemen Kantin' : 'Seleksi Kantin MBG'}</Text>
                <Text style={styles.headerDesc}>{viewLevel === 'schools' ? 'Verifikasi & Audit Kelayakan Mitra' : selectedSchool?.nama_sekolah}</Text>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={BLUE_PRIMARY} /></View>
        ) : (
          viewLevel === 'schools' ? (
            <View style={styles.schoolSection}>
              <Text style={styles.sectionHeading}>PILIH INSTITUSI SEKOLAH</Text>
              <FlatList
                data={schools}
                keyExtractor={item => item.id.toString()}
                renderItem={renderSchoolLabel}
                contentContainerStyle={{ paddingBottom: 150 }}
              />
            </View>
          ) : (
            <View style={{ padding: 25 }}>
              <Text style={styles.sectionHeading}>DAFTAR KANTIN TERVERIFIKASI</Text>
              <FlatList
                data={canteensAtSchool}
                keyExtractor={item => item.id.toString()}
                renderItem={renderCanteenItem}
                contentContainerStyle={{ paddingBottom: 150 }}
                ListEmptyComponent={<View style={styles.empty}><Feather name="coffee" size={60} color="#cbd5e1" /><Text style={styles.emptyTxt}>Belum ada pengajuan untuk sekolah ini.</Text></View>}
              />
            </View>
          )
        )}
      </Animated.View>      {/* QUICK ACTION MODAL */}
      <Modal visible={quickActionModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setQuickActionModal(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.sheetTitle}>Fitur Transaksi</Text>
            <View style={styles.sheetGrid}>
              {[
                { label: 'Kirim Dana', icon: 'send', color: '#4f46e5', press: () => setQuickActionModal(false) },
                { label: 'Scan QR', icon: 'maximize', color: '#0ea5e9', press: () => setQuickActionModal(false) },
                { label: 'Isi Saldo', icon: 'plus-circle', color: '#10b981', press: () => setQuickActionModal(false) },
                { label: 'Laporan', icon: 'pie-chart', color: '#f59e0b', press: () => { navigation.navigate('Laporan'); setQuickActionModal(false); } },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.sheetItem} onPress={item.press}>
                  <View style={[styles.sheetIconBox, { backgroundColor: item.color + '15' }]}><Feather name={item.icon} size={24} color={item.color} /></View>
                  <Text style={styles.sheetLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.cancelSheet} onPress={() => setQuickActionModal(false)}><Text style={styles.cancelSheetTxt}>Batalkan</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CANTEEN DETAIL DASHBOARD MODAL */}
      <Modal visible={canteenDetailModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setCanteenDetailModal(false)} />
          <View style={styles.dashboardSheet}>
            <View style={styles.dragHandle} />

            {/* Header info */}
            <View style={styles.sheetHeader}>
              <Image source={{ uri: selectedCanteenData?.foto_kantin || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400' }} style={styles.sheetCanteenImg} />
              <View style={styles.sheetHeaderInfo}>
                <Text style={styles.sheetCanteenName}>{selectedCanteenData?.nama_kantin}</Text>
                <Text style={styles.sheetCanteenSub}>{selectedCanteenData?.sekolah} • Kelolaan: {selectedCanteenData?.pengelola}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.miniBadge, { backgroundColor: selectedCanteenData?.verified_by_school ? '#dcfce7' : '#f1f5f9' }]}>
                    <Ionicons name={selectedCanteenData?.verified_by_school ? "checkmark-circle" : "time-outline"} size={11} color={selectedCanteenData?.verified_by_school ? "#10b981" : "#94a3b8"} />
                    <Text style={[styles.miniBadgeTxt, { color: selectedCanteenData?.verified_by_school ? "#166534" : "#94a3b8" }]}>Ad. Sekolah</Text>
                  </View>
                  <View style={[styles.miniBadge, { backgroundColor: selectedCanteenData?.verified_by_sppg ? '#dcfce7' : '#f1f5f9' }]}>
                    <Ionicons name={selectedCanteenData?.verified_by_sppg ? "checkmark-circle" : "time-outline"} size={11} color={selectedCanteenData?.verified_by_sppg ? "#10b981" : "#94a3b8"} />
                    <Text style={[styles.miniBadgeTxt, { color: selectedCanteenData?.verified_by_sppg ? "#166534" : "#94a3b8" }]}>Ad. SPPG</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {canteenDetailLoading ? (
                <View style={{ paddingVertical: 50, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={BLUE_PRIMARY} />
                  <Text style={{ marginTop: 15, fontSize: 13, color: '#94a3b8', fontWeight: 'bold' }}>Sedang mengambil analisis kantin...</Text>
                </View>
              ) : (
                <View>
                  {/* Total Poin Terkumpul */}
                  <View style={styles.statsCardBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="wallet" size={18} color="#3b82f6" />
                      <Text style={styles.statsCardTitle}>Total Poin Terkumpul (Belum Dicairkan)</Text>
                    </View>
                    <Text style={styles.statsCardVal}>
                      {Number(selectedCanteenData?.dashboard?.total_poin?.berdasarkan_saldo_aktif || 0).toLocaleString('id-ID')} PTS
                    </Text>
                    <Text style={styles.statsCardSub}>
                      Setara Rp {Number((selectedCanteenData?.dashboard?.total_poin?.berdasarkan_saldo_aktif || 0) * 15000).toLocaleString('id-ID')}
                    </Text>

                    <View style={styles.statsDivider} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.statsCardFooter, { color: 'rgba(255,255,255,0.6)' }]}>Akumulasi Semua Poin Masuk</Text>
                      <Text style={[styles.statsCardFooter, { color: WHITE, fontWeight: 'bold' }]}>
                        {Number(selectedCanteenData?.dashboard?.total_poin?.berdasarkan_log_transaksi || 0).toLocaleString('id-ID')} PTS
                      </Text>
                    </View>
                  </View>

                  {/* Jam Transaksi Paling Padat */}
                  <View style={styles.peakCardBox}>
                    <Ionicons name="flash-sharp" size={24} color="#f59e0b" />
                    <View style={styles.peakInfo}>
                      <Text style={styles.peakTitle}>Jam Transaksi Paling Padat Hari Ini</Text>
                      {selectedCanteenData?.dashboard?.kepadatan_jam_transaksi?.peak_hour ? (
                        <Text style={styles.peakDesc}>
                          Pukul <Text style={{ fontWeight: 'bold' }}>{selectedCanteenData.dashboard.kepadatan_jam_transaksi.peak_hour.jam_format}</Text> terjadi lonjakan tertinggi ({selectedCanteenData.dashboard.kepadatan_jam_transaksi.peak_hour.total_transaksi} transaksi)
                        </Text>
                      ) : (
                        <Text style={styles.peakDesc}>Belum ada transaksi terjadi hari ini</Text>
                      )}
                    </View>
                  </View>

                  {/* Daftar Siswa Hari Ini */}
                  <Text style={styles.txListHeader}>Daftar Transaksi Siswa Hari Ini</Text>
                  {selectedCanteenData?.dashboard?.transaksi_siswa_hari_ini?.length > 0 ? (
                    selectedCanteenData.dashboard.transaksi_siswa_hari_ini.map((tx, idx) => (
                      <View key={idx} style={styles.txItem}>
                        <View style={styles.txIcon}>
                          <Ionicons name="person" size={16} color="#475569" />
                        </View>
                        <View style={styles.txTextContainer}>
                          <Text style={styles.txName}>{tx.nama_siswa}</Text>
                          <Text style={styles.txClass}>{tx.kelas}</Text>
                        </View>
                        <View style={styles.txPointsBox}>
                          <Text style={styles.txPoints}>+{Number(tx.jumlah_poin || 0).toLocaleString('id-ID')} PTS</Text>
                          <Text style={styles.txTime}>{tx.waktu_transaksi}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyStateBox}>
                      <Feather name="info" size={32} color="#cbd5e1" />
                      <Text style={styles.emptyStateTxt}>Belum ada transaksi dari siswa khusus hari ini.</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.sheetFooterBtns}>
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setCanteenDetailModal(false)}>
                <Text style={styles.sheetCloseBtnTxt}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Feather name="grid" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Beranda</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sekolah')}><Feather name="book" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Sekolah</Text></TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Laporan')}><Feather name="pie-chart" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Laporan</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}><Feather name="user" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Profil</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 130, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', elevation: 20 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25 },
  batikImage: { opacity: 0.3, resizeMode: 'cover', tintColor: 'rgba(255,255,255,0.3)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  headerDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, fontWeight: 'bold', lineHeight: 20 },
  hSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  schoolSection: { flex: 1, padding: 25 },
  sectionHeading: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 20 },
  schoolLabel: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 20, borderRadius: 20, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  schoolBullet: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  schoolLabelTxt: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  labelCount: { flexDirection: 'row', alignItems: 'center' },
  labelCountTxt: { fontSize: 12, fontWeight: 'bold' },
  canteenCard: { backgroundColor: WHITE, borderRadius: 28, padding: 15, marginBottom: 16, flexDirection: 'row', elevation: 3 },
  canteenImg: { width: 84, height: 84, borderRadius: 20 },
  canteenInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  canteenName: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  canteenOwner: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  statusRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniBadgeTxt: { fontSize: 9, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTxt: { marginTop: 15, fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  resetBtnTxt: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  overlay: { flex: 1, backgroundColor: 'rgba(11,30,63,0.8)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 35 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY, textAlign: 'center', marginBottom: 30 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20 },
  sheetItem: { width: '45%', alignItems: 'center' },
  sheetIconBox: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  sheetLabel: { fontSize: 14, fontWeight: '800', color: '#475569' },
  cancelSheet: { marginTop: 35, backgroundColor: '#f1f5f9', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  cancelSheetTxt: { fontSize: 15, fontWeight: 'bold', color: '#64748b' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  navItemMain: { marginTop: -50 },
  navMainInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: SOFT_BG, elevation: 15 },

  // Dashboard Sheet & Cards
  dashboardSheet: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, maxHeight: '90%' },
  dragHandle: { width: 50, height: 5, borderRadius: 2.5, backgroundColor: '#cbd5e1', alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sheetHeaderInfo: { flex: 1, marginLeft: 15 },
  sheetCanteenImg: { width: 70, height: 70, borderRadius: 18 },
  sheetCanteenName: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  sheetCanteenSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statsCardBox: { backgroundColor: BLUE_PRIMARY, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 5 },
  statsCardTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  statsCardVal: { color: WHITE, fontSize: 28, fontWeight: '900', marginTop: 4 },
  statsCardSub: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  statsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  statsCardFooter: { fontSize: 11, fontWeight: '600' },
  peakCardBox: { backgroundColor: '#eff6ff', borderRadius: 20, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  peakInfo: { flex: 1, marginLeft: 12 },
  peakTitle: { fontSize: 14, fontWeight: '900', color: '#1e3a8a' },
  peakDesc: { fontSize: 12, color: '#2563eb', marginTop: 2 },
  txListHeader: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, marginBottom: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  txTextContainer: { flex: 1, marginLeft: 12 },
  txName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  txClass: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txPointsBox: { alignItems: 'flex-end' },
  txPoints: { fontSize: 14, fontWeight: '900', color: '#10b981' },
  txTime: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  emptyStateBox: { alignItems: 'center', padding: 25, borderRadius: 20, backgroundColor: '#f8fafc' },
  emptyStateTxt: { fontSize: 13, color: '#94a3b8', marginTop: 10 },
  sheetFooterBtns: { marginTop: 25, gap: 12 },
  sheetVerifyBtn: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  sheetVerifyBtnTxt: { color: WHITE, fontSize: 15, fontWeight: 'bold' },
  sheetCloseBtn: { backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheetCloseBtnTxt: { color: '#475569', fontSize: 15, fontWeight: 'bold' }
});
