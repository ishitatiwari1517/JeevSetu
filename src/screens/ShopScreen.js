import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

const CATEGORIES = ['All', 'Food', 'Toys', 'Vitamins', 'Accessories'];

const PRODUCTS = [
  { id: '1', name: 'Premium Puppy Kibble', price: 32.99, category: 'Food', emoji: '🍖', tag: 'Best Seller' },
  { id: '2', name: 'Organic Beef Jerky', price: 45.00, category: 'Food', emoji: '🥩', tag: 'New' },
  { id: '3', name: 'Wild Harvest Berry Topper', price: 18.50, category: 'Food', emoji: '🫐' },
  { id: '4', name: 'Calming Lavender Bites', price: 12.00, category: 'Vitamins', emoji: '🌿', tag: 'Popular' },
  { id: '5', name: 'Dental Chew Sticks Pack', price: 9.99, category: 'Vitamins', emoji: '🦷' },
  { id: '6', name: 'Omega-3 Fish Oil Drops', price: 22.50, category: 'Vitamins', emoji: '💊', tag: 'Vet Approved' },
  { id: '7', name: 'Squeaky Plush Duck', price: 14.99, category: 'Toys', emoji: '🦆' },
  { id: '8', name: 'Durable Rope Tug', price: 11.50, category: 'Toys', emoji: '🧶' },
];

const ShopScreen = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [quantities, setQuantities] = useState({}); // { productId: quantity }

  const handleUpdateQuantity = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const cartCount = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = PRODUCTS.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);

  const filteredProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PetVue Shop</Text>
          <Text style={styles.headerSubtitle}>Premium essentials for Bruno</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn}>
          <Icon name="cart-outline" size={26} color={COLORS.brandGreen} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search food, toys, vitamins..." 
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {filteredProducts.map(item => {
            const qty = quantities[item.id] || 0;
            return (
              <View key={item.id} style={styles.productCard}>
                <View style={styles.imageContainer}>
                  {item.tag && (
                    <View style={styles.tagContainer}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                  
                  {/* Quantity Controls */}
                  <View style={styles.controlsRow}>
                    {qty > 0 && (
                      <>
                        <TouchableOpacity 
                          style={styles.controlBtn}
                          onPress={() => handleUpdateQuantity(item.id, -1)}
                        >
                          <Icon name="minus" size={16} color={COLORS.white} />
                        </TouchableOpacity>
                        <View style={styles.qtyBubble}>
                          <Text style={styles.qtyText}>{qty}</Text>
                        </View>
                      </>
                    )}
                    <TouchableOpacity 
                      style={styles.controlBtn}
                      onPress={() => handleUpdateQuantity(item.id, 1)}
                    >
                      <Icon name="plus" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}
        </View>
        
        <View style={{ height: 140 }} />
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCartBar} activeOpacity={0.9}>
          <View style={styles.cartBarContent}>
            <View style={styles.cartBarLeft}>
              <View style={styles.cartIconCircle}>
                <Icon name="shopping" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.cartBarItems}>{cartCount} items</Text>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarTotal}>${totalPrice.toFixed(2)}</Text>
              <Text style={styles.cartBarAction}>Checkout</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.brandGreen },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cartBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  catScroll: { marginBottom: 24 },
  catChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catChipActive: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  catText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  imageContainer: {
    height: CARD_WIDTH - 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tagContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#B45309' },
  emojiText: { fontSize: 50 },
  controlsRow: {
    position: 'absolute',
    bottom: -10,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlBtn: {
    backgroundColor: COLORS.brandGreen,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBubble: {
    paddingHorizontal: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
  productInfo: { padding: 8, paddingTop: 18 },
  productName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, minHeight: 38 },
  productPrice: { fontSize: 15, fontWeight: '800', color: COLORS.brandGreen, marginTop: 4 },
  floatingCartBar: {
    position: 'absolute',
    bottom: 15,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cartBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center' },
  cartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartBarItems: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cartBarRight: { alignItems: 'flex-end' },
  cartBarTotal: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  cartBarAction: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
});

export default ShopScreen;
