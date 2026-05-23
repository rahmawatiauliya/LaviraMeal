import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, 
  StatusBar, FlatList, ActivityIndicator, Alert, ScrollView, Image, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';
const GREEN_EXCEL = '#107C41';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';

export default function LaporanScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    point: '0',
    verif: '0',
    aktif: '0',
    total: '0'
  });
  const [distribusiData, setDistribusiData] = useState([]);
  const [verifikasiData, setVerifikasiData] = useState([]);
  
  // DATE FILTER STATE
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // PREVIEW MODAL STATE
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      const sppgId = userData.sppg_id;

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const statsRes = await apiClient.get(`sppg/sppg_get_stats.php?sppg_id=${sppgId}&start_date=${startStr}&end_date=${endStr}`);
      if (statsRes.data.status === 'success') {
        const s = statsRes.data.data;
        setStats({
          point: Number(s.point_bulan_ini || 0).toLocaleString('id-ID'),
          verif: (s.total_verifikasi || 0).toString(),
          aktif: (s.kantin_aktif || 0).toString(),
          total: (s.total_sekolah || 0).toString()
        });
      }

      const laporanRes = await apiClient.get(`sppg/sppg_get_laporan_lengkap.php?sppg_id=${sppgId}&start_date=${startStr}&end_date=${endStr}`);
      if (laporanRes?.data?.status === 'success') {
        const data = laporanRes.data.data || {};
        
        setDistribusiData(data.transaksi_dana?.map(t => ({
          id: (t.id || Math.random()).toString(),
          nama: t.sekolah || 'Sekolah',
          sub: `${t.metode || 'Auto'} · ${t.tanggal_format || '-'}`,
          amount: `${Number(t.nominal || 0)}`,
          status: 'Berhasil'
        })) || []);

        setVerifikasiData(data.riwayat?.map(r => ({
          id: (r.id || Math.random()).toString(),
          nama: r.nama_kantin || 'Kantin',
          sub: `${r.nama_sekolah || '-'} · ${r.tanggal || '-'}`,
          status: r.status === 'completed' || r.status === 'Aktif' ? 'Disetujui' : 'Menunggu'
        })) || []);
      }

    } catch (error) {
      console.error('Fetch Laporan Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, startDate, endDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePreview = (type) => {
    const title = type === 'distribusi' ? 'Laporan Distribusi Point' : 'Laporan Verifikasi Kantin';
    const data = type === 'distribusi' ? distribusiData : verifikasiData;
    setPreviewTitle(title);
    setPreviewData(data);
    setPreviewVisible(true);
  };

  const downloadExcel = async () => {
    try {
      setPreviewVisible(false);
      setLoading(true);

      // Create CSV content (Excel compatible)
      let csvContent = "\uFEFF"; // BOM for UTF-8
      csvContent += "ID;Nama/Institusi;Keterangan;Nominal;Status\n";
      
      previewData.forEach(item => {
        csvContent += `${item.id};${item.nama};${item.sub};${item.amount || '-'};${item.status}\n`;
      });

      const fileName = `${previewTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/comma-separated-values',
          dialogTitle: 'Download Laporan Excel',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert("Gagal", "Fitur berbagi file tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengunduh file excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
        <Image 
          source={require('../../../../assets/batik_cirebon.png')} 
          style={styles.batikOverlay} 
        />
        <SafeAreaView>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Laporan</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handlePreview('distribusi')}>
              <Feather name="eye" size={22} color={WHITE} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateFilterContainer}>
            <TouchableOpacity 
              style={styles.dateBtn} 
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateLabel}>DARI TANGGAL</Text>
              <View style={styles.dateValRow}>
                <Ionicons name="calendar-outline" size={16} color={WHITE} />
                <Text style={styles.dateValText}>{startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.4)" />
            </View>

            <TouchableOpacity 
              style={styles.dateBtn} 
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateLabel}>SAMPAI TANGGAL</Text>
              <View style={styles.dateValRow}>
                <Ionicons name="calendar-outline" size={16} color={WHITE} />
                <Text style={styles.dateValText}>{endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => { setShowStartPicker(false); if(date) setStartDate(date); }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => { setShowEndPicker(false); if(date) setEndDate(date); }}
            />
          )}
        </SafeAreaView>
      </View>

      <View style={styles.whiteSection}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          


          {/* DISTRIBUSI POINT */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Distribusi Point</Text>
              <TouchableOpacity style={styles.miniExcel} onPress={() => handlePreview('distribusi')}>
                <Feather name="eye" size={12} color={WHITE} />
                <Text style={styles.miniExcelText}>Preview</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {distribusiData.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View style={styles.listIconBox}>
                    <Ionicons name="business" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.listBody}>
                    <Text style={styles.listTitle}>{item.nama}</Text>
                    <Text style={styles.listSub}>{item.sub}</Text>
                  </View>
                  <View style={styles.listTail}>
                    <Text style={[styles.listAmount, { color: '#10B981' }]}>+{Number(item.amount).toLocaleString('id-ID')}</Text>
                    <View style={[styles.badge, { backgroundColor: item.status === 'Berhasil' ? '#ECFDF5' : '#FFF7ED' }]}>
                      <Text style={[styles.badgeText, { color: item.status === 'Berhasil' ? '#10B981' : '#F59E0B' }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.seeAll} onPress={() => handlePreview('distribusi')}>
                <Text style={styles.seeAllText}>Lihat semua →</Text>
              </TouchableOpacity>
            </View>
          </View>


        </ScrollView>
      </View>

      {/* PREVIEW MODAL */}
      <Modal visible={previewVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.previewSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Preview Laporan</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.previewSubtitle}>{previewTitle}</Text>
            
            <View style={styles.previewTable}>
               <View style={styles.tableHeader}>
                 <Text style={[styles.th, { flex: 2 }]}>Nama</Text>
                 <Text style={[styles.th, { flex: 1 }]}>Nominal</Text>
                 <Text style={[styles.th, { flex: 1 }]}>Status</Text>
               </View>
               <ScrollView style={{ maxHeight: 300 }}>
                 {previewData.map((item, idx) => (
                   <View key={idx} style={styles.tableRow}>
                     <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{item.nama}</Text>
                     <Text style={[styles.td, { flex: 1 }]}>{item.amount ? Number(item.amount).toLocaleString('id-ID') : '-'}</Text>
                     <Text style={[styles.td, { flex: 1, color: item.status === 'Disetujui' || item.status === 'Berhasil' ? '#10B981' : '#F59E0B' }]}>{item.status}</Text>
                   </View>
                 ))}
               </ScrollView>
            </View>

            <TouchableOpacity style={styles.downloadFinalBtn} onPress={downloadExcel}>
              <MaterialCommunityIcons name="file-excel" size={20} color={WHITE} />
              <Text style={styles.downloadFinalText}>KONFIRMASI & DOWNLOAD EXCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Ionicons name="grid-outline" size={24} color="#94A3B8" /><Text style={styles.navLabel}>Beranda</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sekolah')}><Ionicons name="business-outline" size={24} color="#94A3B8" /><Text style={styles.navLabel}>Sekolah</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="bar-chart" size={24} color={BLUE_PRIMARY} /><Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Laporan</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}><Ionicons name="person-outline" size={24} color="#94A3B8" /><Text style={styles.navLabel}>Profil</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  header: { paddingHorizontal: 25, paddingBottom: 60, paddingTop: 20, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.08, resizeMode: 'repeat' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: WHITE },
  iconBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  dateFilterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 25, 
    gap: 10 
  },
  dateBtn: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 12, 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  dateLabel: { 
    fontSize: 9, 
    color: 'rgba(255,255,255,0.5)', 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  dateValRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  dateValText: { 
    color: WHITE, 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  dateArrow: {
    paddingTop: 15
  },

  whiteSection: { flex: 1, backgroundColor: '#F5F7FA', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 25, paddingTop: 30, marginTop: -30 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  metricCard: { width: '48%', backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  metricVal: { fontSize: 22, fontWeight: 'bold', color: BLUE_PRIMARY },
  metricLab: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', marginTop: 5 },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  miniExcel: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  miniExcelText: { color: WHITE, fontSize: 10, fontWeight: 'bold' },

  listContainer: { backgroundColor: WHITE, borderRadius: 20, paddingHorizontal: 5, paddingVertical: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  listBody: { flex: 1, marginLeft: 15 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  listSub: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  listTail: { alignItems: 'flex-end' },
  listAmount: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
  seeAll: { paddingVertical: 15, alignItems: 'center' },
  seeAllText: { color: '#3B82F6', fontSize: 13, fontWeight: 'bold' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  previewSheet: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  previewSubtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 20 },
  previewTable: { backgroundColor: '#F8FAFC', borderRadius: 15, padding: 10, marginBottom: 25 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 10 },
  th: { fontSize: 12, fontWeight: 'bold', color: BLUE_PRIMARY },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 12, color: TEXT_MAIN },
  downloadFinalBtn: { backgroundColor: GREEN_EXCEL, height: 60, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  downloadFinalText: { color: WHITE, fontSize: 14, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },
});
