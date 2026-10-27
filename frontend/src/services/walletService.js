import api from './api';

export const walletService = {
  /**
   * Fetch authenticated customer's wallet balance and summary
   */
  async getMyWallet() {
    const res = await api.get('/wallet/me');
    return res.data;
  },

  /**
   * Fetch paginated transaction history
   * @param {{ skip?: number, limit?: number }} params
   */
  async getMyTransactions(params = {}) {
    const res = await api.get('/wallet/me/transactions', { params });
    return res.data;
  },

  /**
   * Fetch single transaction detail
   * @param {string} transactionIdOrNum
   */
  async getMyTransactionDetail(transactionIdOrNum) {
    const res = await api.get(`/wallet/me/transactions/${transactionIdOrNum}`);
    return res.data;
  },
};

export default walletService;
