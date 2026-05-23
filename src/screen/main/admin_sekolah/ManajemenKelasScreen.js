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
  KeyboardAvoidingView,
  useWindowDimensions
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const DANGER = '#F43F5E';
const SOFT_BG = '#F5F7FA';

export default function ManajemenKelasScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [viewMode, setViewMode] = useState('tingkat'); // tingkat, kelas, siswa, guru
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allData, setAllData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTingkat, setSelectedTingkat] = useState('10');
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [filteredKelas, setFilteredKelas] = useState([]);
  const [listSiswa, setListSiswa] = useState([]);
  const [listGuru, setListGuru] = useState([]);
  const [kodeUndangan, setKodeUndangan] = useState('v4v79a');

  // Modal States
  const [addSiswaModal, setAddSiswaModal] = useState(false);
  const [addGuruModal, setAddGuruModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newSiswa, setNewSiswa] = useState({ nis: '', nama: '', email: '', password: '' });
  const [newGuru, setNewGuru] = useState({ nip: '', nama: '', email: '', mapel: '', kelas_wali: '', password: '' });
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
              total_siswa: 0
            };
          }
          acc[t].jumlah_kelas += 1;
          acc[t].total_siswa += parseInt(item.jumlah_siswa);
          return acc;
        }, {});

        const sortedCats = Object.values(grouped).sort((a, b) => parseInt(a.tingkat) - parseInt(b.tingkat));
        setCategories(sortedCats);
        
        if (sortedCats.length > 0 && !selectedTingkat) {
           setSelectedTingkat(sortedCats[0].tingkat);
        }

        // Fetch Kode Undangan
        const statsResp = await apiClient.get(`sekolah/sekolah_get_stats.php?sekolah_id=${sekolah_id}`);
        if (statsResp.data.status === 'success') {
          setKodeUndangan(statsResp.data.data.kode_undangan || 'v4v79a');
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

  const fetchGuru = async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = JSON.parse(userDataStr);
      const response = await apiClient.get(`sekolah/sekolah_get_guru.php?sekolah_id=${userData.sekolah_id}`);
      if (response.data && response.data.status === 'success') {
        setListGuru(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching guru:", error);
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

  const handleVerifyAllSiswa = async () => {
    Alert.alert(
      "Verifikasi Masal",
      `Setujui semua siswa di kelas ${selectedKelas}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui Semua",
          onPress: async () => {
            try {
              setLoading(true);
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
              Alert.alert("Error", "Gagal verifikasi masal");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleVerifyAllGuru = async () => {
    Alert.alert(
      "Verifikasi Masal Guru",
      "Setujui semua akun guru yang terdaftar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui Semua",
          onPress: async () => {
            try {
              setLoading(true);
              const userDataStr = await AsyncStorage.getItem('user_data');
              const userData = JSON.parse(userDataStr);
              const response = await apiClient.post('sekolah/sekolah_verify_guru.php', {
                sekolah_id: userData.sekolah_id,
                mass_verify: true
              });
              if (response.data.status === 'success') {
                Alert.alert("Sukses", response.data.message);
                fetchGuru();
              }
            } catch (error) {
              Alert.alert("Error", "Gagal verifikasi masal guru");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleVerifyGuru = async (guruId, nama) => {
    Alert.alert(
      "Verifikasi Guru",
      `Setujui data pendidik ${nama}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui",
          onPress: async () => {
            try {
              setLoading(true);
              const userDataStr = await AsyncStorage.getItem('user_data');
              const userData = JSON.parse(userDataStr);
              const response = await apiClient.post('sekolah/sekolah_verify_guru.php', {
                sekolah_id: userData.sekolah_id,
                guru_id: guruId
              });
              if (response.data.status === 'success') {
                Alert.alert("Sukses", response.data.message);
                fetchGuru();
              }
            } catch (error) {
              Alert.alert("Error", "Gagal verifikasi guru");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (viewMode === 'siswa' || viewMode === 'guru') setViewMode('tingkat');
    else navigation.goBack();
  };

  const handleDeleteSiswa = async (siswaId, nama, isActive) => {
    if (isActive) {
      Alert.alert(
        "Nonaktifkan Siswa",
        `Apakah Anda yakin ingin menonaktifkan siswa ${nama}? Akun yang tidak aktif tidak dapat digunakan untuk layanan aplikasi.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Nonaktifkan",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const userDataStr = await AsyncStorage.getItem('user_data');
                const userData = JSON.parse(userDataStr);
                const response = await apiClient.post('sekolah/sekolah_deactivate_siswa.php', {
                  sekolah_id: userData.sekolah_id,
                  siswa_id: siswaId
                });
                if (response.data.status === 'success') {
                  Alert.alert("Sukses", "Siswa berhasil dinonaktifkan");
                  handleSelectKelas(selectedKelas);
                }
              } catch (error) {
                Alert.alert("Error", "Gagal menonaktifkan siswa");
                setLoading(false);
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Hapus Siswa Permanen",
        `Apakah Anda yakin ingin menghapus ${nama} secara permanen dari database?`,
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus Permanen", 
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const userDataStr = await AsyncStorage.getItem('user_data');
                const userData = JSON.parse(userDataStr);
                const response = await apiClient.post('sekolah/sekolah_delete_siswa.php', {
                  sekolah_id: userData.sekolah_id,
                  siswa_id: siswaId
                });
                if (response.data.status === 'success') {
                  Alert.alert("Sukses", "Siswa berhasil dihapus secara permanen");
                  handleSelectKelas(selectedKelas);
                }
              } catch (error) {
                Alert.alert("Error", "Gagal menghapus siswa");
                setLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  const handleDeleteGuru = async (guruId, nama, isActive) => {
    if (isActive) {
      Alert.alert(
        "Nonaktifkan Guru",
        `Apakah Anda yakin ingin menonaktifkan guru ${nama}? Akses login guru ini akan segera dicabut.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Nonaktifkan",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const userDataStr = await AsyncStorage.getItem('user_data');
                const userData = JSON.parse(userDataStr);
                const response = await apiClient.post('sekolah/sekolah_deactivate_guru.php', {
                  sekolah_id: userData.sekolah_id,
                  guru_id: guruId
                });
                if (response.data.status === 'success') {
                  Alert.alert("Sukses", "Guru berhasil dinonaktifkan");
                  fetchGuru();
                }
              } catch (error) {
                Alert.alert("Error", "Gagal menonaktifkan guru");
                setLoading(false);
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Hapus Guru Permanen",
        `Apakah Anda yakin ingin menghapus guru ${nama} secara permanen dari database?`,
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus Permanen", 
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const userDataStr = await AsyncStorage.getItem('user_data');
                const userData = JSON.parse(userDataStr);
                const response = await apiClient.post('sekolah/sekolah_delete_guru.php', {
                  sekolah_id: userData.sekolah_id,
                  guru_id: guruId
                });
                if (response.data.status === 'success') {
                  Alert.alert("Sukses", "Data guru berhasil dihapus secara permanen");
                  fetchGuru();
                }
              } catch (error) {
                Alert.alert("Error", "Gagal menghapus data guru");
                setLoading(false);
              }
            }
          }
        ]
      );
    }
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

      const formData = new FormData();
      formData.append('sekolah_id', userData.sekolah_id);
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'text/csv',
      });

      const endpoint = viewMode === 'guru' ? 'sekolah/sekolah_import_guru.php' : `sekolah/sekolah_import_siswa.php?sekolah_id=${userData.sekolah_id}`;
      
      const response = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        Alert.alert('Berhasil', response.data.message);
        if (viewMode === 'guru') fetchGuru();
        else fetchKelas(); 
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', "Gagal mengimport data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      let template = "";
      let fileName = "";
      
      if (viewMode === 'guru') {
        template = "nip;nama;email;mata_pelajaran;kelas_wali\n19850101;Guru Contoh;guru@mbg.com;Matematika;10-IPA-1";
        fileName = "template_guru_lavira.csv";
      } else {
        template = "nis;nama;kelas;jenis_kelamin;tanggal_lahir;nama_wali;no_telp_wali\n12345;Siswa Contoh;10-IPA-1;L;2010-01-01;Wali Siswa;08123456789";
        fileName = "template_siswa_lavira.csv";
      }
      
      if (Platform.OS === 'web') {
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        setShowTemplateModal(false);
        return;
      }

      // On Android: Use StorageAccessFramework for direct download to a selected folder
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const directoryUri = permissions.directoryUri;
            
            // Create the CSV file directly in the user's chosen folder
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri,
              fileName,
              'text/csv'
            );
            
            await FileSystem.writeAsStringAsync(fileUri, template, { encoding: 'utf8' });
            Alert.alert("Unduh Sukses", `Template ${fileName} berhasil disimpan ke folder tujuan Anda.`);
            setShowTemplateModal(false);
            return;
          } else {
            Alert.alert("Batal", "Unduhan dibatalkan karena izin akses folder tidak diberikan.");
            return;
          }
        } catch (err) {
          console.warn("StorageAccessFramework failed, falling back to Share menu", err);
        }
      }

      // Fallback (e.g. iOS) or if StorageAccessFramework throws an error:
      // iOS relies on standard Sharing to open the "Save to Files" dialog.
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, template, { encoding: 'utf8' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Simpan Template CSV' });
        setShowTemplateModal(false);
      } else {
        Alert.alert("Error", "Fitur unduh/berbagi tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal membuat template.');
    }
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
        handleSelectKelas(selectedKelas);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal menambah siswa");
    } finally {
      setIsAdding(false);
    }
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
        mata_pelajaran: newGuru.mapel,
        kelas_wali: newGuru.kelas_wali,
        password: newGuru.password || 'guru123'
      });

      if (response.data.status === 'success') {
        Alert.alert("Berhasil", response.data.message);
        setAddGuruModal(false);
        setNewGuru({ nip: '', nama: '', email: '', mapel: '', kelas_wali: '', password: '' });
        fetchGuru();
      }
    } catch (error) {
      Alert.alert("Error", "Gagal menambah data guru");
    } finally {
      setIsAdding(false);
    }
  };

  const getMajorInfo = (namaKelas) => {
    const name = (namaKelas || '').toUpperCase();
    if (name.includes('IPA')) return { label: 'IPA', color: '#3B82F6', bg: '#EFF6FF' };
    if (name.includes('IPS')) return { label: 'IPS', color: '#10B981', bg: '#ECFDF5' };
    if (name.includes('TKJ')) return { label: 'TKJ', color: '#8B5CF6', bg: '#F5F3FF' };
    return { label: 'UMUM', color: '#64748B', bg: '#F1F5F9' };
  };

  const renderClassItem = ({ item }) => {
    const major = getMajorInfo(item.kelas);
    return (
      <TouchableOpacity style={styles.classCard} onPress={() => handleSelectKelas(item.kelas)}>
        <View style={styles.classCardLeft}>
          <View style={[styles.classIcon, { backgroundColor: major.bg }]}>
            <Text style={[styles.classIconText, { color: major.color }]}>{item.kelas.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.classTitle}>{item.kelas}</Text>
            <Text style={styles.classSubtitle}>{item.jumlah_siswa} Siswa Terdaftar</Text>
          </View>
        </View>
        <View style={styles.classCardRight}>
          <View style={[styles.badge, { backgroundColor: major.bg }]}>
            <Text style={[styles.badgeText, { color: major.color }]}>{major.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSiswa = ({ item, index }) => (
    <View style={styles.siswaRow}>
      <View style={styles.siswaLeft}>
        <View style={styles.siswaAvatar}>
          <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.siswaName}>{item.nama}</Text>
          <Text style={styles.siswaDetail}>NIS {item.nis} • {item.email || 'No Email'}</Text>
        </View>
      </View>
      <View style={styles.siswaRight}>
        {item.aktif ? (
          <View style={styles.siswaActions}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={SUCCESS} />
              <Text style={styles.verifiedText}>Aktif</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSiswa(item.id, item.nama, true)}>
              <Ionicons name="trash-outline" size={20} color={DANGER} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.siswaActions}>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerifySiswa(item.id, item.nama)}>
              <Text style={styles.verifyBtnText}>Verifikasi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSiswa(item.id, item.nama, false)}>
              <Ionicons name="trash-outline" size={20} color={DANGER} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderGuru = ({ item }) => {
    const initial = item.nama.charAt(0).toUpperCase();
    return (
      <View style={styles.teacherCard}>
        <View style={styles.teacherTop}>
          <View style={styles.teacherAvatar}>
            <Text style={styles.teacherAvatarText}>{initial}</Text>
          </View>
          <View style={styles.teacherMainInfo}>
            <Text style={styles.teacherName}>{item.nama}</Text>
            <Text style={styles.teacherMeta}>{item.nip ? `NIP. ${item.nip}` : 'Pendidik'}</Text>
          </View>
          <TouchableOpacity style={styles.teacherDeleteBtn} onPress={() => handleDeleteGuru(item.id, item.nama, item.is_active)}>
            <Ionicons name="trash-bin-outline" size={20} color={DANGER} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.teacherDivider} />
        
        <View style={styles.teacherBottom}>
          <View style={styles.infoPill}>
            <Ionicons name="book" size={12} color="#6366F1" />
            <Text style={styles.infoPillText}>{item.mata_pelajaran || 'Umum'}</Text>
          </View>
          {item.kelas_wali && (
            <View style={[styles.infoPill, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="school" size={12} color="#0EA5E9" />
              <Text style={[styles.infoPillText, { color: '#0EA5E9' }]}>Wali {item.kelas_wali}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.teacherStatus}>
          <View style={styles.teacherStatusLeft}>
            <View style={[styles.statusDot, { backgroundColor: item.is_active ? SUCCESS : '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: item.is_active ? SUCCESS : '#F59E0B' }]}>
              {item.is_active ? 'Akun Aktif' : 'Menunggu Aktivasi'}
            </Text>
          </View>
          
          {!item.is_active && (
            <TouchableOpacity 
              style={styles.verifyGuruBtn} 
              onPress={() => handleVerifyGuru(item.id, item.nama)}
            >
              <Text style={styles.verifyGuruBtnText}>Verifikasi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const selectedTingkatData = categories.find(c => c.tingkat === selectedTingkat) || { total_siswa: 0, jumlah_kelas: 0 };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require('../../../../assets/batik_cirebon.png')} style={styles.batikOverlay} />
        <SafeAreaView>
          <View style={[styles.headerContent, isLargeScreen && styles.centered]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {viewMode === 'tingkat' ? 'Manajemen Kelas' : (viewMode === 'guru' ? 'Data Pendidik' : `Kelas ${selectedKelas}`)}
            </Text>
            <View style={styles.headerActions}>
              {viewMode === 'tingkat' ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => setShowTemplateModal(true)} style={[styles.actionIcon, { marginRight: 15 }]}>
                    <Ionicons name="document-text-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleImport} style={styles.actionIcon}>
                    <Ionicons name="cloud-upload-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ) : (viewMode === 'guru' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setShowTemplateModal(true)} style={[styles.actionIcon, { marginRight: 15 }]}>
                    <Ionicons name="document-text-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleImport} style={[styles.actionIcon, { marginRight: 15 }]}>
                    <Ionicons name="cloud-upload-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAddGuruModal(true)} style={styles.actionIcon}>
                    <Ionicons name="person-add-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ) : (viewMode === 'siswa' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setShowTemplateModal(true)} style={[styles.actionIcon, { marginRight: 15 }]}>
                    <Ionicons name="document-text-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleImport} style={[styles.actionIcon, { marginRight: 15 }]}>
                    <Ionicons name="cloud-upload-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAddSiswaModal(true)} style={styles.actionIcon}>
                    <Ionicons name="person-add-outline" size={24} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ) : null))}
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {/* TABS FOR TINGKAT */}
        {viewMode === 'tingkat' && (
          <View style={styles.tabWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {categories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.tab, selectedTingkat === cat.tingkat && styles.tabActive]}
                  onPress={() => setSelectedTingkat(cat.tingkat)}
                >
                  <Text style={[styles.tabLabel, selectedTingkat === cat.tingkat && viewMode === 'tingkat' && styles.tabLabelActive]}>
                    Kelas {cat.tingkat}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.tab, viewMode === 'guru' && styles.tabActive]}
                onPress={() => { setViewMode('guru'); fetchGuru(); }}
              >
                <Text style={[styles.tabLabel, viewMode === 'guru' && styles.tabLabelActive]}>
                  GURU
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
          contentContainerStyle={[styles.scrollBody, isLargeScreen && styles.centered]}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'tingkat' && (
            <>
              {/* SUMMARY CARD */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{selectedTingkatData.total_siswa}</Text>
                  <Text style={styles.summaryLab}>Total Siswa</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{selectedTingkatData.jumlah_kelas}</Text>
                  <Text style={styles.summaryLab}>Rombel</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Daftar Kelas {selectedTingkat}</Text>
            </>
          )}

          {viewMode === 'siswa' && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Siswa Kelas {selectedKelas}</Text>
              <TouchableOpacity style={styles.verifyAllBtn} onPress={handleVerifyAllSiswa}>
                <Ionicons name="shield-checkmark-outline" size={14} color={SUCCESS} />
                <Text style={styles.verifyAllText}>Verifikasi Semua</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'guru' && (
            <View style={{ paddingHorizontal: 25, marginTop: 20 }}>
               <View style={styles.guruHeaderCard}>
                <View style={styles.guruHeaderIcon}>
                  <Ionicons name="people" size={26} color={WHITE} />
                </View>
                <View>
                  <Text style={styles.guruHeaderTitle}>Guru Pendidik</Text>
                  <Text style={styles.guruHeaderSub}>{listGuru.length} Guru Aktif Terdaftar</Text>
                </View>
              </View>
              <View style={styles.sectionHeaderGuru}>
                <Text style={styles.sectionTitleGuru}>Guru Pembimbing</Text>
                <TouchableOpacity style={styles.verifyAllBtn} onPress={handleVerifyAllGuru}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={SUCCESS} />
                  <Text style={styles.verifyAllText}>Verifikasi Semua</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* LIST DATA */}
          <View style={styles.listContainer}>
            {loading && !refreshing ? (
              <ActivityIndicator color={BLUE_PRIMARY} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={viewMode === 'tingkat' ? allData.filter(i => i.kelas.startsWith(selectedTingkat)) : (viewMode === 'guru' ? listGuru : listSiswa)}
                keyExtractor={(item, index) => index.toString()}
                renderItem={viewMode === 'tingkat' ? renderClassItem : (viewMode === 'guru' ? renderGuru : renderSiswa)}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIllustration}>
                      <MaterialCommunityIcons name="account-search-outline" size={80} color="#E2E8F0" />
                    </View>
                    <Text style={styles.emptyText}>Tidak ada data {viewMode === 'guru' ? 'Guru' : 'Siswa'}</Text>
                    <Text style={styles.emptySub}>Silakan tambah data baru atau import dari Excel.</Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <View style={[styles.bottomNavInner, isLargeScreen && styles.centered]}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSekolah')}>
            <Ionicons name="grid-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="layers" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Kelas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LaporanSekolah')}>
            <Ionicons name="bar-chart-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Laporan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilSekolah')}>
            <Ionicons name="person-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showTemplateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.templateModal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Panduan Import {viewMode === 'guru' ? 'Guru' : 'Siswa'}</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.guideText}>Pastikan file Excel/CSV Anda memiliki urutan kolom sebagai berikut:</Text>
              
              <View style={styles.tableHead}>
                <Text style={styles.tableHeadText}>No</Text>
                <Text style={[styles.tableHeadText, { flex: 2 }]}>Nama Kolom</Text>
                <Text style={[styles.tableHeadText, { flex: 3 }]}>Keterangan</Text>
              </View>

              {viewMode === 'guru' ? (
                [
                  { n: '1', c: 'nip', e: 'Wajib diisi (Username)' },
                  { n: '2', c: 'nama', e: 'Wajib diisi' },
                  { n: '3', c: 'email', e: 'Opsional (Login)' },
                  { n: '4', c: 'mapel', e: 'Bidang Studi' },
                  { n: '5', c: 'kelas_wali', e: 'Contoh: 10-IPA-1' }
                ].map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.n}</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: BLUE_PRIMARY }]}>{item.c}</Text>
                    <Text style={[styles.tableCell, { flex: 3, color: '#64748B' }]}>{item.e}</Text>
                  </View>
                ))
              ) : (
                [
                  { n: '1', c: 'nis', e: 'Wajib diisi (Username)' },
                  { n: '2', c: 'nama', e: 'Wajib diisi' },
                  { n: '3', c: 'kelas', e: 'Contoh: 10-IPA-1' },
                  { n: '4', c: 'jk', e: 'L / P' },
                  { n: '5', c: 'tgl_lahir', e: 'YYYY-MM-DD' },
                  { n: '6', c: 'wali', e: 'Nama Wali' },
                  { n: '7', c: 'telp', e: 'Nomor HP' }
                ].map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.n}</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: BLUE_PRIMARY }]}>{item.c}</Text>
                    <Text style={[styles.tableCell, { flex: 3, color: '#64748B' }]}>{item.e}</Text>
                  </View>
                ))
              )}

              <View style={{ height: 20 }} />
              <View style={styles.guideItem}>
                <Ionicons name="key-outline" size={16} color={SUCCESS} />
                <Text style={styles.guideItemText}>Password default: {viewMode === 'guru' ? 'guru123' : 'siswa123'}</Text>
              </View>
              <View style={styles.guideItem}>
                <Ionicons name="alert-circle-outline" size={16} color={GOLD} />
                <Text style={styles.guideItemText}>Gunakan format file .CSV (Pemisah Titik Koma).</Text>
              </View>

              <TouchableOpacity style={styles.downloadActionBtn} onPress={handleDownloadTemplate}>
                <Ionicons name="download-outline" size={20} color={WHITE} />
                <Text style={styles.downloadActionText}>Unduh Template {viewMode === 'guru' ? 'Guru' : 'Siswa'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL TAMBAH SISWA */}
      <Modal visible={addSiswaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={styles.addModalContent}>
              <View style={styles.sheetHeader}>
                <Text style={styles.pinTitle}>Tambah Siswa Baru</Text>
                <TouchableOpacity onPress={() => setAddSiswaModal(false)}>
                  <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
                </TouchableOpacity>
              </View>
              <Text style={styles.pinSubtitle}>Menambahkan siswa ke kelas {selectedKelas}. Akun login akan dibuat otomatis.</Text>

              <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.pinInputLabel}>Alamat Email (Opsional)</Text>
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

      {/* MODAL TAMBAH GURU */}
      <Modal visible={addGuruModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={styles.addModalContent}>
              <View style={styles.sheetHeader}>
                <Text style={styles.pinTitle}>Tambah Pendidik Baru</Text>
                <TouchableOpacity onPress={() => setAddGuruModal(false)}>
                  <Ionicons name="close" size={24} color={BLUE_PRIMARY} />
                </TouchableOpacity>
              </View>
              <Text style={styles.pinSubtitle}>Daftarkan guru baru ke database sekolah Anda.</Text>

              <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.pinInputGroup}>
                  <Text style={styles.pinInputLabel}>NIP / NUPTK</Text>
                  <View style={styles.pinInputWrap}>
                    <Ionicons name="id-card-outline" size={18} color="#94a3b8" />
                    <TextInput 
                      style={styles.pinInput} 
                      placeholder="Nomor Induk Pegawai" 
                      keyboardType="numeric"
                      value={newGuru.nip}
                      onChangeText={(v) => setNewGuru({...newGuru, nip: v})}
                    />
                  </View>
                </View>

                <View style={styles.pinInputGroup}>
                  <Text style={styles.pinInputLabel}>Nama Lengkap Guru</Text>
                  <View style={styles.pinInputWrap}>
                    <Ionicons name="person-outline" size={18} color="#94a3b8" />
                    <TextInput 
                      style={styles.pinInput} 
                      placeholder="Nama Beserta Gelar" 
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
                      placeholder="Contoh: Matematika" 
                      value={newGuru.mapel}
                      onChangeText={(v) => setNewGuru({...newGuru, mapel: v})}
                    />
                  </View>
                </View>

                <View style={styles.pinInputGroup}>
                  <Text style={styles.pinInputLabel}>Alamat Email</Text>
                  <View style={styles.pinInputWrap}>
                    <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                    <TextInput 
                      style={styles.pinInput} 
                      placeholder="email@pendidik.com" 
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newGuru.email}
                      onChangeText={(v) => setNewGuru({...newGuru, email: v})}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.pinSubmit, { backgroundColor: '#8B5CF6' }, isAdding && { opacity: 0.7 }]} 
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
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  centered: { width: '100%', maxWidth: 1000, alignSelf: 'center' },
  header: { height: 140, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, resizeMode: 'repeat' },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 15, height: 60 },
  backButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, marginLeft: 15, fontSize: 18, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginLeft: 12, width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  body: { flex: 1, backgroundColor: SOFT_BG, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30 },
  tabWrapper: { paddingVertical: 20 },
  tabScroll: { paddingHorizontal: 25 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, backgroundColor: WHITE, marginRight: 10, elevation: 2 },
  tabActive: { backgroundColor: BLUE_PRIMARY },
  tabLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  tabLabelActive: { color: WHITE },

  scrollBody: { paddingBottom: 120 },
  summaryCard: { marginHorizontal: 25, backgroundColor: WHITE, borderRadius: 25, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 10, shadowOpacity: 0.1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '900', color: BLUE_PRIMARY },
  summaryLab: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', marginTop: 4 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  templateBtn: { alignItems: 'center' },
  templateBtnText: { fontSize: 9, fontWeight: 'bold', color: BLUE_PRIMARY, marginTop: 4 },

  inviteCard: { marginHorizontal: 25, marginTop: 15, backgroundColor: WHITE, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  inviteIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#FEFCE8', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  inviteTitle: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' },
  inviteCodeText: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY, marginTop: 2 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BLUE_PRIMARY,
    marginVertical: 15,
    paddingHorizontal: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 25,
  },
  sectionHeaderGuru: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  verifyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifyAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: SUCCESS,
    marginLeft: 5,
  },
  listContainer: { paddingHorizontal: 25 },
  
  classCard: { backgroundColor: WHITE, borderRadius: 20, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 2 },
  classCardLeft: { flexDirection: 'row', alignItems: 'center' },
  classIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  classIconText: { fontSize: 18, fontWeight: '900' },
  classTitle: { fontSize: 15, fontWeight: 'bold', color: BLUE_DARK },
  classSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  classCardRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 9, fontWeight: '900' },

  siswaRow: { backgroundColor: WHITE, padding: 15, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  siswaLeft: { flexDirection: 'row', alignItems: 'center' },
  siswaAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
  siswaName: { fontSize: 14, fontWeight: 'bold', color: BLUE_DARK },
  siswaDetail: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  siswaRight: { alignItems: 'flex-end' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 9, fontWeight: 'bold', color: SUCCESS, marginLeft: 4 },
  siswaActions: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { marginLeft: 15, padding: 5 },
  verifyBtn: { backgroundColor: BLUE_PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  verifyBtnText: { color: WHITE, fontSize: 11, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyIllustration: { width: 120, height: 120, borderRadius: 60, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 4 },
  emptyText: { color: BLUE_DARK, fontSize: 16, fontWeight: 'bold' },
  emptySub: { color: '#94A3B8', fontSize: 12, marginTop: 5, textAlign: 'center' },

  // TEACHER CARD STYLES
  teacherCard: { backgroundColor: WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  teacherTop: { flexDirection: 'row', alignItems: 'center' },
  teacherAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  teacherAvatarText: { fontSize: 20, fontWeight: '900', color: '#6366F1' },
  teacherMainInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: BLUE_DARK },
  teacherMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  teacherDeleteBtn: { padding: 8, backgroundColor: '#FFF1F2', borderRadius: 12 },
  teacherDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  teacherBottom: { flexDirection: 'row', gap: 10 },
  infoPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  infoPillText: { fontSize: 10, fontWeight: '800', color: '#6366F1' },
  teacherStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 10 },
  teacherStatusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },
  verifyGuruBtn: { backgroundColor: BLUE_PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  verifyGuruBtnText: { color: WHITE, fontSize: 11, fontWeight: 'bold' },
  sectionTitleGuru: { fontSize: 15, fontWeight: '800', color: BLUE_PRIMARY },

  guruHeaderCard: { backgroundColor: '#6366F1', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 25, elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3 },
  guruHeaderIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  guruHeaderTitle: { fontSize: 18, fontWeight: '900', color: WHITE },
  guruHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  bottomNavInner: { flex: 1, flexDirection: 'row', paddingBottom: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },

  // MODAL STYLES (REALISTIC)
  addModalContent: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '95%', width: '100%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pinTitle: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY },
  pinSubtitle: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18 },
  pinInputGroup: { marginBottom: 18 },
  pinInputLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  pinInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#f1f5f9' },
  pinInput: { flex: 1, marginLeft: 12, fontSize: 14, color: BLUE_PRIMARY, fontWeight: 'bold' },
  pinSubmit: { backgroundColor: BLUE_PRIMARY, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 10, elevation: 8 },
  pinSubmitTxt: { color: WHITE, fontSize: 15, fontWeight: 'bold' },

  // Guide Modal Styles (Fixed Overlapping)
  templateModal: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 35,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 24,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE_PRIMARY,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 8, 24, 0.7)', justifyContent: 'flex-end', alignItems: 'center' },
  modalWrap: { width: '100%', maxWidth: 500 },
  guideText: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 15, fontWeight: 'bold' },
  tableHead: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tableHeadText: { fontSize: 11, fontWeight: 'bold', color: BLUE_PRIMARY, flex: 1 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: WHITE },
  tableCell: { fontSize: 11, flex: 1, color: BLUE_DARK },
  guideItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  guideItemText: { fontSize: 12, color: '#64748B', marginLeft: 10, flex: 1 },
  downloadActionBtn: { backgroundColor: SUCCESS, height: 55, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 10 },
  downloadActionText: { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', height: 55, borderRadius: 15, paddingHorizontal: 15, fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY, borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: BLUE_PRIMARY, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' }
});
