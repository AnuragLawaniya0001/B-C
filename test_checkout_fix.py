import requests
import hmac
import hashlib

BASE_API = 'http://localhost:3050/api/v1'
KEY_SECRET = 'gv4f7MHd9cG8tjKnb5gH8aeO'

# 1. Login
s = requests.Session()
login_res = s.post(f'{BASE_API}/auth/login', json={'identifier': 'freeuser@bigchamp.in', 'password': 'User@123'})
assert login_res.status_code == 200, f'Login failed: {login_res.text}'
token = login_res.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# 2. Get product
prods = requests.get(f'{BASE_API}/products').json()
prod = next(p for p in prods if p.get('stock', 0) > 2)
print('[PASS] In-stock product selected:', prod['name'])

# 3. Create order
payload = {
    'items': [{'product_id': prod['_id'], 'qty': 1}],
    'delivery_address': {
        'full_name': 'Dev Tester',
        'phone': '9876543210',
        'street_address': '42 Sports Park',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400001'
    }
}
order_res = s.post(f'{BASE_API}/orders', json=payload, headers=headers)
assert order_res.status_code == 201, f'Order failed: {order_res.text}'
order = order_res.json()
order_num = order['order_number']
print('[PASS] Order created successfully:', order_num, 'status:', order['order_status'])

# 4. Initiate payment order (calls Razorpay Sandbox)
pay_init_res = s.post(f'{BASE_API}/payments/create-order', json={'order_id': order_num}, headers=headers)
assert pay_init_res.status_code == 201, f'Payment init failed: {pay_init_res.text}'
pay_init = pay_init_res.json()
assert pay_init['key_id'] == 'rzp_test_Ts2QVBlOxhwFTu'
assert pay_init['provider_order_id'].startswith('order_')
print('[PASS] Payment initiated with Razorpay Sandbox:', pay_init['provider_order_id'], 'key:', pay_init['key_id'])

# 5. Test invalid signature rejection
bad_sig = 'bad_sig_' + 'a'*56
verify_bad = s.post(f'{BASE_API}/payments/verify', json={
    'order_id': order_num,
    'provider_order_id': pay_init['provider_order_id'],
    'provider_payment_id': 'pay_fake_123',
    'provider_signature': bad_sig
}, headers=headers)
assert verify_bad.status_code == 400
print('[PASS] Invalid signature rejected with HTTP 400')

# 6. Test valid signature verification
mock_pay_id = 'pay_test_real_' + order_num[-6:]
msg_str = pay_init['provider_order_id'] + '|' + mock_pay_id
valid_msg = msg_str.encode('utf-8')
valid_sig = hmac.new(KEY_SECRET.encode('utf-8'), valid_msg, hashlib.sha256).hexdigest()

verify_good = s.post(f'{BASE_API}/payments/verify', json={
    'order_id': order_num,
    'provider_order_id': pay_init['provider_order_id'],
    'provider_payment_id': mock_pay_id,
    'provider_signature': valid_sig
}, headers=headers)
assert verify_good.status_code == 200, f'Verify failed: {verify_good.text}'
verify_data = verify_good.json()
assert verify_data['order_status'] == 'CONFIRMED'
assert verify_data['payment_status'] == 'PAID'
print('[PASS] Valid signature verified: Order CONFIRMED and payment PAID')

# 7. Check order detail from API
my_order = s.get(f'{BASE_API}/orders/my/{order_num}', headers=headers).json()
assert my_order['order_status'] == 'CONFIRMED'
assert my_order['payment_status'] == 'PAID'
print('[PASS] Order retrieved from MongoDB reflects PAID and CONFIRMED')

# 8. Test product image serving
img_res = requests.get('http://localhost:3000/uploads/products/prod_4ba0bc9216bc.jpg')
assert img_res.status_code == 200 and len(img_res.content) > 1000
print('[PASS] Product image served with HTTP 200 from frontend port 3000')

print('\nALL CHECKOUT & PAYMENT INTEGRATION ASSERTIONS VERIFIED CLEANLY!')
