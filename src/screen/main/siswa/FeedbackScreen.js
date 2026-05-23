import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#0B1E3F';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';

export default function FeedbackScreen({ route, navigation }) {
  const { canteenData } = route.params || {};
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('siswa');

  React.useEffect(() => {
    AsyncStorage.getItem('user_data').then(dataStr => {
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserRole(parsed.role || 'siswa');
      }
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengunggah foto makanan.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Peringatan', 'Silakan berikan rating terlebih dahulu.');
      return;
    }
    if (!review) {
      Alert.alert('Peringatan', 'Silakan tulis ulasan Anda.');
      return;
    }
    if (!image) {
      Alert.alert('Peringatan', 'Silakan lampirkan foto makanan sebagai bukti wajib.');
      return;
    }

    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('review', review);
      formData.append('kantin_id', canteenData?.id || '');
      formData.append('transaksi_id', canteenData?.transaksi_id || '');
      formData.append('siswa_id', userData?.id || '');

      if (image) {
        const localUri = image;
        let filename = localUri.split('/').pop().split('?')[0];
        if (!filename.includes('.')) {
          filename = filename + '.jpg';
        }
        const ext = filename.split('.').pop().toLowerCase();
        const type = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

        formData.append('photo', { 
          uri: localUri, 
          name: filename, 
          type: type 
        });
      }
      
      await apiClient.post('siswa/siswa_submit_feedback.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        "Terima Kasih",
        "Ulasan Anda sangat berarti bagi pengembangan kualitas layanan kantin kami.",
        [{ 
          text: "Selesai", 
          onPress: () => {
            if (userRole === 'guru') {
              navigation.replace('HomeGuru');
            } else {
              navigation.replace('HomeSiswa');
            }
          } 
        }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal mengirim ulasan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ulasan Makan</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.canteenCard}>
            <MaterialCommunityIcons name="food-fork-drink" size={32} color={GOLD} />
            <Text style={styles.canteenName}>{canteenData?.name || 'Kantin Sekolah'}</Text>
            <Text style={styles.canteenSub}>Bagaimana kualitas makanan hari ini?</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Berikan Rating</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= rating ? GOLD : "#CBD5E1"} 
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating === 1 ? 'Sangat Buruk' : 
               rating === 2 ? 'Buruk' : 
               rating === 3 ? 'Cukup Baik' : 
               rating === 4 ? 'Enak' : 
               rating === 5 ? 'Sangat Lezat!' : 'Pilih Bintang'}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Tulis Ulasan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ceritakan pengalaman makan Anda hari ini..."
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Unggah Foto Makanan (Wajib)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Feather name="camera" size={32} color="#94A3B8" />
                  <Text style={styles.pickerText}>Ambil atau Pilih Foto</Text>
                </View>
              )}
            </TouchableOpacity>
            {image && (
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Text style={styles.removeText}>Hapus Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Kirim Ulasan</Text>
                <Ionicons name="send" size={18} color={WHITE} style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  scrollContent: { padding: 25 },
  canteenCard: { backgroundColor: WHITE, borderRadius: 25, padding: 25, alignItems: 'center', elevation: 4, marginBottom: 30 },
  canteenName: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY, marginTop: 10 },
  canteenSub: { fontSize: 14, color: '#64748B', marginTop: 5 },
  ratingSection: { alignItems: 'center', marginBottom: 30 },
  sectionLabel: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 15 },
  starsContainer: { flexDirection: 'row', marginBottom: 10 },
  ratingText: { fontSize: 16, fontWeight: 'bold', color: GOLD },
  inputSection: { marginBottom: 30 },
  textInput: { backgroundColor: WHITE, borderRadius: 20, padding: 20, height: 120, elevation: 2, fontSize: 14, color: BLUE_PRIMARY },
  imageSection: { marginBottom: 40 },
  imagePicker: { backgroundColor: WHITE, borderRadius: 20, height: 180, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  pickerPlaceholder: { alignItems: 'center' },
  pickerText: { marginTop: 10, fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  removeImage: { marginTop: 10, alignSelf: 'center' },
  removeText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  submitBtn: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' }
});
