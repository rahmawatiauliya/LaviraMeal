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
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const GOLD = '#D4AF37';
const SUCCESS = '#10B981';

export default function AbsensiKonsumsiScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listSiswa, setListSiswa] = useState([]);
  const [jadwalToday, setJadwalToday] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const user = JSON.parse(userDataStr);
      setUserData(user);

      // Fetch stats to get today's schedule
      const statsRes = await apiClient.get(`guru/guru_get_stats.php?user_id=${user.id}`);
      if (statsRes.data?.status === 'success') {
        setJadwalToday(statsRes.data.data.jadwal_hari_ini);
      }

      // Fetch siswa list
      const siswaRes = await apiClient.get(`guru/guru_get_siswa.php?user_id=${user.id}`);
      if (siswaRes.data?.status === 'success') {
        const initialData = siswaRes.data.data.map(s => ({
          ...s,
          hadir: true,
          makan: true,
          catatan: ''
        }));
        setListSiswa(initialData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSwitch = (id, field) => {
    setListSiswa(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: !item[field] } : item
    ));
  };

  const updateCatatan = (id, text) => {
    setListSiswa(prev => prev.map(item => 
      item.id === id ? { ...item, catatan: text } : item
    ));
  };

  const handleSubmit = async () => {
    if (!jadwalToday) {
      Alert.alert("Gagal", "Tidak ada jadwal distribusi hari ini untuk dikonfirmasi.");
      return;
    }

    Alert.alert(
      "Konfirmasi",
      "Apakah data absensi dan konsumsi sudah benar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Simpan",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const absensi_data = listSiswa.map(s => ({
                siswa_id: s.id,
                hadir: s.hadir,
                makan: s.makan,
                catatan: s.catatan
              }));

              const response = await apiClient.post('guru/guru_confirm_absensi.php', {
                user_id: userData.id,
                jadwal_id: jadwalToday.id,
                menu_id: 'default_menu_id', // Fallback or fetched from schedule
                absensi_data: absensi_data
              });

              if (response.data.status === 'success') {
                Alert.alert("Berhasil", "Data berhasil dikonfirmasi.");
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert("Error", "Gagal menyimpan data.");
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const renderSiswa = ({ item }) => (
    <View style={styles.siswaCard}>
      <View style={styles.siswaHeader}>
        <View style={styles.siswaMain}>
           <View style={styles.avatarMini}>
              <Text style={styles.avatarTxt}>{item.nama.charAt(0)}</Text>
           </View>
           <View>
              <Text style={styles.siswaName}>{item.nama}</Text>
              <Text style={styles.siswaNis}>{item.nis}</Text>
           </View>
        </View>
      </View>

      <View style={styles.controlRow}>
         <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Hadir</Text>
            <Switch
              trackColor={{ false: "#CBD5E1", true: SUCCESS + '50' }}
              thumbColor={item.hadir ? SUCCESS : "#94A3B8"}
              onValueChange={() => toggleSwitch(item.id, 'hadir')}
              value={item.hadir}
            />
         </View>
         <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Makan</Text>
            <Switch
              trackColor={{ false: "#CBD5E1", true: GOLD + '50' }}
              thumbColor={item.makan ? GOLD : "#94A3B8"}
              onValueChange={() => toggleSwitch(item.id, 'makan')}
              value={item.makan}
              disabled={!item.hadir}
            />
         </View>
      </View>

      <TextInput
         style={styles.catatanInput}
         placeholder="Catatan khusus (misal: alergi, sisa, dll)"
         value={item.catatan}
         onChangeText={(text) => updateCatatan(item.id, text)}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <Image
          source={require('../../../../assets/batik_cirebon.png')}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
        />
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Absensi & Konsumsi</Text>
            <View style={{ width: 40 }} />
          </View>

          {jadwalToday && (
            <View style={styles.jadwalChip}>
               <Ionicons name="time" size={14} color={GOLD} />
               <Text style={styles.jadwalTxt}>Sesi {jadwalToday.sesi} • {jadwalToday.nama_kantin}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={listSiswa}
          keyExtractor={(item) => item.id}
          renderItem={renderSiswa}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Text style={styles.submitBtnTxt}>Kirim Konfirmasi</Text>
                  <Ionicons name="send" size={18} color={WHITE} />
                </>
              )}
            </TouchableOpacity>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: BLUE_PRIMARY, 
    paddingBottom: 20, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    overflow: 'hidden' 
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  jadwalChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignSelf: 'center', 
    marginTop: 15, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  jadwalTxt: { color: GOLD, fontSize: 11, fontWeight: 'bold', marginLeft: 6 },
  listContent: { padding: 20, paddingBottom: 50 },
  siswaCard: { 
    backgroundColor: WHITE, 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 15, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  siswaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  siswaMain: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  siswaName: { fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY },
  siswaNis: { fontSize: 11, color: '#64748B' },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  controlItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  controlLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginRight: 10 },
  catatanInput: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginTop: 12, 
    fontSize: 12, 
    color: '#475569',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  submitBtn: { 
    backgroundColor: BLUE_PRIMARY, 
    height: 55, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    gap: 10,
    elevation: 8,
    shadowColor: BLUE_PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  submitBtnTxt: { color: WHITE, fontSize: 16, fontWeight: 'bold' }
});
