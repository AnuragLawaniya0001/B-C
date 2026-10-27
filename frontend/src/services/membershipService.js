import api from './api';
import paymentService from './paymentService';

export const membershipService = {
  /**
   * Fetch current public dynamic membership settings
   */
  async getSettings() {
    const res = await api.get('/membership/settings');
    return res.data || res;
  },

  /**
   * Fetch authenticated customer's membership status and validity
   */
  async getStatus() {
    const res = await api.get('/membership/status');
    return res.data || res;
  },

  /**
   * Initiate dynamic membership purchase or renewal
   */
  async purchase(idempotencyKey) {
    const res = await api.post('/membership/purchase', {
      idempotency_key: idempotencyKey,
    });
    return res.data || res;
  },

  /**
   * Cryptographically verify Razorpay payment and activate membership
   */
  async verify(payload) {
    const res = await api.post('/membership/verify', payload);
    return res.data || res;
  },

  /**
   * Record checkout modal cancellation
   */
  async cancel(purchaseId, reason) {
    const res = await api.post('/membership/cancel', {
      purchase_id: purchaseId,
      reason,
    });
    return res.data || res;
  },

  /**
   * Fetch customer membership purchase & renewal history
   */
  async getHistory(skip = 0, limit = 20) {
    const res = await api.get(`/membership/history?skip=${skip}&limit=${limit}`);
    return res.data || res;
  },

  /**
   * Orchestrate full Razorpay Checkout modal for membership purchase
   */
  async openMembershipCheckout({ purchase, user, onSuccess, onError, onDismiss }) {
    await paymentService.loadRazorpayScript();

    if (!window.Razorpay) {
      const err = 'Razorpay Checkout SDK failed to load. Please check your internet connection.';
      if (onError) onError(err);
      return;
    }

    const options = {
      key: purchase.key_id,
      amount: purchase.amount_paise,
      currency: purchase.currency || 'INR',
      name: 'Bigchamp Sports',
      description: purchase.display_name || 'Bigchamp Digital Membership Card',
      order_id: purchase.provider_order_id,
      prefill: {
        name: user?.full_name || user?.name || '',
        email: user?.email || '',
        contact: user?.mobile || '',
      },
      notes: {
        purchase_id: purchase.purchase_id,
        user_id: user?.id || user?._id || '',
        type: 'MEMBERSHIP',
      },
      theme: {
        color: '#1e3a8a', // primary-900
      },
      modal: {
        ondismiss: async () => {
          try {
            await membershipService.cancel(purchase.purchase_id, 'Customer dismissed modal');
          } catch (_) {}
          if (onDismiss) onDismiss();
        },
      },
      handler: async (response) => {
        try {
          const verifyPayload = {
            purchase_id: purchase.purchase_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          const verifyRes = await membershipService.verify(verifyPayload);
          if (onSuccess) onSuccess(verifyRes);
        } catch (err) {
          const msg =
            err.response?.data?.detail ||
            err.message ||
            'Payment verification failed. Please contact support.';
          if (onError) onError(msg);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', async (resp) => {
      const desc = resp.error?.description || 'Payment failed';
      try {
        await membershipService.cancel(purchase.purchase_id, `Payment failed: ${desc}`);
      } catch (_) {}
      if (onError) onError(desc);
    });

    rzp.open();
  },
};

export default membershipService;
