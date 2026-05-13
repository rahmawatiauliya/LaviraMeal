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

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchLaporan();
      const interval = setInterval(() => {
        fetchLaporan();
      }, 3000);
      return () => clearInterval(interval);
    }, [fetchLaporan])
  );

  const handleDownload = async () => {
    try {
      setLoading(true);
      const filtered = dataTransaksi.filter(t => {
        const tDate = t.tanggal ? new Date(t.tanggal) : null;
        const matchDate = !tDate || (tDate >= startDate && tDate <= endDate);
        const matchStatus = filterStatus === 'Semua' || (t.status && String(t.status).toLowerCase() === filterStatus.toLowerCase());
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
            <td>${parseInt(item.nominal || 0).toLocaleString('id-ID')} PTS</td>
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

    if (s === 'completed' || s === 'berhasil' || s === 'selesai') { bgColor = '#ECFDF5'; textColor = ACCENT_GREEN; label = 'Selesai'; }
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
    const matchDate = !tDate || (tDate >= startDate && tDate <= endDate);
    const matchStatus = filterStatus === 'Semua' || (t.status && String(t.status).toLowerCase() === filterStatus.toLowerCase());
    const matchSearch = (t.pengirim && String(t.pengirim).toLowerCase().includes(search.toLowerCase())) ||
      (t.metode && String(t.metode).toLowerCase().includes(search.toLowerCase()));
    return matchDate && matchStatus && matchSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <View style={styles.headerBg}>
          <Image
            source={require('../../../../assets/batik_cirebon.png')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.12, resizeMode: 'repeat' }]}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerSubtitle}>LAPORAN SEKOLAH</Text>
                <Text style={styles.headerTitle}>Riwayat Poin</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.refreshBtn} onPress={handleDownload}>
                  <Feather name="download" size={20} color={WHITE} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchLaporan}>
                  <Feather name="refresh-cw" size={20} color={WHITE} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.statsContainer}>
          <View style={styles.metricsGrid}>
            <View style={[styles.premiumStatCardGrid, { borderTopWidth: 4, borderTopColor: ACCENT_GREEN }]}>
              <View style={styles.statIconWrapMini}>
                <MaterialCommunityIcons name="arrow-up-circle" size={18} color={ACCENT_GREEN} />
              </View>
              <Text style={styles.statLabel}>Total Dana Masuk</Text>
              <Text style={styles.statValueMini}>{stats.total_dana_masuk} <Text style={styles.statUnit}>PTS</Text></Text>
              <View style={styles.realtimeIndicator}>
                <View style={styles.pingSmall} />
                <Text style={styles.realtimeText}>Realtime</Text>
              </View>
            </View>

            <View style={[styles.premiumStatCardGrid, { borderTopWidth: 4, borderTopColor: BLUE_ACCENT }]}>
              <View style={styles.statIconWrapMini}>
                <MaterialCommunityIcons name="calendar-check" size={18} color={BLUE_ACCENT} />
              </View>
              <Text style={styles.statLabel}>Periode</Text>
              <Text style={styles.statValueMini}>{stats.rekap_bulan}</Text>
              <Text style={styles.statSubTextMini}>Bulan Ini</Text>
            </View>
          </View>

          <View style={styles.pointNoteBox}>
            <MaterialCommunityIcons name="information-outline" size={14} color={TEXT_MUTED} />
            <Text style={styles.pointNoteText}>1 Point (PTS) = Rp. 15.000</Text>
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={BLUE_PRIMARY} style={{ marginLeft: 15 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari pengirim atau metode..."
                placeholderTextColor={TEXT_MUTED}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <View style={styles.dateFilterContainer}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('start')}>
              <Feather name="calendar" size={14} color={BLUE_PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.dateLabel}>Mulai</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleDateString('id-ID')}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.dateConnector} />
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('end')}>
              <Feather name="calendar" size={14} color={BLUE_PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.dateLabel}>Sampai</Text>
                <Text style={styles.dateValue}>{endDate.toLocaleDateString('id-ID')}</Text>
              </View>
            </TouchableOpacity>
          </View>

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['Semua', 'Selesai', 'Proses', 'Batal'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChipItem, filterStatus === st && styles.filterChipActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text style={[styles.filterChipTextItem, filterStatus === st && styles.filterChipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.recordCounterRow}>
            <Text style={styles.recordCounterText}>Menampilkan {filteredData.length} transaksi</Text>
          </View>

          <View>
            {loading ? (
              <View style={{ padding: 30, width: width - 40, alignItems: 'center' }}><ActivityIndicator size="small" color={BLUE_PRIMARY} /></View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item, idx) => idx.toString()}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => {
                  const isSuccess = item.status?.toLowerCase() === 'berhasil' || item.status?.toLowerCase() === 'completed';
                  return (
                    <TouchableOpacity
                      style={styles.transactionCard}
                      onPress={() => {
                        setSelectedTransaction(item);
                        setDetailModalVisible(true);
                      }}
                    >
                      <View style={styles.transLeft}>
                        <View style={[styles.transIconBox, { backgroundColor: isSuccess ? '#ECFDF5' : '#F8FAFC' }]}>
                          <MaterialCommunityIcons
                            name="arrow-down-bold-circle"
                            size={24}
                            color={isSuccess ? ACCENT_GREEN : BLUE_PRIMARY}
                          />
                        </View>
                        <View style={styles.transInfo}>
                          <Text style={styles.transId}>{item.id}</Text>
                          <Text style={styles.transSender}><Feather name="user" size={10} /> {item.pengirim || 'SPPG Klari'}</Text>
                          <Text style={styles.transMeta}>{item.tanggal_format} • {item.metode}</Text>
                        </View>
                      </View>
                      <View style={styles.transRight}>
                        <Text style={[styles.transAmount, { color: isSuccess ? ACCENT_GREEN : BLUE_PRIMARY }]}>
                          +{parseInt(item.nominal || 0).toLocaleString('id-ID')} PTS
                        </Text>
                        {renderStatusBadge(item.status)}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                scrollEnabled={false}
                ListEmptyComponent={() => <Text style={{ padding: 20, textAlign: 'center', color: TEXT_MUTED }}>Tidak ada riwayat transaksi</Text>}
              />
            )}
          </View>
        </View>
      </ScrollView>

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
                    <Text style={styles.bannerLabel}>Bukti Transfer Masuk</Text>
                    <Text style={styles.bannerValue}>+{parseInt(selectedTransaction.nominal || 0).toLocaleString('id-ID')} PTS</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSekolah')}>
          <Ionicons name="grid-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ManajemenKelas')}>
          <Ionicons name="layers-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Kelas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color={BLUE_PRIMARY} />
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Laporan</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
          <Ionicons name="person-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 170, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', elevation: 15, marginBottom: 15 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 55 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 10, color: BLUE_ACCENT, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  refreshBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statsContainer: { marginTop: 15 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, gap: 10 },
  premiumStatCardGrid: { flex: 1, backgroundColor: WHITE, padding: 15, borderRadius: 20, elevation: 6, shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 10 },
  statIconWrapMini: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValueMini: { fontSize: 16, fontWeight: '900', color: BLUE_PRIMARY },
  statUnit: { fontSize: 10, color: TEXT_MUTED, fontWeight: 'bold' },
  statSubTextMini: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', marginTop: 4 },
  realtimeIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  pingSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT_GREEN },
  realtimeText: { fontSize: 9, color: ACCENT_GREEN, fontWeight: '800' },
  pointNoteBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 15, gap: 6 },
  pointNoteText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700' },
  mainCard: { flex: 1, backgroundColor: WHITE, paddingVertical: 25 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginLeft: 20, marginRight: 10, borderRadius: 16, height: 52, marginBottom: 15, borderWidth: 1, borderColor: BORDER_LIGHT },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: TEXT_MAIN, fontWeight: '600' },
  filterScroll: { paddingHorizontal: 20, marginBottom: 10 },
  recordCounterRow: { paddingHorizontal: 25, marginBottom: 15 },
  recordCounterText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateFilterContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  datePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: BORDER_LIGHT },
  dateLabel: { fontSize: 9, color: TEXT_MUTED, fontWeight: '800', textTransform: 'uppercase' },
  dateValue: { fontSize: 13, fontWeight: '900', color: BLUE_PRIMARY },
  dateConnector: { width: 10, height: 2, backgroundColor: BORDER_LIGHT },
  filterChipItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER_LIGHT, marginRight: 8 },
  filterChipActive: { backgroundColor: BLUE_PRIMARY, borderColor: BLUE_PRIMARY },
  filterChipTextItem: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  filterChipTextActive: { color: WHITE },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: WHITE, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  transLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transInfo: { flex: 1 },
  transId: { fontSize: 14, fontWeight: '800', color: BLUE_PRIMARY, marginBottom: 2 },
  transSender: { fontSize: 12, fontWeight: '700', color: BLUE_ACCENT, marginBottom: 4 },
  transMeta: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  transRight: { alignItems: 'flex-end' },
  transAmount: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { backgroundColor: WHITE, width: '92%', borderRadius: 32, padding: 20, elevation: 20, maxHeight: '85%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
  receiptMain: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0' },
  receiptTop: { alignItems: 'center', marginBottom: 20 },
  bannerLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  bannerValue: { fontSize: 36, fontWeight: '900', color: ACCENT_GREEN, marginBottom: 12 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusTagText: { fontSize: 11, fontWeight: 'bold' },
  dashedDivider: { width: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', marginVertical: 20 },
  infoSection: { width: '100%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  infoValue: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: '800' },
  verificationSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  qrPlaceholder: { width: 80, height: 80, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifTitle: { fontSize: 14, fontWeight: '900', color: BLUE_PRIMARY, marginBottom: 4 },
  verifDesc: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', lineHeight: 14 },
  closeFullBtn: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  closeFullBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 50, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  navLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginTop: 4 },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE_PRIMARY, marginTop: 4 },
});
