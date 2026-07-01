export const initializeFirestore = () => ({});
export const getFirestore = () => ({});
export const collection = () => ({});
export const doc = () => ({});
export const getDoc = () => Promise.resolve({ exists: false, data: () => null, id: '' });
export const getDocs = () => Promise.resolve({ docs: [], size: 0, forEach: () => {} });
export const addDoc = () => Promise.resolve({ id: 'mock-id' });
export const setDoc = () => Promise.resolve();
export const updateDoc = () => Promise.resolve();
export const deleteDoc = () => Promise.resolve();
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const onSnapshot = () => () => {};
export const runTransaction = () => Promise.resolve();
export const writeBatch = () => ({ commit: () => Promise.resolve(), set: () => {}, update: () => {}, delete: () => {} });
export const increment = () => ({});
export const serverTimestamp = () => ({});
export const Timestamp = Object.assign(function() {}, {
  now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
  fromMillis: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
  fromDate: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
});
export const FieldValue = { serverTimestamp: () => ({}) };
export const queryEqual = () => true;
export const connectFirestoreEmulator = () => {};
export const Query = function() {};
export const DocumentReference = function() {};
export const QuerySnapshot = function() {};
export const DocumentSnapshot = function() {};
