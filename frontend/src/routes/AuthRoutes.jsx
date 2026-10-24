import React from 'react';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import PasswordPage from '../pages/auth/PasswordPage';
import KycPage from '../pages/auth/KycPage';
import MembershipPayPage from '../pages/auth/MembershipPayPage';
import RegisterSuccessPage from '../pages/auth/RegisterSuccessPage';

export const authRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/register/verify-otp', element: <VerifyOtpPage /> },
  { path: '/register/password', element: <PasswordPage /> },
  { path: '/register/kyc', element: <KycPage /> },
  { path: '/register/membership-pay', element: <MembershipPayPage /> },
  { path: '/register/success', element: <RegisterSuccessPage /> },
];
