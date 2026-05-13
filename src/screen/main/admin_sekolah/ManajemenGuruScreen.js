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
  Alert,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';

export default function ManajemenGuruScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listGuru, setListGuru] = useState([]);
  const [addGuruModal, setAddGuruModal] = useState(false);
  const [newGuru, setNewGuru] = useState({
    nip: '',
    nama: '',
    email: '',
    mata_pelajaran: '',
    kelas_wali: '',
    password: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchGuru();
  }, []);

  const fetchGuru = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      const sekolah_id = userData.sekolah_id;

      const response = await apiClient.get(`sekolah/sekolah_get_guru.php?sekolah_id=${sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setListGuru(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching guru:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGuru();
  };

  const handleAddGuru = async () => {
    if (!newGuru.nip || !newGuru.nama) {
      Alert.alert("Error", "NIP dan Nama wajib diisi");
      return;
    }
    
    setIsAdding(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = JSON.parse(userDataStr);
      
      const response = await apiClient.post('sekolah/sekolah_add_guru.php', {
        sekolah_id: userData.sekolah_id,
        nip: newGuru.nip,
        nama: newGuru.nama,
        email: newGuru.email,
        mata_pelajaran: newGuru.mata_pelajaran,
        kelas_wali: newGuru.kelas_wali,
        password: newGuru.password || 'guru123'
      });

      if (response.data.status === 'success') {
        Alert.alert("Berhasil", response.data.message);
        setAddGuruModal(false);
        setNewGuru({ nip: '', nama: '', email: '', mata_pelajaran: '', kelas_wali: '', password: '' });
        fetchGuru();
      } else {
        Alert.alert("Gagal", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Gagal menambah guru");
    } finally {
      setIsAdding(false);
    }
  };

  const renderGuru = ({ item, index }) => (
    <View style={styles.studentRow}>
      <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={[styles.avatarMini, { backgroundColor: '#EFF6FF' }]}>
        <Text style={[styles.avatarLetter, { color: '#2563EB' }]}>{item.nama.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.studentName}>{item.nama}</Text>
        <Text style={styles.studentNis}>NIP {item.nip} • {item.mata_pelajaran || '-'}</Text>
        {item.kelas_wali && <Text style={styles.waliText}>Wali Kelas: {item.kelas_wali}</Text>}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
        <Text style={[styles.statusText, { color: item.is_active ? '#16A34A' : '#EF4444' }]}>
          {item.is_active ? 'Aktif' : 'Non-Aktif'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.headerDashboard}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
        />
        <View style={styles.headerTopMinimal}>
          <TouchableOpacity style={styles.backBtnLight} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleLight}>Manajemen Guru</Text>
          <TouchableOpacity style={styles.backBtnLight} onPress={() => setAddGuruModal(true)}>
             <Feather name="user-plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <Ionicons name="people" size={14} color="#fff" />
            <Text style={styles.statChipText}>{listGuru.length} Guru Terdaftar</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={listGuru}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderGuru}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />
        }
        ListHeaderComponent={loading && !refreshing ? <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{marginTop: 50}} /> : null}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="user-tie" size={60} color="#E2E8F0" />
            <Text style={styles.emptyText}>Belum ada data guru</Text>
          </View>
        )}
      />

      {/* MODAL TAMBAH GURU */}
      <Modal visible={addGuruModal} transparent animationType="slide">
         <View style={styles.overlay}>
           <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
             <View style={styles.addModalContent}>
               <View style={styles.sheetHeader}>
                  <Text style={styles.pinTitle}>Tambah Guru Baru</Text>
                  <TouchableOpacity onPress={() => setAddGuruModal(false)}>
                     <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
                  </TouchableOpacity>
               </View>
               <Text style={styles.pinSubtitle}>Menambahkan guru ke sistem sekolah. Akun login akan dibuat otomatis menggunakan NIP.</Text>

               <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>NIP / Kode Guru</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="card-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Masukkan NIP" 
                             keyboardType="numeric"
                             value={newGuru.nip}
                             onChangeText={(v) => setNewGuru({...newGuru, nip: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Nama Lengkap & Gelar</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="person-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Nama Lengkap" 
                             value={newGuru.nama}
                             onChangeText={(v) => setNewGuru({...newGuru, nama: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Mata Pelajaran</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="book-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Cth: Matematika, B. Inggris" 
                             value={newGuru.mata_pelajaran}
                             onChangeText={(v) => setNewGuru({...newGuru, mata_pelajaran: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Wali Kelas (Opsional)</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="business-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Cth: 10-IPA-1" 
                             value={newGuru.kelas_wali}
                             onChangeText={(v) => setNewGuru({...newGuru, kelas_wali: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Alamat Email</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="email@guru.com" 
                             keyboardType="email-address"
                             autoCapitalize="none"
                             value={newGuru.email}
                             onChangeText={(v) => setNewGuru({...newGuru, email: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Password Login (Opsional)</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Default: guru123" 
                             secureTextEntry
                             value={newGuru.password}
                             onChangeText={(v) => setNewGuru({...newGuru, password: v})}
                          />
                      </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.pinSubmit, isAdding && { opacity: 0.7 }]} 
                    onPress={handleAddGuru}
                    disabled={isAdding}
                  >
                     {isAdding ? <ActivityIndicator color={WHITE} /> : (
                        <>
                           <Text style={styles.pinSubmitTxt}>Simpan Data Guru</Text>
                           <Ionicons name="save-outline" size={18} color={WHITE} />
                        </>
                     )}
                  </TouchableOpacity>
                  <View style={{ height: 40 }} />
               </ScrollView>
             </View>
           </KeyboardAvoidingView>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerDashboard: {
    backgroundColor: BLUE_PRIMARY,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    elevation: 8,
  },
  headerTopMinimal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtnLight: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitleLight: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerStats: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  statChipText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  listContent: { padding: 20, paddingBottom: 100 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  indexText: { fontSize: 12, fontWeight: 'bold', color: '#CBD5E1', width: 25 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontWeight: 'bold', fontSize: 16 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  studentNis: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  waliText: { fontSize: 11, color: GOLD, fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.4)', justifyContent: 'flex-end' },
  addModalContent: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pinTitle: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY },
  pinSubtitle: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18 },
  pinInputGroup: { marginBottom: 18 },
  pinInputLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  pinInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#f1f5f9' },
  pinInput: { flex: 1, marginLeft: 12, fontSize: 14, color: BLUE_PRIMARY, fontWeight: 'bold' },
  pinSubmit: { backgroundColor: BLUE_PRIMARY, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 10, elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 10 },
  pinSubmitTxt: { color: WHITE, fontSize: 15, fontWeight: 'bold' },
});
