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
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const SUCCESS = '#10B981';

export default function KantinApprovalScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingKantin, setPendingKantin] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKantin, setSelectedKantin] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAction = async (action) => {
    if (!selectedKantin) return;

    Alert.alert(
      action === 'approved' ? 'Konfirmasi Setuju' : 'Konfirmasi Tolak',
      `Apakah Anda yakin ingin ${action === 'approved' ? 'menyetujui' : 'menolak'} ${selectedKantin.nama_kantin}?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: action === 'approved' ? 'Setujui' : 'Tolak', 
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiClient.post('sekolah/sekolah_approve_kantin.php', {
                kantin_id: selectedKantin.id,
                user_id: selectedKantin.user_id,
                action: action,
                notes: reviewNote
              });
              
              if (response.data.status === 'success') {
                Alert.alert("Berhasil", response.data.message);
                setModalVisible(false);
                setReviewNote('');
                fetchPendingKantin();
              } else {
                Alert.alert("Gagal", response.data.message || "Terjadi kesalahan.");
              }
            } catch (err) {
              Alert.alert("Error", "Gagal memproses pendaftaran.");
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const openDetail = (kantin) => {
    setSelectedKantin(kantin);
    setReviewNote('');
    setModalVisible(true);
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
        <TouchableOpacity style={styles.detailBtn} onPress={() => openDetail(item)}>
          <Text style={styles.detailBtnText}>Lihat Detail & Berkas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => openDetail(item)}>
          <Text style={styles.approveBtnText}>Proses</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Verifikasi Berkas Kantin</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
            {selectedKantin && (
              <>
                <Text style={styles.sectionLabel}>Identitas Kantin</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}><Text style={styles.bold}>Nama:</Text> {selectedKantin.nama_kantin}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Pemilik:</Text> {selectedKantin.pemilik}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>WhatsApp:</Text> {selectedKantin.no_telp || '-'}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Kapasitas:</Text> {selectedKantin.kapasitas_porsi} Porsi/Hari</Text>
                </View>

                <Text style={styles.sectionLabel}>Status Verifikasi</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}><Text style={styles.bold}>Status SPPG:</Text> {selectedKantin.status_sppg.toUpperCase()}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Status Sekolah:</Text> {selectedKantin.status_sekolah.toUpperCase()}</Text>
                </View>

                <Text style={styles.sectionLabel}>Foto Bangunan/Kantin</Text>
                {selectedKantin.foto_kantin ? (
                  <Image 
                    source={{ uri: `${IMAGE_BASE_URL}${selectedKantin.foto_kantin}` }} 
                    style={styles.previewImg} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImg}><Text>Tidak ada foto kantin</Text></View>
                )}

                <Text style={styles.sectionLabel}>Foto Daftar Menu</Text>
                {selectedKantin.foto_menu ? (
                  <Image 
                    source={{ uri: `${IMAGE_BASE_URL}${selectedKantin.foto_menu}` }} 
                    style={styles.previewImg} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImg}><Text>Tidak ada foto menu</Text></View>
                )}

                <Text style={styles.sectionLabel}>Catatan Review (Opsional)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Contoh: Lokasi kurang bersih atau Menu kurang bervariasi..."
                  multiline
                  value={reviewNote}
                  onChangeText={setReviewNote}
                />
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => handleAction('rejected')}
              disabled={!!actionLoading}
            >
              <Text style={styles.actionBtnTxt}>Tolak</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.approveFinalBtn]} 
              onPress={() => handleAction('approved')}
              disabled={!!actionLoading}
            >
              {actionLoading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.actionBtnTxt}>Setujui (ACC)</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      {renderModal()}
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
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  modalBody: { flex: 1 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  detailBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, gap: 5 },
  detailText: { fontSize: 14, color: '#1e293b' },
  bold: { fontWeight: 'bold' },
  previewImg: { width: '100%', height: 220, borderRadius: 15, marginTop: 5 },
  noImg: { width: '100%', height: 100, backgroundColor: '#f1f5f9', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  noteInput: { backgroundColor: '#f1f5f9', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginTop: 10, marginBottom: 20 },
  modalFooter: { flexDirection: 'row', gap: 15, marginTop: 10, paddingBottom: 20 },
  actionBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: '#ef4444' },
  approveFinalBtn: { backgroundColor: SUCCESS },
  actionBtnTxt: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
});
