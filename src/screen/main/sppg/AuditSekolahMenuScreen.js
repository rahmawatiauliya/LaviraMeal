import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Modal,
  TextInput,
  useWindowDimensions
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function AuditSekolahMenuScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { sekolah } = route.params || { sekolah: { nama: 'Sekolah' } };
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for canteens and their posts
  const [canteens, setCanteens] = useState([
    {
      id: 101,
      nama: 'Kantin Sehat 1',
      menu: 'Nasi Kuning Complete',
      foto: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      deskripsi: 'Menu pagi hari ini: Nasi kuning, telur balado, orek tempe, mentimun, dan susu kotak.',
      status: 'Pending',
      petugas: 'Siti Aminah'
    },
    {
      id: 102,
      nama: 'Dapur Juara',
      menu: 'Soto Ayam Lamongan',
      foto: 'https://images.unsplash.com/photo-1599481238640-4c1288750d7a?w=500',
      deskripsi: 'Menu siang: Soto ayam dengan kuah kental, koya, telur rebus, dan buah pisang.',
      status: 'Pending',
      petugas: 'Budi Santoso'
    }
  ]);

  const handleAction = (status) => {
    if (status === 'Rejected' && !rejectReason) {
      setRejectModal(true);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setCanteens(prev => prev.map(c => 
        c.id === selectedCanteen.id ? { ...c, status, alasan: rejectReason } : c
      ));
      setLoading(false);
      setRejectModal(false);
      setRejectReason('');
      setSelectedCanteen(null);
      Alert.alert("Audit Selesai", `Menu dari ${selectedCanteen.nama} telah ${status === 'Approved' ? 'disetujui' : 'ditolak'}.`);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
         <ImageBackground source={require('../../../../assets/batik_cirebon.png')} style={styles.headerBg} imageStyle={styles.batikImage}>
            <SafeAreaView style={{ flex: 1 }}>
               <View style={styles.headerTop}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                     <Ionicons name="chevron-back" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <View style={styles.headerText}>
                     <Text style={styles.hTitle}>Audit Menu Harian</Text>
                     <Text style={styles.hSub}>{sekolah.nama}</Text>
                  </View>
               </View>
            </SafeAreaView>
         </ImageBackground>
      </View>

      <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 100 }}>
         {canteens.map((kantin, i) => (
            <View key={i} style={styles.canteenCard}>
               <Image source={{ uri: kantin.foto }} style={styles.menuImg} />
               <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                     <View>
                        <Text style={styles.canteenName}>{kantin.nama}</Text>
                        <Text style={styles.menuName}>{kantin.menu}</Text>
                     </View>
                     <View style={[styles.statusBadge, { backgroundColor: kantin.status === 'Approved' ? '#f0fdf4' : (kantin.status === 'Rejected' ? '#fef2f2' : '#fff7ed') }]}>
                        <Text style={[styles.statusBadgeTxt, { color: kantin.status === 'Approved' ? '#10b981' : (kantin.status === 'Rejected' ? '#ef4444' : '#f59e0b') }]}>
                           {kantin.status === 'Pending' ? 'Perlu Audit' : kantin.status}
                        </Text>
                     </View>
                  </View>
                  
                  <Text style={styles.descTxt} numberOfLines={2}>{kantin.deskripsi}</Text>
                  
                  <View style={styles.cardFooter}>
                     <View style={styles.petugasRow}>
                        <Feather name="user" size={12} color="#94a3b8" />
                        <Text style={styles.petugasTxt}>{kantin.petugas}</Text>
                     </View>
                     <TouchableOpacity style={styles.auditBtn} onPress={() => setSelectedCanteen(kantin)}>
                        <Text style={styles.auditBtnTxt}>Periksa Detail</Text>
                        <Feather name="external-link" size={14} color={WHITE} />
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         ))}
      </ScrollView>

      {/* DETAIL AUDIT MODAL */}
      <Modal visible={!!selectedCanteen} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.detailContainer}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detail Menu Harian</Text>
                  <TouchableOpacity onPress={() => setSelectedCanteen(null)}>
                     <Feather name="x" size={24} color={BLUE_PRIMARY} />
                  </TouchableOpacity>
               </View>

               <ScrollView>
                  <Image source={{ uri: selectedCanteen?.foto }} style={styles.modalHeroImg} />
                  <View style={styles.modalBody}>
                     <Text style={styles.modalCanteen}>{selectedCanteen?.nama}</Text>
                     <Text style={styles.modalMenu}>{selectedCanteen?.menu}</Text>
                     <View style={styles.divider} />
                     <Text style={styles.modalLabel}>Keterangan Menu:</Text>
                     <Text style={styles.modalDesc}>{selectedCanteen?.deskripsi}</Text>
                  </View>
               </ScrollView>

               <View style={styles.actionRow}>
                  <TouchableOpacity 
                     style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} 
                     onPress={() => setRejectModal(true)}
                  >
                     <Feather name="x-circle" size={20} color="#ef4444" />
                     <Text style={[styles.actionBtnTxt, { color: '#ef4444' }]}>Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                     style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} 
                     onPress={() => handleAction('Approved')}
                  >
                     <Feather name="check-circle" size={20} color="#10b981" />
                     <Text style={[styles.actionBtnTxt, { color: '#10b981' }]}>Setujui</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {/* REJECTION REASON MODAL */}
      <Modal visible={rejectModal} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <View style={styles.reasonContainer}>
               <Text style={styles.reasonTitle}>Alasan Penolakan</Text>
               <Text style={styles.reasonSub}>Berikan alasan mengapa menu ini tidak disetujui agar kantin dapat memperbaikinya.</Text>
               
               <TextInput 
                  style={styles.reasonInput}
                  placeholder="Contoh: Foto kurang jelas / Menu tidak sesuai standar..."
                  multiline
                  numberOfLines={4}
                  value={rejectReason}
                  onChangeText={setRejectReason}
               />

               <View style={styles.reasonActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModal(false)}>
                     <Text style={styles.cancelTxt}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                     style={styles.submitBtn} 
                     onPress={() => handleAction('Rejected')}
                  >
                     {loading ? <ActivityIndicator color={WHITE} size="small" /> : <Text style={styles.submitTxt}>Kirim Audit</Text>}
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { height: 180, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', elevation: 20 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25 },
  batikImage: { opacity: 0.3, resizeMode: 'cover', tintColor: 'rgba(255,255,255,0.3)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginTop: 45 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  headerText: { marginLeft: 15 },
  hTitle: { color: WHITE, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  hSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' },
  canteenCard: { backgroundColor: WHITE, borderRadius: 30, overflow: 'hidden', marginBottom: 20, elevation: 5 },
  menuImg: { width: '100%', height: 180 },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  canteenName: { fontSize: 12, fontWeight: 'bold', color: BLUE_ACCENT, textTransform: 'uppercase' },
  menuName: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeTxt: { fontSize: 9, fontWeight: '900' },
  descTxt: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  petugasRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  petugasTxt: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  auditBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  auditBtnTxt: { color: WHITE, fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11,30,63,0.8)', justifyContent: 'flex-end' },
  detailContainer: { backgroundColor: WHITE, height: '85%', borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
  modalHeroImg: { width: '100%', height: 300 },
  modalBody: { padding: 25 },
  modalCanteen: { fontSize: 14, fontWeight: 'bold', color: BLUE_ACCENT, textTransform: 'uppercase' },
  modalMenu: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  modalLabel: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 },
  modalDesc: { fontSize: 15, color: '#475569', lineHeight: 22 },
  actionRow: { flexDirection: 'row', padding: 20, gap: 15, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flex: 1, height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  actionBtnTxt: { fontSize: 16, fontWeight: '900' },
  reasonContainer: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  reasonTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY, marginBottom: 10 },
  reasonSub: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  reasonInput: { backgroundColor: '#f8fafc', borderRadius: 15, padding: 15, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', textAlignVertical: 'top' },
  reasonActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelTxt: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
  submitBtn: { flex: 2, height: 54, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: BLUE_PRIMARY },
  submitTxt: { fontSize: 14, fontWeight: 'bold', color: WHITE }
});
