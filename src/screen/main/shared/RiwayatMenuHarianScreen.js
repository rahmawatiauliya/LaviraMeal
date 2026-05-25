import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const ACCENT = '#3B82F6';

export default function RiwayatMenuHarianScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUserAndHistory();
  }, []);

  const loadUserAndHistory = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUser(parsed);
        fetchHistory(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHistory = async (currentUser) => {
    try {
      let url = '';
      if (currentUser.role === 'kantin') {
        // Get kantin_id first
        const profileRes = await apiClient.get(`kantin/get_kantin_profile.php?user_id=${currentUser.id}`);
        if (profileRes.data.status === 'success') {
          url = `kantin/get_my_menu_harian.php?kantin_id=${profileRes.data.data.id}`;
        }
      } else {
        url = 'admin/get_all_menu_harian.php';
        if (currentUser.role === 'sekolah') {
          url += `?sekolah_id=${currentUser.sekolah_id}`;
        }
      }

      if (url) {
        const response = await apiClient.get(url);
        if (response.data.status === 'success') {
          setHistory(response.data.data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndHistory();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Selesai</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoCol}>
          <Text style={styles.menuTitle}>{item.nama_menu}</Text>
          {user?.role !== 'kantin' && <Text style={styles.kantinLabel}>{item.nama_kantin}</Text>}
          <Text style={styles.descText} numberOfLines={2}>{item.deskripsi || 'Tidak ada deskripsi'}</Text>
        </View>
        {item.foto_menu && (
          <Image 
            source={{ uri: `${IMAGE_BASE_URL}${item.foto_menu}` }} 
            style={styles.thumb} 
          />
        )}
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.feedbackIndicator}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={item.feedback_sppg || item.feedback_sekolah ? ACCENT : '#94A3B8'} />
            <Text style={[styles.feedbackLabel, (item.feedback_sppg || item.feedback_sekolah) && { color: ACCENT }]}>
                {item.feedback_sppg || item.feedback_sekolah ? 'Ada Feedback' : 'Belum ada feedback'}
            </Text>
         </View>
         <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Menu Harian</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
              <Text style={styles.emptySub}>Postingan menu harian Anda akan muncul di sini.</Text>
            </View>
          )
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Detail Riwayat Menu</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {selectedItem && (
                    <FlatList
                        data={[1]}
                        renderItem={() => (
                            <View style={{ paddingBottom: 40 }}>
                                <Text style={styles.modalDate}>{new Date(selectedItem.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                                <Text style={styles.modalMenuName}>{selectedItem.nama_menu}</Text>
                                
                                {selectedItem.foto_menu && (
                                    <Image 
                                        source={{ uri: `${IMAGE_BASE_URL}${selectedItem.foto_menu}` }} 
                                        style={styles.modalImg}
                                        resizeMode="cover"
                                    />
                                )}

                                <Text style={styles.sectionTitle}>Deskripsi</Text>
                                <Text style={styles.modalDesc}>{selectedItem.deskripsi || '-'}</Text>

                                <Text style={styles.sectionTitle}>Ulasan & Masukan</Text>
                                <View style={styles.feedbackBox}>
                                    <Text style={styles.fbLabel}>Feedback SPPG:</Text>
                                    <Text style={styles.fbText}>{selectedItem.feedback_sppg || 'Belum ada masukan dari SPPG.'}</Text>
                                    
                                    <View style={{ height: 15 }} />
                                    
                                    <Text style={styles.fbLabel}>Feedback Sekolah:</Text>
                                    <Text style={styles.fbText}>{selectedItem.feedback_sekolah || 'Belum ada masukan dari Sekolah.'}</Text>
                                </View>
                            </View>
                        )}
                        keyExtractor={() => "1"}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: WHITE, elevation: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  listPadding: { padding: 20 },
  card: { backgroundColor: WHITE, borderRadius: 25, padding: 18, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 11, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  badge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: '#10B981' },
  cardBody: { flexDirection: 'row', marginBottom: 15 },
  infoCol: { flex: 1, marginRight: 15 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  kantinLabel: { fontSize: 12, color: ACCENT, fontWeight: '700', marginBottom: 4 },
  descText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  thumb: { width: 70, height: 70, borderRadius: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  feedbackIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 15 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  modalDate: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },
  modalMenuName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 5, marginBottom: 20 },
  modalImg: { width: '100%', height: 250, borderRadius: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY, marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },
  modalDesc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 20 },
  feedbackBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  fbLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 5, textTransform: 'uppercase' },
  fbText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
});
