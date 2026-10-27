import api from './api';

export const orderService = {
  /**
   * Create an authoritative pending order
   * @param {{ items: Array<{ product_id: string, qty: number }>, delivery_address: object, coupon_code?: string, idempotency_key?: string, notes?: string }} payload
   */
  async createOrder(payload) {
    const res = await api.post('/orders', payload);
    return res.data;
  },

  /**
   * Fetch authenticated customer's order history
   * @param {{ skip?: number, limit?: number }} params
   */
  async getMyOrders(params = {}) {
    const res = await api.get('/orders/my', { params });
    return res.data;
  },

  /**
   * Fetch a single order belonging to current customer
   * @param {string} orderIdOrNum
   */
  async getMyOrderDetail(orderIdOrNum) {
    const res = await api.get(`/orders/my/${orderIdOrNum}`);
    return res.data;
  },

  /**
   * Cancel an eligible order
   */
  async cancelOrder(orderIdOrNum, reason) {
    const res = await api.post(`/orders/my/${orderIdOrNum}/cancel`, { reason });
    return res.data;
  },

  /**
   * Request return on delivered order
   */
  async requestReturn(orderIdOrNum, payload) {
    const res = await api.post(`/orders/my/${orderIdOrNum}/return`, payload);
    return res.data;
  },
};

export default orderService;
