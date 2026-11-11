import api from './api';

export interface PayPalOrderResponse {
  paypal_order_id: string;
  status: string;
  mode?: 'live_sandbox' | 'mock_sandbox';
  approve_url?: string | null;
  details: Record<string, any>;
}

export interface PayPalCaptureResponse {
  paypal_order_id: string;
  capture_id: string;
  status: string;
}

export interface PayPalStatusResponse {
  mode: 'live_sandbox' | 'mock_sandbox';
  sandbox_configured: boolean;
}

export const paypalService = {
  async getStatus(): Promise<PayPalStatusResponse> {
    const res = await api.get('/paypal/status');
    return res.data;
  },

  async createOrder(transaction_id: string, return_url?: string, cancel_url?: string): Promise<PayPalOrderResponse> {
    const res = await api.post('/paypal/create-order', {
      transaction_id,
      return_url,
      cancel_url,
    });
    return res.data;
  },

  async captureOrder(paypal_order_id: string): Promise<PayPalCaptureResponse> {
    const res = await api.post('/paypal/capture-order', {
      paypal_order_id,
    });
    return res.data;
  },
};
