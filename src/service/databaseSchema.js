import { db } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

// --- 1. TRANSFORMASI TABEL USERS ---
export const registerUserFull = async (uid, authData, profileData) => {
  try {
    await setDoc(doc(db, "users", uid), {
      nama: authData.nama,
      email: authData.email,
      role: authData.role || 'user',
      is_active: true,
      last_login: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error User Schema: ", e); }
};

// --- 2. TRANSFORMASI TABEL SPPG ---
export const addSppg = async (data) => {
  try {
    await addDoc(collection(db, "sppg"), {
      user_id: data.user_id,
      nama_lembaga: data.nama_lembaga,
      kode_sppg: data.kode_sppg,
      alamat: data.alamat || null,
      kota: data.kota || null,
      provinsi: data.provinsi || null,
      no_telp: data.no_telp || null,
      email_lembaga: data.email_lembaga || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error SPPG Schema: ", e); }
};

// --- 3. TRANSFORMASI TABEL SEKOLAH ---
export const addSekolah = async (data) => {
  try {
    await addDoc(collection(db, "sekolah"), {
      user_id: data.user_id,
      sppg_id: data.sppg_id,
      nama_sekolah: data.nama_sekolah,
      npsn: data.npsn,
      jenjang: data.jenjang,
      alamat: data.alamat || null,
      kota: data.kota || null,
      provinsi: data.provinsi || null,
      no_telp: data.no_telp || null,
      email_sekolah: data.email_sekolah || null,
      jumlah_siswa: data.jumlah_siswa || 0,
      is_aktif: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Sekolah Schema: ", e); }
};

// --- 4. TRANSFORMASI TABEL KANTIN ---
export const addKantin = async (data) => {
  try {
    await addDoc(collection(db, "kantin"), {
      user_id: data.user_id,
      sekolah_id: data.sekolah_id,
      nama_kantin: data.nama_kantin,
      pemilik: data.pemilik,
      no_telp: data.no_telp || null,
      kapasitas_porsi: data.kapasitas_porsi || 0,
      is_aktif: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Kantin Schema: ", e); }
};

// --- 5. TRANSFORMASI TABEL GURU ---
export const addGuru = async (data) => {
  try {
    await addDoc(collection(db, "guru"), {
      user_id: data.user_id,
      sekolah_id: data.sekolah_id,
      nip: data.nip || null,
      nama: data.nama,
      mata_pelajaran: data.mata_pelajaran || null,
      kelas_wali: data.kelas_wali || null,
      no_telp: data.no_telp || null,
      is_aktif: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Guru Schema: ", e); }
};

// --- 6. TRANSFORMASI TABEL SISWA ---
export const addSiswa = async (data) => {
  try {
    await addDoc(collection(db, "siswa"), {
      user_id: data.user_id || null,
      sekolah_id: data.sekolah_id,
      guru_id: data.guru_id || null,
      nis: data.nis,
      nama: data.nama,
      kelas: data.kelas,
      jenis_kelamin: data.jenis_kelamin || null,
      tanggal_lahir: data.tanggal_lahir || null,
      nama_wali: data.nama_wali || null,
      no_telp_wali: data.no_telp_wali || null,
      qr_code_token: data.qr_code_token || null,
      aktif: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Siswa Schema: ", e); }
};

// --- 7. TRANSFORMASI TABEL MENU ---
export const addMenu = async (data) => {
  try {
    await addDoc(collection(db, "menu"), {
      kantin_id: data.kantin_id,
      nama_menu: data.nama_menu,
      deskripsi: data.deskripsi || null,
      kalori: Number(data.kalori) || null,
      protein: Number(data.protein) || null,
      karbohidrat: Number(data.karbohidrat) || null,
      lemak: Number(data.lemak) || null,
      serat: Number(data.serat) || null,
      foto_url: data.foto_url || null,
      harga_satuan: Number(data.harga_satuan) || 0,
      tersedia: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Menu Schema: ", e); }
};

// --- 8. TRANSFORMASI TABEL JADWAL_DISTRIBUSI ---
export const addJadwalDistribusi = async (data) => {
  try {
    await addDoc(collection(db, "jadwal_distribusi"), {
      sppg_id: data.sppg_id,
      sekolah_id: data.sekolah_id,
      kantin_id: data.kantin_id,
      dibuat_oleh: data.dibuat_oleh || null,
      tanggal: data.tanggal,
      sesi: data.sesi || 'siang',
      kuota_porsi: data.kuota_porsi || 0,
      status: data.status || 'draft',
      catatan: data.catatan || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Jadwal Distribusi Schema: ", e); }
};

// --- 9. TRANSFORMASI TABEL DISTRIBUSI_DETAIL ---
export const addDistribusiDetail = async (data) => {
  try {
    await addDoc(collection(db, "distribusi_detail"), {
      jadwal_id: data.jadwal_id,
      menu_id: data.menu_id,
      jumlah_porsi: data.jumlah_porsi || 0,
      harga_at_snapshot: Number(data.harga_at_snapshot) || 0
    });
  } catch (e) { console.error("Error Distribusi Detail Schema: ", e); }
};

// --- 10. TRANSFORMASI TABEL KONSUMSI_SISWA ---
export const addKonsumsiSiswa = async (data) => {
  try {
    await addDoc(collection(db, "konsumsi_siswa"), {
      siswa_id: data.siswa_id,
      jadwal_id: data.jadwal_id,
      menu_id: data.menu_id,
      dicatat_oleh: data.dicatat_oleh || null,
      hadir: data.hadir || false,
      makan: data.makan || false,
      waktu_scan: data.waktu_scan || null,
      catatan: data.catatan || null,
      created_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Konsumsi Siswa Schema: ", e); }
};

// --- 11. TRANSFORMASI TABEL LAPORAN ---
export const addLaporan = async (data) => {
  try {
    await addDoc(collection(db, "laporan"), {
      sppg_id: data.sppg_id,
      sekolah_id: data.sekolah_id,
      dibuat_oleh: data.dibuat_oleh || null,
      disetujui_oleh: data.disetujui_oleh || null,
      periode_mulai: data.periode_mulai,
      periode_selesai: data.periode_selesai,
      total_jadwal: data.total_jadwal || 0,
      total_porsi: data.total_porsi || 0,
      total_siswa: data.total_siswa || 0,
      total_hadir: data.total_hadir || 0,
      total_makan: data.total_makan || 0,
      total_biaya: Number(data.total_biaya) || 0,
      persen_kehadiran: Number(data.persen_kehadiran) || 0,
      persen_konsumsi: Number(data.persen_konsumsi) || 0,
      catatan: data.catatan || null,
      status: data.status || 'draft',
      disetujui_at: data.disetujui_at || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Laporan Schema: ", e); }
};

// --- 12. TRANSFORMASI TABEL NOTIFIKASI ---
export const addNotifikasi = async (data) => {
  try {
    await addDoc(collection(db, "notifikasi"), {
      user_id: data.user_id,
      pengirim_id: data.pengirim_id || null,
      judul: data.judul,
      pesan: data.pesan,
      tipe: data.tipe || 'info',
      referensi_id: data.referensi_id || null,
      referensi_tabel: data.referensi_tabel || null,
      is_read: false,
      created_at: serverTimestamp()
    });
  } catch (e) { console.error("Error Notifikasi Schema: ", e); }
};
