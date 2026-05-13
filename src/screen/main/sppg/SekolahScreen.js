import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  ImageBackground,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#FFFFFF';

export default function SekolahScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickActionModal, setQuickActionModal] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);

      if (!userData.sppg_id) {
        console.warn("SPPG ID is missing for user:", userData.nama);
        setLoading(false);
        return;
      }

      const response = await apiClient.get(`sppg/sppg_get_sekolah.php?sppg_id=${userData.sppg_id}`).catch(() => null);
      if (response && response.data && response.data.status === 'success') {
        setSchools(response.data.data || []);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const filteredSchools = useMemo(() => {
    // FILTER: Hilangkan sekolah yang belum memiliki akun/status tidak valid
    return schools
      .filter(s => s.nama_sekolah && s.status && s.status !== 'Draft')
      .filter(s => 
        s.nama_sekolah.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.npsn || '').includes(searchQuery)
      );
  }, [schools, searchQuery]);

  const renderSchoolCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('DetailSekolah', { sekolah: item })}
    >
       <View style={styles.cardLead}>
          <View style={styles.iconBox}><MaterialCommunityIcons name="office-building" size={24} color={BLUE_PRIMARY} /></View>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'Aktif' ? '#10b981' : '#f59e0b' }]} />
       </View>
       <View style={styles.cardBody}>
          <Text style={styles.schName}>{item.nama_sekolah}</Text>
          <Text style={styles.schSub}>NPSN {item.npsn} • {item.siswa} Siswa</Text>
          <View style={[styles.tag, { backgroundColor: item.status === 'Aktif' ? '#f0fdf4' : '#fff7ed' }]}>
             <Text style={[styles.tagTxt, { color: item.status === 'Aktif' ? '#10b981' : '#f59e0b' }]}>{item.status.toUpperCase()}</Text>
          </View>
       </View>
       <Feather name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

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
            <View>
              <Text style={styles.hTitle}>Direktori Sekolah</Text>
              <Text style={styles.hSub}>Otoritas Wilayah Klari</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('TambahSekolah')}>
              <Ionicons name="add" size={20} color={WHITE} />
              <Text style={styles.addBtnTxt}>Pendaftaran</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput 
              placeholder="Cari NPSN atau Nama Sekolah..." 
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
         {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={BLUE_PRIMARY} /></View>
         ) : (
            <FlatList
              data={filteredSchools}
              keyExtractor={item => item.id.toString()}
              renderItem={renderSchoolCard}
              contentContainerStyle={{ padding: 25, paddingBottom: 150 }}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTxt}>Sekolah tidak ditemukan</Text></View>}
            />
         )}
      </View>

      {/* QUICK ACTION MODAL */}
      <Modal visible={quickActionModal} transparent animationType="fade">
         <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setQuickActionModal(false)}>
            <View style={styles.actionSheet}>
               <Text style={styles.sheetTitle}>Operasional Sekolah</Text>
               <View style={styles.sheetGrid}>
                  {[
                    { label: 'Registrasi', icon: 'person-add', color: '#4f46e5', press: () => { navigation.navigate('TambahSekolah'); setQuickActionModal(false); } },
                    { label: 'Transfer', icon: 'send', color: '#0ea5e9', press: () => setQuickActionModal(false) },
                    { label: 'Laporan', icon: 'file-tray-full', color: '#10b981', press: () => { navigation.navigate('Laporan'); setQuickActionModal(false); } },
                    { label: 'Beranda', icon: 'home', color: '#f59e0b', press: () => { navigation.navigate('Home'); setQuickActionModal(false); } },
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

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Ionicons name="grid-outline" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Beranda</Text></TouchableOpacity>
         <TouchableOpacity style={styles.navItem}><Ionicons name="business" size={24} color={BLUE_PRIMARY} /><Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Sekolah</Text></TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Laporan')}><Ionicons name="bar-chart-outline" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Laporan</Text></TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}><Ionicons name="person-outline" size={24} color="#94a3b8" /><Text style={styles.navLabel}>Profil</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  header: { paddingHorizontal: 25, paddingBottom: 60, paddingTop: 20, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.08, resizeMode: 'repeat' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 25 },
  hTitle: { color: WHITE, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  hSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15, gap: 6, elevation: 5 },
  addBtnTxt: { color: WHITE, fontWeight: '900', fontSize: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchInput: { flex: 1, marginLeft: 12, color: WHITE, fontSize: 14, fontWeight: '700' },
  content: { flex: 1, backgroundColor: '#F5F7FA', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 30, padding: 22, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  cardLead: { position: 'relative' },
  iconBox: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  statusDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: WHITE },
  cardBody: { flex: 1, marginLeft: 18 },
  schName: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  schSub: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 'bold' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 10 },
  tagTxt: { fontSize: 9, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTxt: { color: '#94a3b8', fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(11,30,63,0.8)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 35 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY, textAlign: 'center', marginBottom: 30 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20 },
  sheetItem: { width: '45%', alignItems: 'center' },
  sheetIconBox: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  sheetLabel: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  navItemMain: { marginTop: -50 },
  navMainInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: SOFT_BG, elevation: 15 },
});
