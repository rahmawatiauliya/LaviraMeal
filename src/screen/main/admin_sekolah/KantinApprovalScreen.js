import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const SUCCESS = '#10B981';

export default function KantinApprovalScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingKantin, setPendingKantin] = useState([]);

  const fetchPendingKantin = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      
      const response = await apiClient.get(`sekolah/sekolah_get_pending_kantin.php?sekolah_id=${parsedUser.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setPendingKantin(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending kantin:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingKantin();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingKantin();
  };

  const handleApprove = (kantin) => {
    Alert.alert(
      "Konfirmasi Persetujuan",
      `Apakah Anda yakin ingin menyetujui ${kantin.nama_kantin} untuk menjadi mitra MBG?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Setujui", 
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiClient.post('sekolah/sekolah_approve_kantin.php', {
                kantin_id: kantin.id,
                user_id: kantin.user_id
              });
              
              if (response.data.status === 'success') {
                Alert.alert("Berhasil", "Kantin telah disetujui dan kini aktif.");
                fetchPendingKantin();
              } else {
                Alert.alert("Gagal", response.data.message || "Terjadi kesalahan.");
              }
            } catch (err) {
              Alert.alert("Error", "Koneksi bermasalah.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderKantinItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="store-plus" size={28} color={BLUE_PRIMARY} />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.kantinName}>{item.nama_kantin}</Text>
          <Text style={styles.ownerText}>Pemilik: {item.pemilik}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={12} color="#64748B" />
            <Text style={styles.infoText}>{item.no_telp || '-'}</Text>
            <View style={{ width: 10 }} />
            <Ionicons name="restaurant-outline" size={12} color="#64748B" />
            <Text style={styles.infoText}>{item.kapasitas_porsi} Porsi/Hari</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailBtn} onPress={() => Alert.alert("Detail Berkas", "Fitur melihat dokumen pendaftaran kantin.")}>
          <Text style={styles.detailBtnText}>Lihat Berkas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
          <Text style={styles.approveBtnText}>Setujui Kantin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
        <Image 
          source={require('../../../../assets/batik_cirebon.png')} 
          style={styles.batikOverlay} 
        />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>VERIFIKASI KANTIN</Text>
              <Text style={styles.headerSub}>Permintaan Pendaftaran Baru</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={pendingKantin}
            renderItem={renderKantinItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listPadding}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="store-search" size={60} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Tidak Ada Pendaftaran</Text>
                <Text style={styles.emptySub}>Semua pendaftaran kantin telah diproses atau belum ada yang mendaftar.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 180, backgroundColor: BLUE_PRIMARY, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginTop: 50, paddingHorizontal: 25 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  
  body: { flex: 1, marginTop: -30 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 },
  card: { backgroundColor: WHITE, borderRadius: 25, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  kantinName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  ownerText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoText: { fontSize: 11, color: '#64748B', marginLeft: 4 },
  
  cardFooter: { flexDirection: 'row', marginTop: 20, gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailBtn: { flex: 1, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  detailBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 13 },
  approveBtn: { flex: 1, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: BLUE_PRIMARY },
  approveBtnText: { color: WHITE, fontWeight: 'bold', fontSize: 13 },

  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 15 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 }
});
