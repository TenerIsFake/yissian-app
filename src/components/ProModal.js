import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { purchasePro, restorePurchases, getProPackage } from '../engine/iap';
import { usePro } from '../hooks/usePro';

const FALLBACK_PRICE = '$1.99';

export default function ProModal({ visible, onClose }) {
  const isPro = usePro();
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(FALLBACK_PRICE);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    getProPackage()
      .then(pkg => {
        const priceString = pkg?.product?.priceString;
        if (mounted && priceString) setPrice(priceString);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [visible]);

  const handlePurchase = async () => {
    setBusy(true);
    try {
      const hasPro = await purchasePro();
      if (hasPro) {
        Alert.alert('Thank you!', "You're Pro now — ads are gone for good.");
        onClose();
      }
    } catch (err) {
      if (!err?.userCancelled) {
        Alert.alert('Purchase failed', err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const hasPro = await restorePurchases();
      if (hasPro) {
        Alert.alert('Restored', 'Your Pro purchase has been restored — ads are gone.');
        onClose();
      } else {
        Alert.alert('Nothing to restore', 'No previous Pro purchase was found for this account.');
      }
    } catch (err) {
      Alert.alert('Restore failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>✨ Yissian Pro</Text>
          {isPro ? (
            <Text style={styles.body}>You're already Pro — enjoy the ad-free experience!</Text>
          ) : (
            <Text style={styles.body}>
              One-time purchase. Removes all banner ads, forever.
            </Text>
          )}

          {busy && <ActivityIndicator color="#a78bfa" style={styles.spinner} />}

          {!isPro && (
            <TouchableOpacity
              style={[styles.buyBtn, busy && styles.btnDisabled]}
              onPress={handlePurchase}
              disabled={busy}
            >
              <Text style={styles.buyText}>Remove ads — {price}</Text>
            </TouchableOpacity>
          )}

          {!isPro && (
            <TouchableOpacity
              style={[styles.restoreBtn, busy && styles.btnDisabled]}
              onPress={handleRestore}
              disabled={busy}
            >
              <Text style={styles.restoreText}>Restore purchases</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={busy}>
            <Text style={styles.closeText}>{isPro ? 'Close' : 'Not now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  card: {
    width: '100%', backgroundColor: '#1a1a2e', borderRadius: 14,
    borderWidth: 1, borderColor: '#3d2d64', padding: 22,
  },
  title: { color: '#e2e8f0', fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  body: { color: '#94a3b8', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 18 },
  spinner: { marginBottom: 12 },
  buyBtn: {
    backgroundColor: '#5b21b6', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginBottom: 10,
  },
  buyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  restoreBtn: {
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
    borderWidth: 1, borderColor: '#2d2d44', marginBottom: 6,
  },
  restoreText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  closeBtn: { paddingVertical: 9, alignItems: 'center' },
  closeText: { color: '#4b5563', fontSize: 13 },
});
