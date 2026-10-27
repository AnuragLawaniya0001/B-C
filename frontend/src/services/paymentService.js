import api from './api';

export const paymentService = {
  /**
   * Dynamically loads Razorpay checkout script if not present
   * @returns {Promise<boolean>}
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Initiate Razorpay test order from backend
   * @param {string} orderId
   * @param {string} [idempotencyKey]
   */
  async createPaymentOrder(orderId, idempotencyKey = null) {
    const res = await api.post('/payments/create-order', {
      order_id: orderId,
      idempotency_key: idempotencyKey,
    });
    return res.data;
  },

  /**
   * Verify Razorpay cryptographic signature & confirm order
   * @param {{ order_id: string, provider_order_id: string, provider_payment_id: string, provider_signature: string }} payload
   */
  async verifyPayment(payload) {
    const res = await api.post('/payments/verify', payload);
    return res.data;
  },

  /**
   * Fetch authenticated customer's payment history
   */
  async getMyPayments(params = {}) {
    const res = await api.get('/payments/my-payments', { params });
    return res.data;
  },

  /**
   * Cancel an active payment attempt
   * @param {{ order_id: string, provider_order_id?: string, reason?: string }} payload
   */
  async cancelPayment(payload) {
    const res = await api.post('/payments/cancel', payload);
    return res.data;
  },

  /**
   * Complete Razorpay checkout flow: loads script, initiates payment order, opens modal, and verifies signature
   * @param {object} params
   * @param {object} params.order - Order object with id/order_number
   * @param {object} [params.user] - Current user info for prefill
   * @param {function} [params.onSuccess] - Callback on verified payment
   * @param {function} [params.onError] - Callback on failure
   * @param {function} [params.onDismiss] - Callback on modal close
   */
  async openRazorpayCheckout({ order, user, onSuccess, onError, onDismiss }) {
    try {
      const scriptReady = await this.loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay checkout script failed to load. Please check your internet connection or ad-blocker.');
      }

      const orderRef = order.id || order.order_number;
      const paymentInit = await this.createPaymentOrder(orderRef);

      if (!paymentInit || !paymentInit.provider_order_id || !paymentInit.key_id) {
        throw new Error('Server returned incomplete payment initialization details.');
      }

      const options = {
        key: paymentInit.key_id,
        amount: paymentInit.amount_paise,
        currency: paymentInit.currency || 'INR',
        name: 'BIGCHAMP Sports Ecosystem',
        description: `Order #${order.order_number} (Test Mode)`,
        order_id: paymentInit.provider_order_id,
        prefill: {
          name: order.delivery_address?.full_name || user?.name || '',
          email: order.customer_email || user?.email || '',
          contact: order.delivery_address?.phone || user?.mobile || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              order_id: orderRef,
              provider_order_id: response.razorpay_order_id,
              provider_payment_id: response.razorpay_payment_id,
              provider_signature: response.razorpay_signature,
            });
            if (onSuccess) {
              onSuccess({ order, payment: verifyRes });
            }
          } catch (vErr) {
            const msg = vErr.response?.data?.detail || 'Cryptographic payment verification failed on server.';
            if (onError) onError(msg);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await paymentService.cancelPayment({
                order_id: order.order_number,
                provider_order_id: paymentInit.provider_order_id,
                reason: 'Customer dismissed payment window',
              });
            } catch (_) {}
            if (onDismiss) onDismiss();
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Payment initiation failed.';
      if (onError) onError(msg);
      return false;
    }
  },
};

export default paymentService;
