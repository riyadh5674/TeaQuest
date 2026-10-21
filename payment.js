/* =========================================================
   TEAQUEST — STRIPE PAYMENT INTEGRATION
   Loaded after java.js, provides real payment processing
   ========================================================= */
"use strict";

(function () {
  // Stripe publishable key (set from environment at build time)
  const STRIPE_PUBLISHABLE_KEY = window.TEAQUEST_STRIPE_KEY || 'pk_test_YOUR_KEY_HERE';

  let stripe = null;
  let elements = null;
  let cardElement = null;

  // =========================================================
  // INITIALIZATION
  // =========================================================
  async function initStripe() {
    if (typeof Stripe === 'undefined') {
      console.warn('[Stripe] Stripe.js not loaded');
      return false;
    }

    try {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      elements = stripe.elements({ appearance: getStripeAppearance() });

      cardElement = elements.create('card', {
        style: getStripeStyle(),
        hidePostalCode: false,
        placeholder: {
          number: '4242 4242 4242 4242',
          expiry: 'MM/YY',
          cvc: '123'
        }
      });

      console.log('[Stripe] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Stripe] Initialization failed:', error);
      return false;
    }
  }

  function getStripeAppearance() {
    return {
      theme: 'stripe',
      variables: {
        colorPrimary: '#75d66b',
        colorBackground: '#0c1411',
        colorText: '#f4f0df',
        colorDanger: '#e66a5e',
        fontFamily: '"VT323", monospace',
        spacingUnit: '4px',
        borderRadius: '4px'
      },
      rules: {
        '.Input': {
          border: '2px solid #344d3e',
          boxShadow: '3px 3px 0 #050907',
          background: '#17251d',
          color: '#f4e6bd'
        },
        '.Input:focus': {
          border: '2px solid #75d66b',
          boxShadow: '0 0 0 2px rgba(117, 214, 107, 0.2)'
        },
        '.Label': {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#a7f29a'
        },
        '.Error': {
          color: '#e66a5e',
          fontFamily: '"VT323", monospace'
        }
      }
    };
  }

  function getStripeStyle() {
    return {
      base: {
        fontFamily: '"VT323", monospace',
        fontSize: '21px',
        color: '#f4f0df',
        backgroundColor: '#17251d',
        '::placeholder': {
          color: '#8fa398'
        }
      },
      invalid: {
        color: '#e66a5e',
        iconColor: '#e66a5e'
      }
    };
  }

  // =========================================================
  // PAYMENT ELEMENT MOUNTING
  // =========================================================
  function mountCardElement(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !cardElement) return false;

    container.innerHTML = '';
    cardElement.mount(container);

    // Handle real-time validation errors
    cardElement.on('change', event => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        displayError.textContent = event.error ? event.error.message : '';
        displayError.classList.toggle('hidden-field', !event.error);
      }

      // Update submit button state
      const submitBtn = document.getElementById('stripe-submit');
      if (submitBtn) {
        submitBtn.disabled = !event.complete;
      }
    });

    return true;
  }

  function unmountCardElement() {
    if (cardElement) {
      cardElement.unmount();
    }
  }

  // =========================================================
  // PAYMENT PROCESSING
  // =========================================================
  async function processPayment(paymentData) {
    if (!stripe || !cardElement) {
      throw new Error('Stripe not initialized');
    }

    const { clientSecret, customerEmail, metadata } = paymentData;

    try {
      // Confirm the card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: customerEmail,
              name: metadata?.customerName,
              phone: metadata?.phone,
              address: {
                line1: metadata?.address,
                city: metadata?.city,
                postal_code: metadata?.postalCode,
                country: metadata?.country || 'US'
              }
            }
          }
        },
        { handleActions: true }
      );

      if (error) {
        // Show error to customer
        const displayError = document.getElementById('card-errors');
        if (displayError) {
          displayError.textContent = error.message;
          displayError.classList.remove('hidden-field');
        }
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          receiptEmail: paymentIntent.receipt_email
        };
      }

      throw new Error('Payment not completed');
    } catch (error) {
      console.error('[Stripe] Payment error:', error);
      throw error;
    }
  }

  // =========================================================
  // CREATE PAYMENT INTENT (calls backend)
  // =========================================================
  async function createPaymentIntent(orderData) {
    try {
      // In production, this calls your backend endpoint
      // For demo, we'll simulate with a Firebase Function call
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': window.CSRF?.get() || ''
        },
        body: JSON.stringify({
          amount: Math.round(orderData.total * 100), // Convert to cents
          currency: 'usd',
          customerEmail: orderData.email,
          metadata: {
            orderId: orderData.orderId || 'temp-' + Date.now(),
            customerName: orderData.name,
            items: JSON.stringify(orderData.items)
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      return await response.json(); // { clientSecret, paymentIntentId }
    } catch (error) {
      console.error('[Stripe] Create payment intent failed:', error);
      // Fallback: use demo mode
      return { clientSecret: 'pi_demo_' + Date.now(), demo: true };
    }
  }

  // =========================================================
  // REFUND HANDLING
  // =========================================================
  async function requestRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': window.CSRF?.get() || ''
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason
        })
      });

      return await response.json();
    } catch (error) {
      console.error('[Stripe] Refund failed:', error);
      throw error;
    }
  }

  // =========================================================
  // WEBHOOK HELPERS (for backend verification)
  // =========================================================
  function verifyWebhookSignature(payload, signature, secret) {
    // This runs on the backend, not in browser
    // Included here for reference
    console.warn('[Stripe] verifyWebhookSignature should run on backend');
    return false;
  }

  // =========================================================
  // CHECKOUT SESSION (for Stripe Checkout redirect)
  // =========================================================
  async function createCheckoutSession(orderData) {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': window.CSRF?.get() || ''
        },
        body: JSON.stringify({
          lineItems: orderData.items.map(item => ({
            priceData: {
              currency: 'usd',
              productData: {
                name: item.name,
                description: item.description,
                images: item.image ? [item.image] : []
              },
              unitAmount: Math.round(item.price * 100)
            },
            quantity: item.quantity
          })),
          customerEmail: orderData.email,
          successUrl: `${window.location.origin}/#profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/#checkout?canceled=true`,
          metadata: {
            orderId: orderData.orderId || 'temp-' + Date.now(),
            customerName: orderData.name
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      return { sessionId, url };
    } catch (error) {
      console.error('[Stripe] Checkout session failed:', error);
      throw error;
    }
  }

  // =========================================================
  // UI INTEGRATION WITH EXISTING CHECKOUT
  // =========================================================
  window.Payment = {
    async init() {
      await initStripe();
      return this;
    },

    async processOrder(orderData) {
      // Validate order data
      if (!orderData.items?.length) {
        throw new Error('Cart is empty');
      }
      if (!orderData.email || !Security.validateEmail(orderData.email)) {
        throw new Error('Valid email required');
      }
      if (!orderData.name?.trim()) {
        throw new Error('Customer name required');
      }
      if (!orderData.address?.trim()) {
        throw new Error('Delivery address required');
      }

      // Check rate limit
      const rateLimit = window.RateLimiter?.api?.('payment');
      if (rateLimit && !rateLimit.allowed) {
        throw new Error(`Too many payment attempts. Try again in ${rateLimit.retryAfter}s`);
      }

      // Show payment modal with Stripe Elements
      return new Promise((resolve, reject) => {
        this.showPaymentModal(orderData, resolve, reject);
      });
    },

    showPaymentModal(orderData, resolve, reject) {
      const modal = document.getElementById('checkoutModal');
      if (!modal) {
        reject(new Error('Checkout modal not found'));
        return;
      }

      // Update order summary
      this.updateOrderSummary(orderData);

      // Mount Stripe card element
      setTimeout(() => {
        if (!mountCardElement('stripe-card-element')) {
          reject(new Error('Failed to mount card element'));
          return;
        }
      }, 100);

      // Handle form submission
      const form = document.getElementById('stripePaymentForm');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          await this.handlePaymentSubmit(orderData, resolve, reject);
        };
      }

      // Show modal
      if (window.openModal) {
        window.openModal(modal);
      } else {
        modal.classList.add('open');
      }
    },

    updateOrderSummary(orderData) {
      const summary = document.getElementById('checkoutSummary');
      if (!summary) return;

      const itemsHtml = orderData.items.map(item => `
        <div class="summary-item">
          <span>${item.name} × ${item.quantity}</span>
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');

      summary.innerHTML = `
        <div class="summary-items">${itemsHtml}</div>
        <div class="summary-total">
          <strong>Total: $${orderData.total.toFixed(2)}</strong>
        </div>
        <div id="stripe-card-element" class="stripe-element-container"></div>
        <div id="card-errors" class="stripe-error hidden-field"></div>
      `;
    },

    async handlePaymentSubmit(orderData, resolve, reject) {
      const submitBtn = document.getElementById('stripe-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }

      try {
        // Create payment intent
        const paymentIntent = await createPaymentIntent(orderData);

        // Process payment
        const result = await processPayment({
          clientSecret: paymentIntent.clientSecret,
          customerEmail: orderData.email,
          metadata: {
            customerName: orderData.name,
            address: orderData.address,
            phone: orderData.phone,
            city: orderData.city,
            postalCode: orderData.postalCode,
            country: orderData.country
          }
        });

        if (result.success) {
          // Complete the order in backend
          await this.completeOrder(orderData, result);

          if (window.toast) {
            window.toast('ORDER CONFIRMED', `Payment successful! Order #${result.paymentIntentId.slice(-8).toUpperCase()}`);
          }

          // Close modal
          const modal = document.getElementById('checkoutModal');
          if (window.closeModal && modal) window.closeModal(modal);

          resolve({
            success: true,
            orderId: result.paymentIntentId,
            ...result
          });
        } else {
          throw new Error('Payment failed');
        }
      } catch (error) {
        if (window.toast) {
          window.toast('PAYMENT FAILED', error.message || 'Please try again');
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Place Order';
        }

        reject(error);
      }
    },

    async completeOrder(orderData, paymentResult) {
      // This would call your backend to finalize the order
      // For now, use the existing order creation flow
      if (window.db && window.currentUser) {
        const { error } = await window.db.rpc('create_order', {
          p_customer: orderData.name,
          p_address: orderData.address,
          p_phone: orderData.phone || '',
          p_payment: 'stripe',
          p_items: orderData.items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity
          }))
        });

        if (error) {
          console.error('[Payment] Order creation failed:', error);
        }
      }
    }
  };

  // =========================================================
  // LOAD STRIPE.JS DYNAMICALLY
  // =========================================================
  function loadStripeJS() {
    return new Promise((resolve, reject) => {
      if (typeof Stripe !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }

  // Auto-initialize when needed
  document.addEventListener('DOMContentLoaded', async () => {
    // Only load Stripe if we're on a page that needs it
    const needsPayment = document.getElementById('checkoutModal') ||
                         document.querySelector('[data-stripe-payment]');

    if (needsPayment) {
      await loadStripeJS();
      await initStripe();
    }
  });

  // Expose for manual initialization
  window.StripePayment = {
    init: initStripe,
    processPayment,
    createPaymentIntent,
    createCheckoutSession,
    requestRefund,
    mountCardElement,
    unmountCardElement
  };
})();