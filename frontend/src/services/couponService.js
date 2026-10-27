import api from './api';

export const couponService = {
  /**
   * Validate a coupon against customer cart items and subtotal
   * @param {{ code: string, items: Array<{ product_id?: string, category?: string, price_paise: number, qty: number }>, subtotal_paise?: number }} payload
   */
  async validateCoupon(payload) {
    const res = await api.post('/coupons/validate', payload);
    return res.data;
  },

  /**
   * Fetch active public coupons for customer display
   */
  async getActiveCoupons() {
    const res = await api.get('/coupons?status_filter=ACTIVE');
    return res.data;
  },
};

export default couponService;
