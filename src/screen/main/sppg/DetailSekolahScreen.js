import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  useWindowDimensions,
  Linking,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_ACCENT = '#3B82F6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F5F7FA';

export default function DetailSekolahScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const { sekolah } = route.params || {};
  const [schoolData, setSchoolData] = useState(sekolah);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchoolDetail = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      
      const response = await apiClient.get(`sppg/sppg_get_sekolah.php?sppg_id=${userData.sppg_id}&sekolah_id=${sekolah.id}`);
      console.log("API Response:", response.data);
      if (response.data && response.data.status === 'success') {
        setSchoolData(response.data.data);
      } else {
        Alert.alert("Info", "Data sekolah tidak ditemukan di server.");
      }
    } catch (error) {
      console.error("Fetch Detail Error:", error);
      if (isRefresh) Alert.alert("Error", "Gagal memperbarui data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sekolah.id]);

  useEffect(() => {
    fetchSchoolDetail();
  }, [fetchSchoolDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchoolDetail(true);
  };

  const handleAction = (type) => {
    switch(type) {
      case 'call':
        Linking.openURL(`tel:${schoolData?.telepon || '0211234567'}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${schoolData?.email || 'admin@sekolah.sch.id'}`);
        break;
      case 'map':
        const addr = encodeURIComponent(schoolData?.alamat || schoolData?.nama_sekolah);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
        break;
      default:
        break;
    }
  };

  const getPrincipalName = (name) => {
    if (!name || name === 'Belum Diatur') return 'Belum Diatur';
    // Hapus awalan Admin, Kepala, atau PLT jika ada untuk tampilan lebih bersih
    return name.replace(/^(Admin|Kepala|PLT|Admin Sekolah)\s+/i, '');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
      >
        {/* PREMIUM HEADER HERO */}
        <View style={styles.header}>
          <Image 
            source={require('../../../../assets/batik_cirebon.png')} 
            style={styles.batikOverlay} 
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>MANAJEMEN INSTITUSI</Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => Alert.alert("Opsi", "Fitur manajemen data sekolah.")}>
                <Ionicons name="ellipsis-vertical" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="office-building-marker" size={36} color={BLUE_PRIMARY} />
              </View>
              <View style={styles.identity}>
                <Text style={styles.schoolName}>{schoolData?.nama_sekolah || "Institusi Pendidikan"}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.npsnBadge}>
                    <Text style={styles.npsnText}>NPSN: {schoolData?.npsn || '2023xxxx'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: schoolData?.status === 'Aktif' ? '#10B981' : '#F59E0B' }]}>
                    <Text style={styles.statusText}>{schoolData?.status?.toUpperCase() || 'PROBATION'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.qActionBtn} onPress={() => handleAction('call')}>
                <Ionicons name="call" size={20} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.qActionBtn} onPress={() => handleAction('email')}>
                <Ionicons name="mail" size={20} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.qActionBtn} onPress={() => handleAction('map')}>
                <Ionicons name="location" size={20} color={WHITE} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* METRICS ROW */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.mValue}>{schoolData?.siswa || 0}</Text>
            <Text style={styles.mLabel}>Total Siswa</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.mValue}>{schoolData?.jumlah_kelas || 0}</Text>
            <Text style={styles.mLabel}>Kelas</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.mValue}>{schoolData?.jumlah_kantin || 0}</Text>
            <Text style={styles.mLabel}>Kantin</Text>
          </View>
        </View>

        {/* FINANCE & PROGRAM STATUS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realisasi Program MBG</Text>
          <View style={styles.mainCard}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.bLabel}>Alokasi Poin Bulan Ini</Text>
                <Text style={styles.bValue}>{(schoolData?.saldo || 0).toLocaleString('id-ID')} PTS</Text>
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 4 }}>*1 Point = Rp 15.000</Text>
              </View>
              <TouchableOpacity style={styles.auditBtn} onPress={() => navigation.navigate('AturJadwalPoin', { sekolah: schoolData })}>
                <Ionicons name="calendar" size={18} color={BLUE_PRIMARY} />
                <Text style={styles.auditText}>Atur Jadwal</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.pHeader}>
                <Text style={styles.pLabel}>Target Konsumsi</Text>
                <Text style={styles.pPercent}>{schoolData?.target_konsumsi || 0}%</Text>
              </View>
              <View style={styles.pBarBg}><View style={[styles.pBarFill, { width: `${schoolData?.target_konsumsi || 0}%`, backgroundColor: '#10B981' }]} /></View>
              
              <View style={[styles.pHeader, { marginTop: 15 }]}>
                <Text style={styles.pLabel}>Kepatuhan Menu Gizi</Text>
                <Text style={styles.pPercent}>{schoolData?.kepatuhan_gizi || 0}%</Text>
              </View>
              <View style={styles.pBarBg}><View style={[styles.pBarFill, { width: `${schoolData?.kepatuhan_gizi || 0}%`, backgroundColor: BLUE_ACCENT }]} /></View>
            </View>
          </View>
        </View>

        {/* DETAILED INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Institusi</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="person" size={18} color={BLUE_PRIMARY} /></View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Kepala Sekolah</Text>
                <Text style={styles.infoValue}>{getPrincipalName(schoolData?.kepala_sekolah)}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="ribbon" size={18} color={BLUE_PRIMARY} /></View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Jenjang / Status</Text>
                <Text style={styles.infoValue}>{schoolData?.jenjang || 'SD'} / {schoolData?.status_sekolah || 'Negeri'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="id-card" size={18} color={BLUE_PRIMARY} /></View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>NPSN</Text>
                <Text style={styles.infoValue}>{schoolData?.npsn || '-'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="location" size={18} color={BLUE_PRIMARY} /></View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Alamat Lengkap</Text>
                <Text style={styles.infoValue}>{schoolData?.alamat || 'Alamat belum tersedia'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FINAL ACTIONS */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => fetchSchoolDetail()} disabled={loading}>
            {loading ? <ActivityIndicator color={WHITE} /> : (
              <>
                <Ionicons name="sync" size={20} color={WHITE} />
                <Text style={styles.primaryBtnText}>SINKRONISASI DATA</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Laporan', { sekolahId: schoolData?.id })}>
            <Text style={styles.secondaryBtnText}>LIHAT LAPORAN LENGKAP</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 400, backgroundColor: BLUE_PRIMARY, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', paddingHorizontal: 25 },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 50, marginBottom: 30 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: WHITE, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  
  heroContent: { alignItems: 'center', marginTop: 10 },
  iconContainer: { width: 80, height: 80, borderRadius: 25, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  identity: { alignItems: 'center', marginTop: 20 },
  schoolName: { color: WHITE, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  npsnBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  npsnText: { color: WHITE, fontSize: 11, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: WHITE, fontSize: 11, fontWeight: 'bold' },
  
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 30 },
  qActionBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  metricsContainer: { flexDirection: 'row', backgroundColor: WHITE, marginHorizontal: 25, marginTop: -40, borderRadius: 25, paddingVertical: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  metricItem: { flex: 1, alignItems: 'center' },
  mValue: { fontSize: 22, fontWeight: 'bold', color: BLUE_PRIMARY },
  mLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', marginTop: 4 },
  mDivider: { width: 1, height: '60%', backgroundColor: '#F1F5F9', alignSelf: 'center' },

  section: { marginTop: 35, paddingHorizontal: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  mainCard: { backgroundColor: WHITE, borderRadius: 25, padding: 25, elevation: 5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  bLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginBottom: 5 },
  bValue: { fontSize: 24, fontWeight: 'bold', color: BLUE_PRIMARY },
  auditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  auditText: { color: BLUE_PRIMARY, fontSize: 12, fontWeight: 'bold' },
  
  progressSection: { gap: 10 },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pLabel: { fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  pPercent: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  pBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginTop: 8 },
  pBarFill: { height: '100%', borderRadius: 4 },

  infoCard: { backgroundColor: WHITE, borderRadius: 25, padding: 25, gap: 15, elevation: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  infoTextGroup: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1E293B', fontWeight: 'bold' },
  infoDivider: { height: 1, backgroundColor: '#F1F5F9' },

  bottomActions: { paddingHorizontal: 25, marginTop: 40, gap: 15 },
  primaryBtn: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 20 },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: '900' },
  secondaryBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  secondaryBtnText: { color: '#64748B', fontSize: 13, fontWeight: 'bold' },
});
