import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const GOLD = '#D4AF37';

export default function DaftarSiswaWaliScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listSiswa, setListSiswa] = useState([]);
  const [filteredSiswa, setFilteredSiswa] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSiswa();
  }, []);

  const fetchSiswa = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);

      const response = await apiClient.get(`guru/guru_get_siswa.php?user_id=${userData.id}`);
      if (response.data && response.data.status === 'success') {
        setListSiswa(response.data.data || []);
        setFilteredSiswa(response.data.data || []);
      } else {
        Alert.alert("Gagal", response.data?.message || "Gagal mengambil data siswa.");
      }
    } catch (error) {
      console.error("Error fetching siswa:", error);
      Alert.alert("Error", error.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSiswa();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredSiswa(listSiswa);
    } else {
      const filtered = listSiswa.filter(item => 
        item.nama.toLowerCase().includes(text.toLowerCase()) || 
        item.nis.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSiswa(filtered);
    }
  };

  const renderSiswa = ({ item, index }) => (
    <View style={styles.siswaCard}>
      <View style={[styles.avatarBox, { backgroundColor: item.jenis_kelamin === 'L' ? '#EFF6FF' : '#FDF2F8' }]}>
        <Text style={[styles.avatarText, { color: item.jenis_kelamin === 'L' ? '#3B82F6' : '#EC4899' }]}>
          {item.nama.charAt(0)}
        </Text>
      </View>
      <View style={styles.siswaInfo}>
        <Text style={styles.siswaName}>{item.nama}</Text>
        <Text style={styles.siswaNis}>NIS: {item.nis} • {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.aktif ? '#DCFCE7' : '#FEE2E2' }]}>
        <Text style={[styles.statusText, { color: item.aktif ? '#16A34A' : '#EF4444' }]}>
          {item.aktif ? 'AKTIF' : 'NONAKTIF'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
        />
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daftar Siswa Kelas</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.searchContainer}>
             <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
             <TextInput 
                style={styles.searchInput} 
                placeholder="Cari nama atau NIS siswa..." 
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchQuery}
                onChangeText={handleSearch}
             />
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={filteredSiswa}
        keyExtractor={(item) => item.id}
        renderItem={renderSiswa}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyBox}>
             <Ionicons name="people-outline" size={60} color="#CBD5E1" />
             <Text style={styles.emptyText}>Tidak ada data siswa ditemukan</Text>
          </View>
        )}
        ListHeaderComponent={loading && !refreshing ? <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{marginTop: 50}} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: BLUE_PRIMARY, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    overflow: 'hidden' 
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  searchInput: { flex: 1, marginLeft: 10, color: WHITE, fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 100 },
  siswaCard: { 
    backgroundColor: WHITE, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 12, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  avatarBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  siswaInfo: { flex: 1, marginLeft: 15 },
  siswaName: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  siswaNis: { fontSize: 11, color: '#64748B', marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});
