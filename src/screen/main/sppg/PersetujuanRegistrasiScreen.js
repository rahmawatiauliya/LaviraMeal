import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function PersetujuanRegistrasiScreen({ navigation }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('sppg/get_pending_kantin.php');
      if (response.data.status === 'success') {
        setPendingUsers(response.data.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal mengambil data pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleAction = async (action) => {
    if (!selectedUser) return;
    
    Alert.alert(
      action === 'approved' ? 'Konfirmasi ACC' : 'Konfirmasi Tolak',
      `${action === 'approved' ? 'Setujui' : 'Tolak'} pendaftaran kantin ${selectedUser.nama_kantin}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action === 'approved' ? 'Setujui' : 'Tolak',
          onPress: async () => {
            try {
              setActionLoading(selectedUser.user_id);
              const response = await apiClient.post('sppg/approve_kantin.php', {
                user_id: selectedUser.user_id,
                action: action,
                notes: reviewNote
              });
              if (response.data.status === 'success') {
                Alert.alert('Sukses', response.data.message);
                setModalVisible(false);
                setReviewNote('');
                fetchPendingUsers();
              } else {
                Alert.alert('Gagal', response.data.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal memproses pendaftaran');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const openDetail = (item) => {
    setSelectedUser(item);
    setReviewNote('');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.nama || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama}</Text>
          <Text style={styles.userRole}>Calon Pengelola Kantin</Text>
        </View>
        <View style={styles.badgePending}>
          <Text style={styles.badgeText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="user" size={14} color="#64748b" />
          <Text style={styles.infoText}>Username: {item.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="mail" size={14} color="#64748b" />
          <Text style={styles.infoText}>Email: {item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="calendar" size={14} color="#64748b" />
          <Text style={styles.infoText}>Tgl Daftar: {item.created_at}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.approveBtn}
        onPress={() => openDetail(item)}
      >
        <Feather name="eye" size={18} color={WHITE} />
        <Text style={styles.approveBtnTxt}>Lihat Detail & Proses</Text>
      </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Detail Pendaftaran</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
            {selectedUser && (
              <>
                <Text style={styles.sectionLabel}>Data Pengelola</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}><Text style={styles.bold}>Pemilik:</Text> {selectedUser.pemilik}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Email:</Text> {selectedUser.email}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Username:</Text> {selectedUser.username}</Text>
                </View>

                <Text style={styles.sectionLabel}>Data Kantin</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}><Text style={styles.bold}>Nama Kantin:</Text> {selectedUser.nama_kantin}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>NPSN Sekolah:</Text> {selectedUser.npsn_sekolah}</Text>
                  <Text style={styles.detailText}><Text style={styles.bold}>Status Sekolah:</Text> {selectedUser.status_sekolah.toUpperCase()}</Text>
                </View>

                <Text style={styles.sectionLabel}>Foto Kantin</Text>
                {selectedUser.foto_kantin ? (
                  <Image 
                    source={{ uri: `http://192.168.1.9/project_lavirameal/${selectedUser.foto_kantin}` }} 
                    style={styles.previewImg} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImg}><Text>Tidak ada foto</Text></View>
                )}

                <Text style={styles.sectionLabel}>Foto Menu</Text>
                {selectedUser.foto_menu ? (
                  <Image 
                    source={{ uri: `http://192.168.1.9/project_lavirameal/${selectedUser.foto_menu}` }} 
                    style={styles.previewImg} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImg}><Text>Tidak ada foto</Text></View>
                )}

                <Text style={styles.sectionLabel}>Ulasan/Catatan Verifikasi</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Berikan alasan setuju atau tolak..."
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Persetujuan Registrasi</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE_PRIMARY} />
          <Text style={styles.loadingTxt}>Memuat data...</Text>
        </View>
      ) : pendingUsers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Tidak Ada Antrean</Text>
          <Text style={styles.emptySub}>Semua pendaftaran kantin sudah diproses.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingUsers}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: WHITE,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  listContent: { padding: 20, paddingBottom: 50 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badgePending: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#c2410c' },
  cardBody: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 15,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 10 },
  approveBtn: {
    backgroundColor: BLUE_PRIMARY,
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  approveBtnTxt: { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: '500' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
  modalBody: { flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
  detailBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, gap: 5 },
  detailText: { fontSize: 14, color: '#1e293b' },
  bold: { fontWeight: 'bold' },
  previewImg: { width: '100%', height: 200, borderRadius: 15, marginTop: 5 },
  noImg: { width: '100%', height: 100, backgroundColor: '#f1f5f9', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  noteInput: { backgroundColor: '#f1f5f9', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginTop: 5 },
  modalFooter: { flexDirection: 'row', gap: 15, marginTop: 20, paddingBottom: 20 },
  actionBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: '#ef4444' },
  approveFinalBtn: { backgroundColor: '#10b981' },
  actionBtnTxt: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
});
