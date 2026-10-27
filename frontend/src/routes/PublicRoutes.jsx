import React from 'react';
import { Route } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';
import StorePage from '../pages/public/StorePage';
import ProductDetailPage from '../pages/public/ProductDetailPage';
import CookeyPage from '../pages/public/CookeyPage';
import MembershipPage from '../pages/public/MembershipPage';
import DormitoryPage from '../pages/public/DormitoryPage';
import PhysioPage from '../pages/public/PhysioPage';
import ArmyOfferPage from '../pages/public/ArmyOfferPage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';
import CartPage from '../pages/checkout/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';
import CheckoutSuccessPage from '../pages/checkout/CheckoutSuccessPage';

import TermsPage from '../pages/public/TermsPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import RefundPolicyPage from '../pages/public/RefundPolicyPage';
import ShippingPolicyPage from '../pages/public/ShippingPolicyPage';

export const publicRoutes = [
  { path: '/', element: <HomePage /> },
  { path: '/store', element: <StorePage /> },
  { path: '/store/:slug', element: <ProductDetailPage /> },
  { path: '/store/product/:slug', element: <ProductDetailPage /> },
  { path: '/cookey', element: <CookeyPage /> },
  { path: '/membership', element: <MembershipPage /> },
  { path: '/dormitory', element: <DormitoryPage /> },
  { path: '/physio', element: <PhysioPage /> },
  { path: '/army-offer', element: <ArmyOfferPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/refund-policy', element: <RefundPolicyPage /> },
  { path: '/shipping-policy', element: <ShippingPolicyPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/checkout/success', element: <CheckoutSuccessPage /> },
];
