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
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const GOLD = '#D4AF37';

export default function RekapKelasScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rekapData, setRekapData] = useState([]);
  const [filter, setFilter] = useState('mingguan');

  useEffect(() => {
    fetchRekap();
  }, [filter]);

  const fetchRekap = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const user = JSON.parse(userDataStr);

      const response = await apiClient.get(`guru/guru_get_rekap.php?user_id=${user.id}&filter=${filter}`);
      if (response.data && response.data.status === 'success') {
        setRekapData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching rekap:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRekap();
  };

  const renderRekap = ({ item }) => (
    <View style={styles.rekapCard}>
      <View style={styles.rekapHeader}>
        <Text style={styles.siswaName}>{item.nama}</Text>
        <Text style={styles.siswaNis}>{item.nis}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
           <Text style={styles.statLabel}>Kehadiran</Text>
           <Text style={styles.statVal}>{item.total_hadir || 0} Kali</Text>
        </View>
        <View style={styles.statItem}>
           <Text style={styles.statLabel}>Konsumsi</Text>
           <Text style={styles.statVal}>{item.total_makan || 0} Kali</Text>
        </View>
        <View style={styles.statItem}>
           <Text style={styles.statLabel}>Rasio</Text>
           <Text style={[styles.statVal, { color: GOLD }]}>
             {item.total_hadir > 0 ? Math.round((item.total_makan / item.total_hadir) * 100) : 0}%
           </Text>
        </View>
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
            <Text style={styles.headerTitle}>Rekap Konsumsi Kelas</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.filterRow}>
             <TouchableOpacity 
               style={[styles.filterBtn, filter === 'mingguan' && styles.filterBtnActive]}
               onPress={() => setFilter('mingguan')}
             >
                <Text style={[styles.filterText, filter === 'mingguan' && styles.filterTextActive]}>Mingguan</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.filterBtn, filter === 'bulanan' && styles.filterBtnActive]}
               onPress={() => setFilter('bulanan')}
             >
                <Text style={[styles.filterText, filter === 'bulanan' && styles.filterTextActive]}>Bulanan</Text>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={rekapData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRekap}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyBox}>
             <Ionicons name="bar-chart-outline" size={60} color="#CBD5E1" />
             <Text style={styles.emptyText}>Belum ada data rekap tersedia</Text>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 10 },
  filterBtn: { flex: 1, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterBtnActive: { backgroundColor: WHITE, borderColor: WHITE },
  filterText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  filterTextActive: { color: BLUE_PRIMARY },
  listContent: { padding: 20, paddingBottom: 100 },
  rekapCard: { 
    backgroundColor: WHITE, 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  rekapHeader: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', pb: 10 },
  siswaName: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  siswaNis: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'flex-start' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' },
  statVal: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});
