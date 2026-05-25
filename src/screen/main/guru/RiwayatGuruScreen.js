import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';

export default function RiwayatGuruScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [userData, setUserData] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(parsed);
        await fetchRiwayat(parsed.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiwayat = async (userId) => {
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
          nama_kantin: x.nama_kantin,
          kantin_id: x.kantin_id,
          already_reviewed: parseInt(x.already_reviewed || 0)
        }));
        setRiwayat(mapped);
      }
    } catch (error) {
      console.log("Riwayat guru error:", error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userData?.id) {
      await fetchRiwayat(userData.id);
    }
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const isMasuk = item.type === 'masuk';
    const isMeal = item.message === 'Pengambilan Makan Bergizi' || item.type === 'keluar';

    return (
      <View style={[styles.historyItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
        {/* Clickable details zone (only opens detail modal) */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          onPress={() => {
            setSelectedTransaction(item);
            setShowDetailModal(true);
          }}
        >
          <View style={[
            styles.historyIcon,
            { backgroundColor: isMasuk ? '#F0FDF4' : (isMeal ? '#EFF6FF' : '#FEF2F2') }
          ]}>
            <Ionicons
              name={isMasuk ? "arrow-down-circle" : "restaurant"}
              size={22}
              color={isMasuk ? SUCCESS : BLUE_PRIMARY}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.itemHeader}>
              <Text style={styles.historyMessage}>{item.message}</Text>
              <Text style={styles.historyTime}>{item.created_at ? new Date(item.created_at.replace(' ', 'T')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
            </View>
            <Text style={[
              styles.historyDetail,
              { color: isMasuk ? SUCCESS : '#EF4444' }
            ]}>
              {isMasuk ? 'Masuk: +' : 'Keluar: -'}{item.amount} PTS
            </Text>
            <Text style={styles.historyDate}>{item.created_at ? new Date(item.created_at.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</Text>
          </View>
        </TouchableOpacity>

        {/* Separator and Review Action Bar (separate non-nested click zone!) */}
        {item.kantin_id && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, paddingLeft: 63 }}>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER SECTION */}
      <View style={styles.headerArea}>
        <View style={styles.headerBg}>
          <Image
            source={require('../../../../assets/batik_cirebon.png')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.12, resizeMode: 'repeat' }]}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAction}>
                <Feather name="arrow-left" size={24} color={WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitleTxt}>Riwayat Transaksi Guru</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE_PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={riwayat}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
            </View>
          }
        />
      )}

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeGuru')}>
          <Ionicons name="grid-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt" size={24} color={BLUE_PRIMARY} />
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilGuru')}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={{ fontSize: 14, color: '#D4AF37', fontWeight: '700', marginTop: 4 }}>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerArea: { height: 120, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', elevation: 15, marginBottom: 15 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25 },
  backBtnAction: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleTxt: { fontSize: 20, fontWeight: '900', color: WHITE },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMessage: { fontSize: 15, fontWeight: '700', color: BLUE_DARK, flex: 1 },
  historyTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  historyDetail: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  historyDate: { fontSize: 11, color: '#94A3B8', marginTop: 8, fontWeight: '500' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalCard: { backgroundColor: WHITE, borderRadius: 35, padding: 25, width: '100%', elevation: 20 },
  modalCloseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
  closeBtn: { backgroundColor: BLUE_PRIMARY, width: '100%', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' }
});
