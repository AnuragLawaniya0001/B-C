import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCartStore } from '../../store/cartStore';

export default function CartPage() {
  const { items, getCount } = useCartStore();

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
      <p className="text-slate-600 mb-8">Review items, applied member discounts, and delivery charges.</p>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added any gear or Cookey products yet."
          action={
            <Link to="/store">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          }
        />
      ) : (
        <Card className="p-6">
          <p className="text-sm">You have {getCount()} items in your cart.</p>
          <div className="mt-4">
            <Link to="/checkout">
              <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
