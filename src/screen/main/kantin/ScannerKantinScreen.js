import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';

export default function ScannerKantinScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kantinData, setKantinData] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user_data').then(data => {
      if (data) setKantinData(JSON.parse(data));
    });
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Izin kamera diperlukan untuk melakukan scan QR siswa</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // data biasanya berisi token QR siswa
      const response = await apiClient.post('kantin/kantin_proses_makan.php', {
        student_token: data,
        kantin_id: kantinData?.id
      });

      if (response.data && response.data.status === 'success') {
        const menuDetail = response.data.menu_detail;
        const menuName = menuDetail ? menuDetail.nama_menu : 'Paket Makan LaviraMeal';
        
        Alert.alert(
          "Berhasil",
          `Siswa: ${response.data.student_name}\nMenu: ${menuName}\nSaldo dipotong: ${response.data.deducted_points} PTS`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Gagal", response.data.message || "Gagal memproses transaksi");
        setScanned(false);
      }
    } catch (error) {
      console.log("Scan Error:", error);
      Alert.alert("Error", "Terjadi kesalahan jaringan atau server");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Siswa</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={WHITE} />
                <Text style={styles.loadingText}>Memproses...</Text>
              </View>
            )}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hintText}>Arahkan kamera ke QR Code Siswa</Text>
          
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.infoText}>Sistem akan otomatis memotong saldo siswa sebesar 15 PTS untuk 1 porsi makan.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {scanned && !loading && (
            <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanButton}>
              <Text style={styles.rescanText}>Scan Ulang</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  message: { textAlign: 'center', paddingBottom: 10, color: WHITE, fontSize: 16 },
  button: { backgroundColor: BLUE_PRIMARY, padding: 15, borderRadius: 10, alignSelf: 'center' },
  buttonText: { color: WHITE, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: 'bold' },
  scannerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  scannerFrame: { width: 260, height: 260, position: 'relative', overflow: 'hidden', borderRadius: 30 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: SUCCESS },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 30 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 30 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 30 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 30 },
  hintText: { color: WHITE, marginTop: 30, fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  infoBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, marginTop: 40, gap: 10 },
  infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: WHITE, marginTop: 15, fontWeight: 'bold' },
  footer: { height: 100, justifyContent: 'center' },
  rescanButton: { backgroundColor: WHITE, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, alignSelf: 'center' },
  rescanText: { color: BLUE_PRIMARY, fontWeight: 'bold', fontSize: 16 },
});
