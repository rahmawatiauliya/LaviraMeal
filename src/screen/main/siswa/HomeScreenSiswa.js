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
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';
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
    riwayat: [],
    qr_code_token: ''
  });
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchCanteens = async (userId) => {
    const idToUse = userId || userData?.id;
    if (!idToUse) return;
    try {
      const response = await apiClient.get(`shared/get_active_canteens.php?user_id=${idToUse}`);
      if (response.data && response.data.status === 'success') {
        setCanteens(response.data.canteens || []);
      }
    } catch (error) {
      console.error("Canteen fetch error:", error);
    }
  };

  useEffect(() => {
    loadUserData();

    // Real-time polling every 10 seconds
    const interval = setInterval(() => {
      if (userData?.id) {
        fetchSiswaStats(userData.id);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userData?.id]);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id) {
        fetchSiswaStats(userData.id);
        fetchCanteens(userData.id);
      }
    }, [userData?.id])
  );

  const loadUserData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(parsed);
        fetchSiswaStats(parsed.id);
        fetchCanteens(parsed.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Periksa apakah saldo simulasi sudah ada
      const simulatedSaldo = await AsyncStorage.getItem('simulated_saldo');
      if (!simulatedSaldo) {
        await AsyncStorage.setItem('simulated_saldo', '100'); // Berikan 100 PTS awal
      }
      setLoading(false);
    }
  };

  const fetchSiswaStats = async (userId) => {
    try {
      const response = await apiClient.get(`siswa/siswa_get_stats.php?user_id=${userId}`);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.data || { saldo: 0, poin: 0, absensi_hari_ini: 'Belum', riwayat: [] });
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      // Fallback ke data simulasi
      const currentSaldo = await AsyncStorage.getItem('simulated_saldo') || '100';
      setStats({
        saldo: parseInt(currentSaldo),
        poin: parseInt(currentSaldo) * 15000,
        absensi_hari_ini: 'Hadir',
        riwayat: [
          { id: 1, message: 'Saldo Awal Simulasi', amount: 100, type: 'masuk', created_at: new Date().toISOString() },
        ],
        qr_code_token: userData?.username || 'STUDENT-TOKEN'
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData().then(() => {
      if (userData?.id) {
        fetchCanteens(userData.id);
      }
      setRefreshing(false);
    });
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
                  <Text style={styles.welcomeText}>{userData?.role === 'guru' ? 'SELAMAT DATANG GURU,' : 'SELAMAT DATANG SISWA,'}</Text>
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
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>Saldo Makan Aktif</Text>
                <Text style={styles.walletValue}>{Number(stats.saldo || 0).toLocaleString('id-ID')} PTS</Text>
                <Text style={styles.pointNoteMini}>*1 Point = Rp 15.000</Text>
              </View>
              <TouchableOpacity style={styles.miniQrContainer} onPress={() => setShowQRModal(true)}>
                <QRCode
                  value={stats?.qr_code_token || userData?.username || String(userData?.id || userData?.nama || 'LAVIRA-SISWA')}
                  size={60}
                  color={BLUE_PRIMARY}
                />
                <Text style={styles.miniQrText}>TAP QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('QRScanner')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="scan" size={22} color={SUCCESS} /></View>
              <Text style={styles.actionLabel}>Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => setShowQRModal(true)}>
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}><Ionicons name="qr-code" size={22} color={ACCENT} /></View>
              <Text style={styles.actionLabel}>QR Saya</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RiwayatSiswa')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FDF2F8' }]}><Ionicons name="receipt" size={22} color="#D946EF" /></View>
              <Text style={styles.actionLabel}>Riwayat</Text>
            </TouchableOpacity>
          </View>

          {/* MITRA KANTIN SECTION */}
          <View style={{ marginBottom: 25, marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Mitra Kantin MBG</Text>
            <Text style={styles.sectionSubtitle}>Ketuk kantin untuk melihat ulasan dan rating</Text>
            
            {canteens.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 15, paddingTop: 15, paddingBottom: 5 }}
              >
                {canteens.map((canteen) => (
                  <TouchableOpacity 
                    key={canteen.id} 
                    style={styles.canteenCardItem}
                    onPress={() => navigation.navigate('CanteenFeedback', {
                      kantin_id: canteen.id,
                      nama_kantin: canteen.nama_kantin,
                      foto_kantin: canteen.foto_kantin
                    })}
                  >
                    <Image 
                      source={{ uri: canteen.foto_kantin ? `${IMAGE_BASE_URL}${canteen.foto_kantin}` : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300' }} 
                      style={styles.canteenItemImg} 
                    />
                    <View style={styles.canteenItemInfo}>
                      <Text style={styles.canteenItemName} numberOfLines={1}>{canteen.nama_kantin}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="person" size={10} color="#94A3B8" />
                        <Text style={styles.canteenItemOwner} numberOfLines={1}>{canteen.pemilik || 'Pemilik'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="call" size={10} color="#94A3B8" />
                        <Text style={styles.canteenItemOwner} numberOfLines={1}>{canteen.no_telp || '-'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCanteens}>
                <Ionicons name="storefront-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyCanteensText}>Tidak ada mitra kantin aktif</Text>
              </View>
            )}
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RiwayatSiswa')}>
              <Text style={styles.viewAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {stats.riwayat.length > 0 ? stats.riwayat.slice(0, 2).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.activityCard, { flexDirection: 'column', alignItems: 'stretch' }]}
              onPress={() => {
                setSelectedTransaction(item);
                setShowDetailModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={item.type === 'masuk' ? "arrow-down-circle" : "fast-food-outline"}
                    size={20}
                    color={item.type === 'masuk' ? SUCCESS : BLUE_PRIMARY}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityName}>{item.message}</Text>
                  <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at.replace(' ', 'T')).toLocaleString('id-ID') : '-'}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: item.type === 'masuk' ? SUCCESS : '#EF4444' }]}>
                  {item.type === 'masuk' ? '+' : '-'}{item.amount} PTS
                </Text>
              </View>

              {item.kantin_id && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="storefront-outline" size={14} color="#64748B" />
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{item.nama_kantin || 'Kantin'}</Text>
                  </View>
                  {item.already_reviewed === 1 ? (
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold' }}>Sudah Diulas</Text>
                    </View>
                  ) : (
                    (() => {
                      const txDate = item.created_at ? new Date(item.created_at.replace(' ', 'T')) : new Date();
                      const diffTime = Math.abs(new Date() - txDate);
                      const diffDays = diffTime / (1000 * 60 * 60 * 24);
                      if (diffDays <= 2) {
                        return (
                          <TouchableOpacity 
                            style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => navigation.navigate('Feedback', {
                              canteenData: {
                                id: item.kantin_id,
                                name: item.nama_kantin || 'Kantin',
                                transaksi_id: item.id
                              }
                            })}
                          >
                            <Ionicons name="star" size={12} color="#FFFFFF" />
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }}>Beri Ulasan</Text>
                          </TouchableOpacity>
                        );
                      } else {
                        return (
                          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>Batas Ulasan Habis</Text>
                          </View>
                        );
                      }
                    })()
                  )}
                </View>
              )}
            </TouchableOpacity>
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
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RiwayatSiswa')}>
          <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilSiswa')}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>

      {/* QR MODAL */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCloseRow}>
              <Text style={styles.modalHeaderTitle}>{userData?.role === 'guru' ? 'QR Code Guru' : 'QR Code Siswa'}</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrModalContent}>
              <Text style={styles.qrNote}>Tunjukkan QR ini ke petugas kantin atau sekolah untuk verifikasi.</Text>

              <View style={styles.qrWrapperModal}>
                <View style={styles.qrBgModal}>
                  <QRCode
                    value={stats?.qr_code_token || userData?.username || String(userData?.id || userData?.nama || 'LAVIRA-SISWA')}
                    size={200}
                    color={BLUE_PRIMARY}
                  />
                </View>
              </View>

              <View style={styles.studentInfoBox}>
                <Text style={styles.infoName}>{userData?.nama}</Text>
                <Text style={styles.infoNis}>{userData?.role === 'guru' ? 'NIP' : 'NIS'}: {userData?.username}</Text>
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

              {selectedTransaction?.type === 'keluar' && selectedTransaction?.kantin_id && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>STATUS ULASAN</Text>
                  {selectedTransaction?.already_reviewed === 1 ? (
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold' }}>Sudah Diulas</Text>
                    </View>
                  ) : (
                    (() => {
                      const txDate = selectedTransaction?.created_at ? new Date(selectedTransaction.created_at.replace(' ', 'T')) : new Date();
                      const diffTime = Math.abs(new Date() - txDate);
                      const diffDays = diffTime / (1000 * 60 * 60 * 24);
                      if (diffDays <= 2) {
                        return (
                          <TouchableOpacity 
                            style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => {
                              setShowDetailModal(false);
                              navigation.navigate('Feedback', {
                                canteenData: {
                                  id: selectedTransaction.kantin_id,
                                  name: selectedTransaction.nama_kantin || 'Kantin',
                                  transaksi_id: selectedTransaction.id
                                }
                              });
                            }}
                          >
                            <Ionicons name="star" size={12} color="#FFFFFF" />
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }}>Beri Ulasan</Text>
                          </TouchableOpacity>
                        );
                      } else {
                        return (
                          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>Batas Ulasan Habis</Text>
                          </View>
                        );
                      }
                    })()
                  )}
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
                  {selectedTransaction?.created_at ? new Date(selectedTransaction?.created_at.replace(' ', 'T')).toLocaleString('id-ID') : '-'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 'bold' }}>REF ID</Text>
                <Text style={{ fontSize: 12, color: BLUE_PRIMARY, fontWeight: '800', fontFamily: 'monospace' }}>
                  #TX-SISWA-{selectedTransaction?.id || '0000'}
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
  miniQrContainer: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  miniQrText: { fontSize: 8, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 4 },

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
  closeBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  canteenCardItem: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: 160,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  canteenItemImg: {
    width: '100%',
    height: 100,
    backgroundColor: '#E2E8F0',
  },
  canteenItemInfo: {
    padding: 12,
  },
  canteenItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: BLUE_DARK,
  },
  canteenItemOwner: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyCanteens: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyCanteensText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 6,
  }
});
