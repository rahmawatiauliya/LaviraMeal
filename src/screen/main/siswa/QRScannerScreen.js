import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [userRole, setUserRole] = useState('siswa');

  useEffect(() => {
    const getRole = async () => {
      try {
        const stored = await AsyncStorage.getItem('user_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserRole(parsed.role || 'siswa');
        }
      } catch (e) {
        console.error("Error fetching role:", e);
      }
    };
    getRole();
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kami memerlukan izin Anda untuk menggunakan kamera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Identifikasi apakah ini QR Kantin (Case-insensitive)
    const upperData = data.toUpperCase();
    if (upperData.includes('KANTIN') || upperData.startsWith('K')) {
      const canteenName = data.replace('KANTIN-', '').replace('K-', '');
      Alert.alert(
        "Konfirmasi Transaksi",
        `Apakah Anda yakin ingin melakukan transaksi makan di ${canteenName}? (1 PTS)`,
        [
          { text: "Batal", onPress: () => setScanned(false), style: "cancel" },
          {
            text: "Proses",
            onPress: async () => {
              try {
                // Get the real logged in user ID
                const userDataStr = await AsyncStorage.getItem('user_data');
                if (!userDataStr) {
                  Alert.alert("Error", "Sesi pengguna tidak valid.");
                  setScanned(false);
                  return;
                }
                const userData = JSON.parse(userDataStr);

                const endpoint = userRole === 'guru' ? 'guru/guru_proses_makan.php' : 'siswa/siswa_proses_makan.php';
                const payload = userRole === 'guru' ? {
                  guru_id: userData.id,
                  kantin_qr: data
                } : {
                  siswa_id: userData.id,
                  kantin_qr: data
                };

                // CALL REAL API
                const response = await apiClient.post(endpoint, payload);

                if (response.data && response.data.status === 'success') {
                  // Berhasil diproses, arahkan kembali langsung ke Home sesuai role
                  Alert.alert(
                    "Transaksi Berhasil",
                    `Menu: ${response.data.menu_name}\nSaldo dipotong: ${response.data.deducted} PTS\n\nTransaksi Anda berhasil diselesaikan!`,
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
                } else {
                  Alert.alert("Transaksi Gagal", response.data.message || "Terjadi kesalahan.");
                  setScanned(false);
                }
              } catch (e) {
                console.log(e);
                Alert.alert("Error", "Gagal memproses transaksi. Periksa koneksi Anda.");
                setScanned(false);
              }
            }
          }
        ]
      );
    } else {
      Alert.alert("QR Code", `Data terdeteksi: ${data}`);
      setScanned(false);
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
          <Text style={styles.headerTitle}>Scan QR Code</Text>
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
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hintText}>Arahkan kamera ke QR Code</Text>
        </View>

        <View style={styles.footer}>
          {scanned && (
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: WHITE,
    fontSize: 16,
  },
  button: {
    backgroundColor: BLUE_PRIMARY,
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: WHITE,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: WHITE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 20,
  },
  hintText: {
    color: WHITE,
    marginTop: 30,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footer: {
    height: 100,
    justifyContent: 'center',
  },
  rescanButton: {
    backgroundColor: WHITE,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  rescanText: {
    color: BLUE_PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
