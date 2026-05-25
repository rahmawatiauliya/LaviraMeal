import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const SUCCESS = '#10B981';
const ACCENT = '#38BDF8';

export default function PostMenuHarianScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [kantinData, setKantinData] = useState(null);
  const [namaMenu, setNamaMenu] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [image, setImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    loadKantinData();
  }, []);

  const loadKantinData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        // Find kantin_id
        const response = await apiClient.get(`kantin/get_kantin_profile.php?user_id=${parsed.id}`);
        if (response.data.status === 'success') {
           setKantinData(response.data.data);
           fetchHistory(response.data.data.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async (kantinId) => {
    try {
      setFetchingHistory(true);
      const response = await apiClient.get(`kantin/get_my_menu_harian.php?kantin_id=${kantinId}`);
      if (response.data.status === 'success') {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengunggah foto menu.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handlePost = async () => {
    if (!namaMenu) {
      Alert.alert('Peringatan', 'Harap isi nama menu hari ini.');
      return;
    }

    if (!kantinData || !kantinData.id) {
      Alert.alert(
        'Peringatan',
        'Profil kantin sedang dimuat atau gagal terhubung ke server. Harap pastikan koneksi internet aktif dan coba lagi.'
      );
      loadKantinData();
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('kantin_id', kantinData.id);
      formData.append('nama_menu', namaMenu);
      formData.append('deskripsi', deskripsi);
      const localDate = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      formData.append('tanggal', localDate);

      if (image) {
        const localUri = image.uri;
        let filename = localUri.split('/').pop().split('?')[0];
        if (!filename.includes('.')) {
          filename = filename + '.jpg';
        }
        const ext = filename.split('.').pop().toLowerCase();
        const type = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        
        formData.append('foto_menu', { 
          uri: localUri, 
          name: filename, 
          type: type 
        });
      }

      const response = await apiClient.post('kantin/post_menu_harian.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        Alert.alert('Sukses', 'Menu harian berhasil diposting!');
        setNamaMenu('');
        setDeskripsi('');
        setImage(null);
        fetchHistory(kantinData.id);
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Terjadi kesalahan saat memposting menu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Menu Hari Ini</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Nama Menu/Makanan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Nasi Kuning + Telur Balado"
              value={namaMenu}
              onChangeText={setNamaMenu}
            />

            <Text style={styles.label}>Deskripsi Singkat (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jelaskan detail menu atau kandungan gizinya..."
              multiline
              value={deskripsi}
              onChangeText={setDeskripsi}
            />

            <Text style={styles.label}>Foto Makanan</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImg} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                  <Text style={styles.imagePlaceholderText}>Klik untuk ambil foto menu</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.postBtn, loading && { opacity: 0.7 }]} 
              onPress={handlePost}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Feather name="send" size={20} color={WHITE} />
                  <Text style={styles.postBtnText}>Posting Menu Sekarang</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.historySection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Riwayat Menu & Feedback</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RiwayatMenuHarian')}>
                <Text style={{ color: ACCENT, fontWeight: 'bold', fontSize: 12 }}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            {fetchingHistory ? (
              <ActivityIndicator color={BLUE_PRIMARY} style={{ marginTop: 20 }} />
            ) : history.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Belum ada riwayat postingan.</Text>
              </View>
            ) : (
              history.map((item, idx) => (
                <View key={idx} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                    <View style={styles.historyBadge}>
                      <Text style={styles.badgeText}>POSTED</Text>
                    </View>
                  </View>
                  <Text style={styles.historyMenu}>{item.nama_menu}</Text>
                  
                  {item.feedback_sppg && (
                    <View style={[styles.feedbackBox, { borderColor: '#E0F2FE' }]}>
                      <Text style={styles.feedbackLabel}>Feedback SPPG:</Text>
                      <Text style={styles.feedbackText}>{item.feedback_sppg}</Text>
                    </View>
                  )}

                  {item.feedback_sekolah && (
                    <View style={[styles.feedbackBox, { borderColor: '#F0FDF4' }]}>
                      <Text style={styles.feedbackLabel}>Feedback Sekolah:</Text>
                      <Text style={styles.feedbackText}>{item.feedback_sekolah}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: { padding: 20 },
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 25,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 25,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
    padding: 15,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 20,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 12, color: '#94A3B8', marginTop: 10, fontWeight: '500' },
  postBtn: {
    backgroundColor: BLUE_PRIMARY,
    flexDirection: 'row',
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  postBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  historySection: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  historyCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyDate: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
  historyBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: SUCCESS },
  historyMenu: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  feedbackBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 10,
  },
  feedbackLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#1E293B', lineHeight: 18 },
  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 13 },
});
