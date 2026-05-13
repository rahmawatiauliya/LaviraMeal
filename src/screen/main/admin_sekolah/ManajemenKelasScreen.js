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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';

export default function ManajemenKelasScreen({ navigation }) {
  const [viewMode, setViewMode] = useState('tingkat'); // tingkat, kelas, siswa
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allData, setAllData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTingkat, setSelectedTingkat] = useState('10');
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [filteredKelas, setFilteredKelas] = useState([]);
  const [listSiswa, setListSiswa] = useState([]);
  const [quickActionModal, setQuickActionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedKelasTransfer, setSelectedKelasTransfer] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [kodeUndangan, setKodeUndangan] = useState('v4v79a');

  // NEW: Tambah Siswa Form State
  const [addSiswaModal, setAddSiswaModal] = useState(false);
  const [newSiswa, setNewSiswa] = useState({
    nis: '',
    nama: '',
    email: '',
    password: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchKelas();
  }, []);

  const fetchKelas = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      const sekolah_id = userData.sekolah_id;

      const response = await apiClient.get(`sekolah/sekolah_get_kelas.php?sekolah_id=${sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        const rawData = response.data.data;
        setAllData(rawData);

        const grouped = rawData.reduce((acc, item) => {
          const tingkatMatch = item.kelas.match(/^\d+/);
          const t = tingkatMatch ? tingkatMatch[0] : 'Lainnya';

          if (!acc[t]) {
            acc[t] = {
              tingkat: t,
              jumlah_kelas: 0,
              total_siswa: 0,
              type: t <= 6 ? 'SD' : (t <= 9 ? 'SMP' : 'SMA')
            };
          }
          acc[t].jumlah_kelas += 1;
          acc[t].total_siswa += parseInt(item.jumlah_siswa);
          return acc;
        }, {});

        setCategories(Object.values(grouped).sort((a, b) => a.tingkat - b.tingkat));
        
        // Auto select first tingkat if not set
        if (Object.keys(grouped).length > 0) {
           const firstT = Object.values(grouped).sort((a, b) => a.tingkat - b.tingkat)[0].tingkat;
           setSelectedTingkat(firstT);
        }

        // Fetch Kode Undangan from stats
        const statsResp = await apiClient.get(`sekolah/sekolah_get_stats.php?sekolah_id=${sekolah_id}`);
        if (statsResp.data.status === 'success') {
          setKodeUndangan(statsResp.data.data.kode_undangan || '-');
        }
      }
    } catch (error) {
      console.error("Error fetching kelas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKelas();
  };

  const handleSelectTingkat = (tingkat) => {
    setSelectedTingkat(tingkat);
    const matchKelas = allData.filter(item => item.kelas.startsWith(tingkat));
    setFilteredKelas(matchKelas);
    setViewMode('kelas');
  };

  const handleSelectKelas = async (namaKelas) => {
    setSelectedKelas(namaKelas);
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      const sekolah_id = userData.sekolah_id;

      const response = await apiClient.get(`sekolah/sekolah_get_siswa.php?sekolah_id=${sekolah_id}&kelas=${namaKelas}`);
      if (response.data && response.data.status === 'success') {
        setListSiswa(response.data.data);
        setViewMode('siswa');
      }
    } catch (error) {
      console.error("Error fetching siswa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySiswa = async (siswaId, nama) => {
    Alert.alert(
      "Verifikasi Siswa",
      `Setujui data siswa ${nama}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui",
          onPress: async () => {
            try {
              const userDataStr = await AsyncStorage.getItem('user_data');
              const userData = JSON.parse(userDataStr);
              const response = await apiClient.post('sekolah/sekolah_verify_siswa.php', {
                sekolah_id: userData.sekolah_id,
                siswa_id: siswaId
              });
              if (response.data.status === 'success') {
                Alert.alert("Sukses", response.data.message);
                handleSelectKelas(selectedKelas);
              }
            } catch (error) {
              Alert.alert("Error", "Gagal verifikasi");
            }
          }
        }
      ]
    );
  };

  const handleVerifyKelas = async () => {
    Alert.alert(
      "Verifikasi Kelas",
      `Verifikasi dan aktifkan seluruh siswa di kelas ${selectedKelas}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui Semua",
          onPress: async () => {
            try {
              const userDataStr = await AsyncStorage.getItem('user_data');
              const userData = JSON.parse(userDataStr);
              const response = await apiClient.post('sekolah/sekolah_verify_siswa.php', {
                sekolah_id: userData.sekolah_id,
                kelas: selectedKelas
              });
              if (response.data.status === 'success') {
                Alert.alert("Sukses", response.data.message);
                handleSelectKelas(selectedKelas);
              }
            } catch (error) {
              Alert.alert("Error", "Gagal verifikasi kelas");
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (viewMode === 'siswa') setViewMode('tingkat');
    else navigation.goBack();
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = JSON.parse(userDataStr);
      const sekolah_id = userData.sekolah_id;

      const formData = new FormData();
      formData.append('sekolah_id', sekolah_id);
      
      if (Platform.OS === 'web') {
        const rawFile = file.file || file.output?.item(0) || file;
        formData.append('file', rawFile);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'text/csv',
        });
      }

      const response = await apiClient.post(`sekolah/sekolah_import_siswa.php?sekolah_id=${sekolah_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        if (Platform.OS === 'web') alert('Berhasil: ' + response.data.message);
        else Alert.alert('Berhasil', response.data.message);
        fetchKelas(); 
      } else {
        if (Platform.OS === 'web') alert('Gagal: ' + response.data.message);
        else Alert.alert('Gagal', response.data.message);
      }
    } catch (error) {
      const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
      if (Platform.OS === 'web') alert('Error: ' + errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = "nis,nama,kelas,jenis_kelamin,tanggal_lahir,nama_wali,no_telp_wali\n12345,Contoh Nama Siswa,10-IPA-1,L,2010-01-01,Nama Orang Tua,08123456789";
      const fileName = "template_siswa_lavira.csv";
      if (Platform.OS === 'web') {
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, template, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      if (Platform.OS === 'web') alert('Gagal mengunduh template');
      else Alert.alert('Error', 'Gagal membuat template.');
    }
  };

   const handleExportStudents = async () => {
    // ... existing logic ...
   };

   const handleAddSiswa = async () => {
      if (!newSiswa.nis || !newSiswa.nama) {
        Alert.alert("Error", "NIS dan Nama wajib diisi");
        return;
      }
      
      setIsAdding(true);
      try {
        const userDataStr = await AsyncStorage.getItem('user_data');
        const userData = JSON.parse(userDataStr);
        
        const response = await apiClient.post('sekolah/sekolah_add_siswa.php', {
          sekolah_id: userData.sekolah_id,
          nis: newSiswa.nis,
          nama: newSiswa.nama,
          email: newSiswa.email,
          kelas: selectedKelas, 
          password: newSiswa.password || 'siswa123'
        });

        if (response.data.status === 'success') {
          Alert.alert("Berhasil", response.data.message);
          setAddSiswaModal(false);
          setNewSiswa({ nis: '', nama: '', email: '', password: '' });
          handleSelectKelas(selectedKelas); // Refresh list
        } else {
          Alert.alert("Gagal", response.data.message);
        }
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Gagal menambah siswa");
      } finally {
        setIsAdding(false);
      }
   };

   const handleTransferDanaKelas = async () => {
      if (!selectedKelasTransfer || !transferAmount) {
        Alert.alert("Error", "Mohon pilih kelas dan isi nominal transfer");
        return;
      }
      
      setIsTransferring(true);
      try {
        const userDataStr = await AsyncStorage.getItem('user_data');
        const userData = JSON.parse(userDataStr);
        
        const response = await apiClient.post('sekolah/sekolah_transfer_dana_kelas.php', {
          sekolah_id: userData.sekolah_id,
          kelas: selectedKelasTransfer,
          amount: parseInt(transferAmount)
        });

        if (response.data.status === 'success') {
          Alert.alert("Berhasil", response.data.message);
          setShowTransferModal(false);
          setTransferAmount('');
          setSelectedKelasTransfer('');
          fetchKelas(); 
        }
      } catch (error) {
        Alert.alert("Gagal", error.response?.data?.message || "Gagal melakukan transfer dana kelas.");
      } finally {
        setIsTransferring(false);
      }
   };


  const getMajorInfo = (namaKelas) => {
    const name = namaKelas.toUpperCase();
    if (name.includes('IPA')) return { label: 'IPA', color: '#3B82F6', bg: '#EFF6FF' };
    if (name.includes('IPS')) return { label: 'IPS', color: '#10B981', bg: '#ECFDF5' };
    if (name.includes('TKJ')) return { label: 'TKJ', color: '#8B5CF6', bg: '#F5F3FF' };
    if (name.includes('AKL') || name.includes('AKUNTANSI')) return { label: 'AKL', color: '#F59E0B', bg: '#FFFBEB' };
    if (name.includes('BDP') || name.includes('PEMASARAN')) return { label: 'BDP', color: '#EC4899', bg: '#FDF2F8' };
    return { label: 'UMUM', color: '#64748B', bg: '#F1F5F9' };
  };

  const renderClassItem = ({ item }) => {
    const major = getMajorInfo(item.kelas);
    const roomNumber = `R.${Math.floor(Math.random() * 10) + 101}`; // Dummy room for UI aesthetics

    return (
      <TouchableOpacity style={styles.newClassCard} onPress={() => handleSelectKelas(item.kelas)}>
        <View style={styles.classCardContent}>
          <View style={styles.classInfoMain}>
            <Text style={styles.newClassTitle}>{item.kelas}</Text>
            <View style={styles.classMetaRow}>
              <Text style={styles.classMetaText}>{item.jumlah_siswa} siswa</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.classMetaText}>{roomNumber}</Text>
            </View>
          </View>
          
          <View style={styles.classActionArea}>
            <View style={[styles.majorBadge, { backgroundColor: major.bg }]}>
              <Text style={[styles.majorBadgeText, { color: major.color }]}>{major.label}</Text>
            </View>
            <Ionicons name="caret-down" size={16} color="#64748B" style={{ marginTop: 8 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSiswa = ({ item, index }) => (
    <View style={styles.studentRow}>
      <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarLetter}>{item.nama.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.studentName}>{item.nama}</Text>
        <Text style={styles.studentNis}>
          NIS {item.nis} • 
          <Text style={{ color: item.aktif ? '#16A34A' : '#EF4444', fontWeight: 'bold' }}>
            {item.aktif ? ' Terverifikasi' : ' Menunggu Verifikasi'}
          </Text>
        </Text>
      </View>
      {!item.aktif && (
        <TouchableOpacity 
          style={styles.verifyBtnMini} 
          onPress={() => handleVerifySiswa(item.id, item.nama)}
        >
          <Text style={styles.verifyBtnTxt}>ACC</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeaderActions = () => {
     if (viewMode === 'siswa') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           {listSiswa.some(s => !s.aktif) && (
             <TouchableOpacity style={[styles.verifyBtnMass, { marginRight: 8 }]} onPress={handleVerifyKelas}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.verifyMassTxt}>Verifikasi Kelas</Text>
             </TouchableOpacity>
           )}
           <TouchableOpacity style={[styles.backBtnLight, { marginRight: 8 }]} onPress={() => setAddSiswaModal(true)}>
             <Feather name="user-plus" size={20} color="#fff" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.backBtnLight} onPress={handleExportStudents}>
             <Feather name="download" size={20} color="#fff" />
           </TouchableOpacity>
        </View>
      );
    }
    if (viewMode === 'tingkat') {
      return (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[styles.backBtnLight, { marginRight: 8 }]} onPress={handleDownloadTemplate}>
            <Feather name="info" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtnLight} onPress={handleImport}>
            <Feather name="upload" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    return <View style={{ width: 40 }} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* MINIMALIST HEADER */}
      <View style={styles.headerDashboard}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
        />
        <View style={styles.headerTopMinimal}>
          <TouchableOpacity style={styles.backBtnLight} onPress={handleBack}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleLight}>Manajemen Kelas</Text>
          {renderHeaderActions()}
        </View>

        {viewMode === 'tingkat' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.tabContainer}
          >
            {categories.map((cat, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.tabItem, selectedTingkat === cat.tingkat && styles.tabItemActive]}
                onPress={() => setSelectedTingkat(cat.tingkat)}
              >
                <Text style={[styles.tabText, selectedTingkat === cat.tingkat && styles.tabTextActive]}>
                  Kelas {cat.tingkat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {viewMode === 'siswa' && (
          <View style={styles.headerStats}>
            <View style={styles.statChip}>
              <Ionicons name="person" size={14} color="#fff" />
              <Text style={styles.statChipText}>{listSiswa.length} Siswa di {selectedKelas}</Text>
            </View>
            {listSiswa.length > 0 && listSiswa[0].nama_guru && (
              <View style={[styles.statChip, { backgroundColor: GOLD + '90' }]}>
                <Ionicons name="school" size={14} color="#fff" />
                <Text style={styles.statChipText}>Wali: {listSiswa[0].nama_guru}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {viewMode === 'tingkat' && (
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Siswa</Text>
            <Text style={styles.summaryValue}>
              {categories.find(c => c.tingkat === selectedTingkat)?.total_siswa || 0}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jumlah Kelas</Text>
            <Text style={styles.summaryValue}>
              {categories.find(c => c.tingkat === selectedTingkat)?.jumlah_kelas || 0}
            </Text>
          </View>
        </View>
      )}

      {viewMode === 'tingkat' && (
        <View style={styles.inviteCard}>
          <View style={styles.inviteInfo}>
            <Text style={styles.inviteLabel}>KODE UNDANGAN PENDAFTARAN GURU</Text>
            <Text style={styles.inviteCode}>{kodeUndangan}</Text>
            <Text style={styles.inviteDesc}>Berikan kode ini kepada Guru saat mereka melakukan registrasi akun baru.</Text>
          </View>
          <TouchableOpacity 
            style={styles.copyBtn} 
            onPress={() => {
              Alert.alert("Berhasil", "Kode undangan disalin ke papan klip.");
            }}
          >
            <Ionicons name="copy-outline" size={20} color={GOLD} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={viewMode === 'tingkat' ? allData.filter(i => i.kelas.startsWith(selectedTingkat)) : listSiswa}
        keyExtractor={(item, index) => index.toString()}
        renderItem={viewMode === 'tingkat' ? renderClassItem : renderSiswa}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />
        }
        ListHeaderComponent={loading && !refreshing ? <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{marginTop: 50}} /> : null}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={60} color="#E2E8F0" />
            <Text style={styles.emptyText}>Data Tidak Ditemukan</Text>
          </View>
        )}
      />


      {/* CONSISTENT BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSekolah')}>
          <Ionicons name="home-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Beranda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ManajemenKelas')}>
          <Ionicons name="layers" size={24} color={BLUE_PRIMARY} />
          <Text style={[styles.navLabel, { color: BLUE_PRIMARY, fontWeight: '800' }]}>Kelas</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LaporanSekolah')}>
          <Ionicons name="bar-chart-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Laporan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>

      {/* QUICK ACTION MODAL */}
      <Modal visible={quickActionModal} transparent animationType="fade">
         <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setQuickActionModal(false)}>
            <View style={styles.actionSheet}>
               <Text style={styles.sheetTitle}>Portal Administratif</Text>
               <View style={styles.sheetGrid}>
                  {[
                    { label: 'Transfer', icon: 'send-outline', color: '#4f46e5', press: () => { setQuickActionModal(false); setShowTransferModal(true); } },
                    { label: 'Guru', icon: 'school-outline', color: '#6366f1', press: () => { navigation.navigate('ManajemenGuru'); setQuickActionModal(false); } },
                    { label: 'Beranda', icon: 'home-outline', color: '#10b981', press: () => { navigation.navigate('HomeSekolah'); setQuickActionModal(false); } },
                    { label: 'Report', icon: 'stats-chart-outline', color: '#f59e0b', press: () => { navigation.navigate('LaporanSekolah'); setQuickActionModal(false); } },
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

       {/* MODAL TAMBAH SISWA */}
       <Modal visible={addSiswaModal} transparent animationType="slide">
         <View style={styles.overlay}>
           <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
             <View style={styles.addModalContent}>
               <View style={styles.sheetHeader}>
                  <Text style={styles.pinTitle}>Tambah Siswa Baru</Text>
                  <TouchableOpacity onPress={() => setAddSiswaModal(false)}>
                     <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
                  </TouchableOpacity>
               </View>
               <Text style={styles.pinSubtitle}>Menambahkan siswa ke kelas {selectedKelas}. Akun login akan dibuat otomatis.</Text>

               <ScrollView style={{ marginTop: 20 }}>
                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Nomor Induk Siswa (NIS)</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="card-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Contoh: 2024001" 
                             keyboardType="numeric"
                             value={newSiswa.nis}
                             onChangeText={(v) => setNewSiswa({...newSiswa, nis: v})}
                          />
                      </View>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>* NIS akan digunakan sebagai Username login siswa.</Text>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Nama Lengkap Siswa</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="person-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Nama Lengkap" 
                             value={newSiswa.nama}
                             onChangeText={(v) => setNewSiswa({...newSiswa, nama: v})}
                          />
                      </View>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Alamat Email</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="email@pelajar.com" 
                             keyboardType="email-address"
                             autoCapitalize="none"
                             value={newSiswa.email}
                             onChangeText={(v) => setNewSiswa({...newSiswa, email: v})}
                          />
                      </View>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>* Digunakan untuk pemulihan kata sandi (Forgot Password).</Text>
                  </View>

                  <View style={styles.pinInputGroup}>
                      <Text style={styles.pinInputLabel}>Password Login (Opsional)</Text>
                      <View style={styles.pinInputWrap}>
                          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                          <TextInput 
                             style={styles.pinInput} 
                             placeholder="Default: siswa123" 
                             secureTextEntry
                             value={newSiswa.password}
                             onChangeText={(v) => setNewSiswa({...newSiswa, password: v})}
                          />
                      </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.pinSubmit, isAdding && { opacity: 0.7 }]} 
                    onPress={handleAddSiswa}
                    disabled={isAdding}
                  >
                     {isAdding ? <ActivityIndicator color={WHITE} /> : (
                        <>
                           <Text style={styles.pinSubmitTxt}>Simpan Data Siswa</Text>
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

        {/* TRANSFER DANA KELAS MODAL */}
        <Modal visible={showTransferModal} transparent animationType="slide">
          <View style={styles.overlay}>
            <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
              <View style={styles.addModalContent}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.pinTitle}>Transfer Dana Kelas</Text>
                  <TouchableOpacity onPress={() => { setShowTransferModal(false); setTransferAmount(''); setSelectedKelasTransfer(''); }}>
                    <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.pinSubtitle}>Saldo total yang Anda masukkan akan dibagi rata secara otomatis ke seluruh siswa di kelas yang dipilih.</Text>
                
                <Text style={styles.pinInputLabel}>Pilih Kelas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, marginTop: 10 }}>
                  {allData.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.classSelector, 
                        selectedKelasTransfer === item.kelas && { backgroundColor: BLUE_PRIMARY, borderColor: BLUE_PRIMARY }
                      ]}
                      onPress={() => setSelectedKelasTransfer(item.kelas)}
                    >
                      <Text style={[styles.classSelectorText, selectedKelasTransfer === item.kelas && { color: WHITE }]}>
                        {item.kelas}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.pinInputGroup}>
                  <Text style={styles.pinInputLabel}>Total Budget untuk Kelas</Text>
                  <View style={styles.pinInputWrap}>
                    <Text style={{ fontWeight: 'bold', color: BLUE_PRIMARY, marginRight: 5 }}>Rp</Text>
                    <TextInput 
                      style={styles.pinInput} 
                      placeholder="Contoh: 35000" 
                      keyboardType="numeric" 
                      value={transferAmount}
                      onChangeText={setTransferAmount}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.pinSubmit, { backgroundColor: '#4f46e5' }]} 
                  onPress={handleTransferDanaKelas}
                  disabled={isTransferring}
                >
                  {isTransferring ? <ActivityIndicator color={WHITE} /> : (
                    <>
                      <Text style={styles.pinSubmitTxt}>Transfer Sekarang</Text>
                      <Ionicons name="send-outline" size={18} color={WHITE} />
                    </>
                  )}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
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
  headerTitleLight: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tabContainer: { flexDirection: 'row', marginTop: 25, paddingHorizontal: 0 },
  tabItem: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 10, 
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  tabItemActive: { backgroundColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: BLUE_PRIMARY },
  summarySection: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    marginHorizontal: 24, 
    marginTop: -25, 
    borderRadius: 20, 
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    justifyContent: 'space-around'
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: '900', color: BLUE_PRIMARY },
  listContent: { padding: 24, paddingBottom: 150 },
  newClassCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  classCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classInfoMain: { flex: 1 },
  newClassTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  classMetaRow: { flexDirection: 'row', alignItems: 'center' },
  classMetaText: { fontSize: 13, color: '#64748B' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
  classActionArea: { alignItems: 'flex-end' },
  majorBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 8,
  },
  majorBadgeText: { fontSize: 10, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  indexText: { fontSize: 12, fontWeight: 'bold', color: '#CBD5E1', width: 25 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#16A34A', fontWeight: 'bold', fontSize: 16 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  studentNis: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: '#fff', flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  navLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  activeIndicator: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE_PRIMARY, marginTop: 4 },
  
  // Action Sheet Styles
  overlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  sheetTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', textAlign: 'center', marginBottom: 25, textTransform: 'uppercase', letterSpacing: 1.5 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sheetItem: { width: '22%', alignItems: 'center', marginBottom: 5 },
  sheetIconBox: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  sheetLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },

  // Add Student Modal Styles
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

  classSelector: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWeight: 1, borderColor: '#E2E8F0', borderWidth: 1, marginRight: 10, backgroundColor: '#F8FAFC' },
  classSelectorText: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  verifyBtnMini: { backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, elevation: 2 },
  verifyBtnTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  verifyBtnMass: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 4 },
  verifyMassTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 6 },
  
  inviteCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: BLUE_PRIMARY,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  inviteInfo: { flex: 1 },
  inviteLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  inviteCode: { fontSize: 24, fontWeight: '900', color: BLUE_PRIMARY, marginVertical: 4 },
  inviteDesc: { fontSize: 11, color: '#64748B', lineHeight: 16 },
  copyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEFCE8', justifyContent: 'center', alignItems: 'center' },
});
