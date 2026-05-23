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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';

export default function RiwayatSiswaScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(parsed);
        fetchRiwayat(parsed.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiwayat = async (userId) => {
    if (!userId) return;
    try {
      const response = await apiClient.get(`siswa/siswa_get_stats.php?user_id=${userId}`);
      if (response?.data?.status === 'success') {
        setRiwayat(response.data.data?.riwayat || []);
      }
    } catch (error) {
      console.log("Riwayat error:", error.message);
    }
  };

  const onRefresh = async () => {
    if (!userData?.id) {
      return;
    }
    setRefreshing(true);
    await fetchRiwayat(userData.id);
    setRefreshing(false);
  };


  const renderItem = ({ item }) => {
    const isMasuk = item.type === 'masuk';
    const isMeal = item.message === 'Pengambilan Makan Bergizi';

    return (
      <View style={styles.historyItem}>
        <View style={[
          styles.historyIcon,
          { backgroundColor: isMasuk ? '#F0FDF4' : (isMeal ? '#EFF6FF' : '#FEF2F2') }
        ]}>
          <Ionicons
            name={isMasuk ? "arrow-down-circle" : (isMeal ? "restaurant" : "arrow-up-circle")}
            size={22}
            color={isMasuk ? SUCCESS : (isMeal ? BLUE_PRIMARY : '#EF4444')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.itemHeader}>
            <Text style={styles.historyMessage}>{item.message}</Text>
            <Text style={styles.historyTime}>{item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
          </View>
          <Text style={[
            styles.historyDetail,
            { color: isMasuk ? SUCCESS : '#EF4444' }
          ]}>
            {isMasuk ? 'Masuk: +' : 'Keluar: -'}{item.amount} PTS
          </Text>
          <Text style={styles.historyDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</Text>
        </View>
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
              <Text style={styles.headerTitleTxt}>Riwayat Transaksi</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSiswa')}>
          <Ionicons name="grid-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt" size={24} color={BLUE_PRIMARY} />
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilSiswa')}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerArea: { height: 180, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', elevation: 15, marginBottom: 15 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
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
  floatingScanBtn: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
  navMainInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: WHITE, elevation: 15 }
});
