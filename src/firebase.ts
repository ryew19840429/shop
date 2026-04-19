import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, getDoc, onSnapshot, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { StoreConfig, Order } from './types/store';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

const SHOP_ID = 'main-shop'; // For this demo, we use a single shop ID

export const storeService = {
  async getShopConfig(shopId: string = 'main-shop'): Promise<StoreConfig | null> {
    try {
      const docRef = doc(db, 'shops', shopId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as StoreConfig;
      }
      return null;
    } catch (error) {
      console.error("Error fetching shop config:", error);
      return null;
    }
  },

  async getAllShops(): Promise<StoreConfig[]> {
    try {
      const shopsRef = collection(db, 'shops');
      const q = query(shopsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as StoreConfig);
    } catch (error) {
      console.error("Error fetching all shops:", error);
      return [];
    }
  },

  async saveShopConfig(config: StoreConfig): Promise<void> {
    try {
      const docRef = doc(db, 'shops', config.id);
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving shop config:", error);
      throw error;
    }
  },

  subscribeToShopConfig(shopId: string, callback: (config: StoreConfig) => void) {
    const docRef = doc(db, 'shops', shopId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as StoreConfig);
      }
    });
  },

  async recordOrder(shopId: string, order: Omit<Order, 'id' | 'createdAt' | 'shopId'>): Promise<void> {
    try {
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, {
        ...order,
        shopId: shopId,
        createdAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      });
    } catch (error) {
      console.error("Error recording order:", error);
      throw error;
    }
  },

  async getOrders(shopId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('shopId', '==', shopId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  async deleteShopConfig(shopId: string): Promise<void> {
    try {
      const docRef = doc(db, 'shops', shopId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting shop config:", error);
      throw error;
    }
  }
};

// Initial connection test as per guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
