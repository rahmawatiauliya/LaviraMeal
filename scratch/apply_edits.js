const fs = require('fs');
const path = require('path');

// Helper to replace text in file
function editFile(filePath, target, replacement) {
  const absolutePath = path.resolve(filePath);
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Normalize line endings to LF first for reliable replace
  const normalizedTarget = target.replace(/\r\n/g, '\n').trim();
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  
  if (!normalizedContent.includes(normalizedTarget)) {
    console.error(`ERROR: Target not found in ${filePath}`);
    return false;
  }
  
  const updatedContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  // Restore CRLF line endings on Windows
  fs.writeFileSync(absolutePath, updatedContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`SUCCESS: Updated ${filePath}`);
  return true;
}

// ==========================================
// EDITS FOR RiwayatGuruScreen.js
// ==========================================

const riwayatTargetMap = `        const mapped = response.data.riwayat.map(x => ({
          id: x.id,
          message: x.message || x.category,
          amount: parseFloat(x.nominal),
          type: x.type,
          created_at: x.created_at,
          nama_kantin: x.nama_kantin
        }));`;

const riwayatReplacementMap = `        const mapped = response.data.riwayat.map(x => ({
          id: x.id,
          message: x.message || x.category,
          amount: parseFloat(x.nominal),
          type: x.type,
          created_at: x.created_at,
          nama_kantin: x.nama_kantin,
          kantin_id: x.kantin_id,
          already_reviewed: parseInt(x.already_reviewed || 0)
        }));`;

const riwayatTargetRender = `          <Text style={styles.historyDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</Text>
        </View>
      </TouchableOpacity>`;

const riwayatReplacementRender = `          <Text style={styles.historyDate}>{item.created_at ? new Date(item.created_at.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</Text>
          
          {item.kantin_id && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="storefront-outline" size={14} color="#64748B" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{item.nama_kantin || 'Kantin'}</Text>
              </View>
              {item.already_reviewed === 1 ? (
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold' }}>Sudah Diulas</Text>
                </View>
              ) : (
                (() => {
                  const txDate = item.created_at ? new Date(item.created_at.replace(' ', 'T')) : new Date();
                  const diffTime = Math.abs(new Date() - txDate);
                  const diffDays = diffTime / (1000 * 60 * 60 * 24);
                  if (diffDays <= 2) {
                    return (
                      <TouchableOpacity 
                        style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => navigation.navigate('Feedback', {
                          canteenData: {
                            id: item.kantin_id,
                            name: item.nama_kantin || 'Kantin',
                            transaksi_id: item.id
                          }
                        })}
                      >
                        <Ionicons name="star" size={12} color="#FFFFFF" />
                        <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }}>Beri Ulasan</Text>
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>Batas Ulasan Habis</Text>
                      </View>
                    );
                  }
                })()
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>`;

editFile('src/screen/main/guru/RiwayatGuruScreen.js', riwayatTargetMap, riwayatReplacementMap);
editFile('src/screen/main/guru/RiwayatGuruScreen.js', riwayatTargetRender, riwayatReplacementRender);

// ==========================================
// EDITS FOR HomeScreenGuru.js
// ==========================================

const homeTargetImports = `import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';`;

const homeReplacementImports = `import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';`;

const homeTargetState = `  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);`;

const homeReplacementState = `  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);`;

const homeTargetRender = `          {/* CANTEEN RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Transaksi Makan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RiwayatGuru')}>
              <Text style={styles.viewAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {canteenStats.riwayat.length > 0 ? canteenStats.riwayat.slice(0, 2).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.activityCard}
              onPress={() => {
                setSelectedTransaction(item);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={item.type === 'masuk' ? "arrow-down-circle" : "fast-food-outline"}
                  size={20}
                  color={item.type === 'masuk' ? SUCCESS : BLUE_PRIMARY}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.activityName}>{item.message}</Text>
                <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</Text>
              </View>
              <Text style={[styles.activityAmount, { color: item.type === 'masuk' ? SUCCESS : '#EF4444' }]}>
                {item.type === 'masuk' ? '+' : '-'}{item.amount} PTS
              </Text>
            </TouchableOpacity>
          )) : (`;

const homeReplacementRender = `          {/* MITRA KANTIN SECTION */}
          <View style={{ marginBottom: 25 }}>
            <Text style={styles.sectionTitle}>Mitra Kantin MBG</Text>
            <Text style={styles.sectionSubtitle}>Ketuk kantin untuk melihat ulasan dan rating</Text>
            
            {canteens.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 15, paddingTop: 15, paddingBottom: 5 }}
              >
                {canteens.map((canteen) => (
                  <TouchableOpacity 
                    key={canteen.id} 
                    style={styles.canteenCardItem}
                    onPress={() => navigation.navigate('CanteenFeedback', {
                      kantin_id: canteen.id,
                      nama_kantin: canteen.nama_kantin,
                      foto_kantin: canteen.foto_kantin
                    })}
                  >
                    <Image 
                      source={{ uri: canteen.foto_kantin ? \`\${IMAGE_BASE_URL}\${canteen.foto_kantin}\` : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300' }} 
                      style={styles.canteenItemImg} 
                    />
                    <View style={styles.canteenItemInfo}>
                      <Text style={styles.canteenItemName} numberOfLines={1}>{canteen.nama_kantin}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="person" size={10} color="#94A3B8" />
                        <Text style={styles.canteenItemOwner} numberOfLines={1}>{canteen.pemilik || 'Pemilik'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="call" size={10} color="#94A3B8" />
                        <Text style={styles.canteenItemOwner} numberOfLines={1}>{canteen.no_telp || '-'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCanteens}>
                <Ionicons name="storefront-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyCanteensText}>Tidak ada mitra kantin aktif</Text>
              </View>
            )}
          </View>

          {/* CANTEEN RECENT ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Transaksi Makan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RiwayatGuru')}>
              <Text style={styles.viewAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {canteenStats.riwayat.length > 0 ? canteenStats.riwayat.slice(0, 2).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.activityCard, { flexDirection: 'column', alignItems: 'stretch' }]}
              onPress={() => {
                setSelectedTransaction(item);
                setShowDetailModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={item.type === 'masuk' ? "arrow-down-circle" : "fast-food-outline"}
                    size={20}
                    color={item.type === 'masuk' ? SUCCESS : BLUE_PRIMARY}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityName}>{item.message}</Text>
                  <Text style={styles.activityTime}>{item.created_at ? new Date(item.created_at.replace(' ', 'T')).toLocaleString('id-ID') : '-'}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: item.type === 'masuk' ? SUCCESS : '#EF4444' }]}>
                  {item.type === 'masuk' ? '+' : '-'}{item.amount} PTS
                </Text>
              </View>
              
              {item.kantin_id && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="storefront-outline" size={14} color="#64748B" />
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{item.nama_kantin || 'Kantin'}</Text>
                  </View>
                  {item.already_reviewed === 1 ? (
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold' }}>Sudah Diulas</Text>
                    </View>
                  ) : (
                    (() => {
                      const txDate = item.created_at ? new Date(item.created_at.replace(' ', 'T')) : new Date();
                      const diffTime = Math.abs(new Date() - txDate);
                      const diffDays = diffTime / (1000 * 60 * 60 * 24);
                      if (diffDays <= 2) {
                        return (
                          <TouchableOpacity 
                            style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => navigation.navigate('Feedback', {
                              canteenData: {
                                id: item.kantin_id,
                                name: item.nama_kantin || 'Kantin',
                                transaksi_id: item.id
                              }
                            })}
                          >
                            <Ionicons name="star" size={12} color="#FFFFFF" />
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }}>Beri Ulasan</Text>
                          </TouchableOpacity>
                        );
                      } else {
                        return (
                          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>Batas Ulasan Habis</Text>
                          </View>
                        );
                      }
                    })()
                  )}
                </View>
              )}
            </TouchableOpacity>
          )) : (`;

editFile('src/screen/main/guru/HomeScreenGuru.js', homeTargetImports, homeReplacementImports);
editFile('src/screen/main/guru/HomeScreenGuru.js', homeTargetState, homeReplacementState);
editFile('src/screen/main/guru/HomeScreenGuru.js', homeTargetRender, homeReplacementRender);
