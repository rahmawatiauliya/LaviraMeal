import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
  StatusBar, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#38BDF8';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const BORDER_LIGHT = '#E2E8F0';
const ACCENT_GREEN = '#10B981';
const ACCENT_RED = '#F43F5E';
const ACCENT_YELLOW = '#F59E0B';

export default function LaporanSekolahScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null);

  const [dataTransaksi, setDataTransaksi] = useState([]);
  const [stats, setStats] = useState({
    total_dana_masuk: '0',
    total_dana_keluar: '0',
    total_penerima: '0',
    rekap_bulan: 'Bulan ini'
  });

  const fetchLaporan = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);

      const response = await apiClient.get(`sekolah/sekolah_get_laporan_lengkap.php?sekolah_id=${userData.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        const d = response.data.data;
        setDataTransaksi(d.transaksi_dana || []);

        if (d.bulanan && d.bulanan.length > 0) {
          const latest = d.bulanan[0];
          setStats({
            total_dana_masuk: parseInt(latest.total_dana_masuk || 0).toLocaleString('id-ID'),
            total_dana_keluar: parseInt(latest.total_dana_keluar || 0).toLocaleString('id-ID'),
            total_penerima: (latest.total_penerima || 0).toString(),
            rekap_bulan: latest.bulan || 'Bulan ini'
          });
        }
      }
    } catch (error) {
      console.error("Error fetching laporan:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchLaporan(true);
      const interval = setInterval(() => {
        fetchLaporan(false); // Silent update
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchLaporan])
  );

  const handleDownload = async () => {
    try {
      setLoading(true);
      const filtered = dataTransaksi.filter(t => {
        const tDate = t.tanggal ? new Date(t.tanggal) : null;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const matchDate = !tDate || (tDate >= start && tDate <= end);
        
        // Status mapping to match visual badges and DB values
        let matchStatus = false;
        if (filterStatus === 'Semua') {
          matchStatus = true;
        } else {
          const s = t.status ? String(t.status).toLowerCase() : '';
          if (filterStatus === 'Selesai') {
            matchStatus = (s === 'completed' || s === 'berhasil' || s === 'selesai' || s === 'success');
          } else if (filterStatus === 'Proses') {
            matchStatus = (s === 'proses' || s === 'pending');
          } else if (filterStatus === 'Batal') {
            matchStatus = (s === 'batal' || s === 'gagal');
          }
        }
        
        const matchSearch = (t.pengirim && String(t.pengirim).toLowerCase().includes(search.toLowerCase())) ||
          (t.metode && String(t.metode).toLowerCase().includes(search.toLowerCase()));
        return matchDate && matchStatus && matchSearch;
      });

      const tableContent = `
        <tr>
          <th>ID</th><th>Pengirim</th><th>Tanggal</th><th>Nominal (PTS)</th><th>Metode</th><th>Status</th>
        </tr>
        ${filtered.map(item => `
          <tr>
            <td>${item.id}</td>
            <td>${item.pengirim || 'SPPG Klari'}</td>
            <td>${item.tanggal_format}</td>
            <td>${item.arah === 'keluar' ? '-' : '+'}${parseInt(item.nominal || 0).toLocaleString('id-ID')} PTS</td>
            <td>${item.metode}</td>
            <td>${item.status}</td>
          </tr>
        `).join('')}
      `;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; }
              h1 { color: #0B1E3F; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
              th { background-color: #0B1E3F; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Laporan Riwayat Poin Sekolah</h1>
            <p style="text-align: center;">Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}</p>
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            <table>${tableContent}</table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Gagal mengunduh laporan.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : '';
    let bgColor = '#F1F5F9';
    let textColor = TEXT_MUTED;
    let label = status || 'Unknown';

    if (s === 'completed' || s === 'berhasil' || s === 'selesai' || s === 'success') { bgColor = '#ECFDF5'; textColor = ACCENT_GREEN; label = 'Selesai'; }
    else if (s === 'proses' || s === 'pending') { bgColor = '#FFFBEB'; textColor = ACCENT_YELLOW; label = 'Proses'; }
    else if (s === 'batal' || s === 'gagal') { bgColor = '#FEF2F2'; textColor = ACCENT_RED; label = 'Batal'; }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const filteredData = dataTransaksi.filter(t => {
    const tDate = t.tanggal ? new Date(t.tanggal) : null;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const matchDate = !tDate || (tDate >= start && tDate <= end);
    
    // Status mapping to match visual badges and DB values
    let matchStatus = false;
    if (filterStatus === 'Semua') {
      matchStatus = true;
    } else {
      const s = t.status ? String(t.status).toLowerCase() : '';
      if (filterStatus === 'Selesai') {
        matchStatus = (s === 'completed' || s === 'berhasil' || s === 'selesai' || s === 'success');
      } else if (filterStatus === 'Proses') {
        matchStatus = (s === 'proses' || s === 'pending');
      } else if (filterStatus === 'Batal') {
        matchStatus = (s === 'batal' || s === 'gagal');
      }
    }
    
    const matchSearch = (t.pengirim && String(t.pengirim).toLowerCase().includes(search.toLowerCase())) ||
      (t.metode && String(t.metode).toLowerCase().includes(search.toLowerCase()));
    return matchDate && matchStatus && matchSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <Image source={require('../../../../assets/batik_cirebon.png')} style={styles.batikOverlay} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSubtitle}>ADMINISTRASI</Text>
              <Text style={styles.headerTitle}>Laporan Riwayat</Text>
            </View>
            <TouchableOpacity style={styles.headerExportBtn} onPress={handleDownload}>
              <Feather name="file-text" size={20} color={WHITE} />
              <Text style={styles.headerExportText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 20 }} />

        <View style={styles.actionSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari transaksi..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.dateControl} onPress={() => setShowPicker('start')}>
              <Text style={styles.dateControlLabel}>Mulai</Text>
              <Text style={styles.dateControlValue}>{startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
            </TouchableOpacity>
            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
            </View>
            <TouchableOpacity style={styles.dateControl} onPress={() => setShowPicker('end')}>
              <Text style={styles.dateControlLabel}>Sampai</Text>
              <Text style={styles.dateControlValue}>{endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
            {['Semua', 'Selesai', 'Proses', 'Batal'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.statusChip, filterStatus === st && styles.statusChipActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text style={[styles.statusChipText, filterStatus === st && styles.statusChipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

          <View style={styles.historyList}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Aktivitas Transaksi</Text>
              <Text style={styles.listSub}>{filteredData.length} Item ditemukan</Text>
            </View>
            
            {loading ? (
              <ActivityIndicator color={BLUE_PRIMARY} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item, idx) => idx.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const isSuccess = item.status?.toLowerCase() === 'berhasil' || item.status?.toLowerCase() === 'completed';
                  return (
                    <TouchableOpacity
                      style={styles.historyItem}
                      onPress={() => {
                        setSelectedTransaction(item);
                        setDetailModalVisible(true);
                      }}
                    >
                      <View style={[styles.itemIconBox, { backgroundColor: !isSuccess ? '#FEF3C7' : item.arah === 'keluar' ? '#FEE2E2' : '#DCFCE7' }]}>
                        <MaterialCommunityIcons 
                          name={!isSuccess ? "clock-outline" : item.arah === 'keluar' ? "arrow-top-right" : "arrow-bottom-left"} 
                          size={22} 
                          color={!isSuccess ? ACCENT_YELLOW : item.arah === 'keluar' ? ACCENT_RED : ACCENT_GREEN} 
                        />
                      </View>
                      <View style={styles.itemMain}>
                        <Text style={styles.itemTitle}>{item.pengirim || 'SPPG Payment'}</Text>
                        <Text style={styles.itemMeta}>{item.tanggal_format} • {item.metode}</Text>
                      </View>
                      <View style={styles.itemRight}>
                        <Text style={[styles.itemAmount, { color: item.arah === 'keluar' ? ACCENT_RED : ACCENT_GREEN }]}>
                          {item.arah === 'keluar' ? '-' : '+'}{parseInt(item.nominal || 0).toLocaleString('id-ID')} PTS
                        </Text>
                        {renderStatusBadge(item.status)}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>}
              />
            )}
        </View>
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(null);
            if (selectedDate) {
              if (showPicker === 'start') setStartDate(selectedDate);
              else setEndDate(selectedDate);
            }
          }}
        />
      )}


      <Modal visible={detailModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Rincian Transaksi</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Feather name="x" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.receiptMain}>
                  <View style={styles.receiptTop}>
                    <Text style={styles.bannerLabel}>{selectedTransaction.arah === 'keluar' ? 'Bukti Distribusi Keluar' : 'Bukti Transfer Masuk'}</Text>
                    <Text style={[styles.bannerValue, { color: selectedTransaction.arah === 'keluar' ? ACCENT_RED : ACCENT_GREEN }]}>
                      {selectedTransaction.arah === 'keluar' ? '-' : '+'}{parseInt(selectedTransaction.nominal || 0).toLocaleString('id-ID')} PTS
                    </Text>
                    <View style={[styles.statusTag, { backgroundColor: selectedTransaction.status?.toLowerCase() === 'berhasil' ? '#DCFCE7' : '#F1F5F9' }]}>
                      <Text style={[styles.statusTagText, { color: selectedTransaction.status?.toLowerCase() === 'berhasil' ? ACCENT_GREEN : TEXT_MUTED }]}>
                        {selectedTransaction.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dashedDivider} />
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pengirim</Text>
                      <Text style={[styles.infoValue, { color: BLUE_ACCENT }]}>{selectedTransaction.pengirim || 'SPPG Klari'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>ID Transaksi</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={styles.infoValue}>{selectedTransaction.id}</Text>
                        <TouchableOpacity onPress={() => Alert.alert("Salin", "ID Transaksi disalin")}>
                          <Feather name="copy" size={12} color={BLUE_ACCENT} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Waktu</Text>
                      <Text style={styles.infoValue}>{selectedTransaction.tanggal_format}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Metode</Text>
                      <Text style={styles.infoValue}>{selectedTransaction.metode}</Text>
                    </View>
                  </View>
                  <View style={styles.dashedDivider} />
                  <View style={styles.verificationSection}>
                    <View style={styles.qrPlaceholder}>
                      <MaterialCommunityIcons name="qrcode-scan" size={60} color={BLUE_PRIMARY} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.verifTitle}>Terverifikasi Digital</Text>
                      <Text style={styles.verifDesc}>Dokumen ini sah secara elektronik melalui jaringan SPPG Payment Gateway.</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeFullBtn} onPress={() => setDetailModalVisible(false)}>
                  <Text style={styles.closeFullBtnText}>Selesai</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSekolah')}>
            <Ionicons name="grid-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ManajemenKelas')}>
            <Ionicons name="layers-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Kelas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="bar-chart" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Laporan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilSekolah')}>
            <Ionicons name="person-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 160, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: BLUE_PRIMARY },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.12, resizeMode: 'repeat' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, flex: 1, paddingBottom: 15 },
  headerSubtitle: { fontSize: 10, fontWeight: '900', color: BLUE_ACCENT, letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: WHITE, marginTop: 2 },
  headerExportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, gap: 8 },
  headerExportText: { color: WHITE, fontSize: 12, fontWeight: 'bold' },

  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 15, height: 55, borderRadius: 18, elevation: 4, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.05, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: TEXT_MAIN },
  
  filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  dateControl: { flex: 1, backgroundColor: WHITE, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  dateControlLabel: { fontSize: 9, fontWeight: 'bold', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 4 },
  dateControlValue: { fontSize: 14, fontWeight: '900', color: BLUE_PRIMARY },
  dateArrow: { width: 30, alignItems: 'center' },

  statusFilter: { marginTop: 20, marginBottom: 10 },
  statusChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: WHITE, borderWidth: 1, borderColor: '#F1F5F9', marginRight: 10 },
  statusChipActive: { backgroundColor: BLUE_PRIMARY, borderColor: BLUE_PRIMARY },
  statusChipText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  statusChipTextActive: { color: WHITE },

  historyList: { marginTop: 25, paddingHorizontal: 25, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  listTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
  listSub: { fontSize: 12, color: TEXT_MUTED, fontWeight: '700' },

  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02 },
  itemIconBox: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemMain: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  itemMeta: { fontSize: 11, color: TEXT_MUTED, marginTop: 4, fontWeight: '600' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 14, fontWeight: '900', color: BLUE_PRIMARY, marginBottom: 5 },
  emptyText: { textAlign: 'center', color: TEXT_MUTED, marginTop: 40, fontSize: 14, fontWeight: '600' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.7)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { backgroundColor: WHITE, width: '92%', borderRadius: 35, padding: 25, elevation: 25 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  detailTitle: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY },
  receiptMain: { backgroundColor: '#F8FAFC', borderRadius: 25, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  receiptTop: { alignItems: 'center', marginBottom: 25 },
  bannerLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  bannerValue: { fontSize: 36, fontWeight: '900', color: ACCENT_GREEN, marginVertical: 12 },
  statusTag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  statusTagText: { fontSize: 11, fontWeight: '900' },
  dashedDivider: { width: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 20 },
  infoSection: { width: '100%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '700' },
  infoValue: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: '900' },
  verificationSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  qrPlaceholder: { width: 70, height: 70, backgroundColor: '#F8FAFC', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  verifTitle: { fontSize: 14, fontWeight: '900', color: BLUE_PRIMARY, marginBottom: 4 },
  verifDesc: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', lineHeight: 14 },
  closeFullBtn: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  closeFullBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  bottomNavInner: { flex: 1, flexDirection: 'row', paddingBottom: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
});
