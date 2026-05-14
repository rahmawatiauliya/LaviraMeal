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
      Alert.alert(
        "Konfirmasi Transaksi",
        "Apakah Anda yakin ingin melakukan transaksi makan di kantin ini? (1 PTS)",
        [
          { text: "Batal", onPress: () => setScanned(false), style: "cancel" },
          { 
            text: "Proses", 
            onPress: async () => {
              try {
                // SIMULASI ALUR POIN: Potong saldo siswa
                const currentSaldoStr = await AsyncStorage.getItem('simulated_saldo') || '100';
                let currentSaldo = parseInt(currentSaldoStr);
                
                if (currentSaldo < 1) {
                  Alert.alert("Saldo Tidak Cukup", "Poin Anda tidak mencukupi untuk transaksi ini.");
                  setScanned(false);
                  return;
                }

                // Potong 1 PTS
                const newSaldo = currentSaldo - 1;
                await AsyncStorage.setItem('simulated_saldo', String(newSaldo));

                // Tambahkan simulasi pendapatan kantin (optional)
                const currentEarning = await AsyncStorage.getItem('simulated_kantin_earning') || '0';
                await AsyncStorage.setItem('simulated_kantin_earning', String(parseInt(currentEarning) + 1));

                // Simpan notifikasi feedback baru untuk kantin (simulasi)
                const feedbackQueue = await AsyncStorage.getItem('simulated_feedbacks') || '[]';
                const feedbacks = JSON.parse(feedbackQueue);
                // (Feedback sebenarnya akan dikirim dari FeedbackScreen, ini hanya placeholder alur)

                // Navigasi ke Layar Feedback (WAJIB)
                navigation.replace('Feedback', { 
                  canteenData: { 
                    name: data.replace('KANTIN-', '').replace('K-', ''), 
                    id: data,
                    amount: 1
                  } 
                });
              } catch (e) {
                Alert.alert("Error", "Gagal memproses transaksi simulasi");
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
