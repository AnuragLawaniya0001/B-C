import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--window-size=1280,900')

driver = webdriver.Chrome(options=chrome_options)
try:
    print('1. Navigating to login page...')
    driver.get('http://localhost:3000/login')
    time.sleep(2)

    # Fill login form
    inputs = driver.find_elements(By.TAG_NAME, 'input')
    assert len(inputs) >= 2, 'Login inputs not found'
    id_input = inputs[0]
    id_input.clear()
    id_input.send_keys('freeuser@bigchamp.in')

    pwd_input = inputs[1]
    pwd_input.clear()
    pwd_input.send_keys('User@123')

    submit_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
    submit_btn.click()
    print('Login submitted, waiting for redirect...')
    time.sleep(3)
    print('Current URL after login:', driver.current_url)

    # 2. Add product to cart via Store UI
    print('2. Navigating to http://localhost:3000/store...')
    driver.get('http://localhost:3000/store')
    time.sleep(3)

    # Click Add to Cart on the first available in-stock product
    add_buttons = driver.find_elements(By.CSS_SELECTOR, 'button[title="Add to cart"]')
    if not add_buttons:
        add_buttons = driver.find_elements(By.CSS_SELECTOR, 'button:has(svg.lucide-shopping-cart)')
    print(f'Found {len(add_buttons)} Add to Cart buttons on store page.')
    assert len(add_buttons) > 0, 'No products found on store page'
    driver.execute_script('arguments[0].click();', add_buttons[0])
    print('Clicked Add to Cart button on store page!')
    time.sleep(2)

    # 3. Navigate to Cart
    print('3. Navigating to http://localhost:3000/cart...')
    driver.get('http://localhost:3000/cart')
    time.sleep(3)

    # 4. Click Proceed to Checkout on Cart page
    print('4. Clicking Proceed to Checkout...')
    checkout_links = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/checkout"]')
    assert len(checkout_links) > 0, 'Proceed to Checkout button not found on cart page'
    driver.execute_script('arguments[0].click();', checkout_links[0])
    time.sleep(3)

    # Verify stale Phase 3A text is GONE
    page_text = driver.find_element(By.TAG_NAME, 'body').text
    print('Page content length:', len(page_text))
    if 'Your Cart is Empty' in page_text:
        print('Cart is empty on checkout page! Dumping body text (sanitized):')
        print(page_text[:300].encode('ascii', 'ignore').decode('ascii'))
    assert 'scheduled for Phase 3' not in page_text, 'FAIL: Stale Phase 3A text still present!'
    print('[PASS] Stale Phase 3A notice is completely removed.')

    assert 'Razorpay Sandbox Active (Test Mode)' in page_text, 'FAIL: Razorpay Test Mode notice missing!'
    print('[PASS] Razorpay Sandbox Active (Test Mode) notice is visible.')

    # Fill in address fields
    driver.execute_script('''
        const inputs = Array.from(document.querySelectorAll('input'));
        for (let inp of inputs) {
            const p = (inp.placeholder || '').toLowerCase();
            if (p.includes('rahul') || p.includes('name')) inp.value = 'Dev Tester';
            else if (p.includes('98765') || p.includes('phone') || p.includes('mobile')) inp.value = '9876543210';
            else if (p.includes('flat') || p.includes('street') || p.includes('address')) inp.value = '42 Sports Park';
            else if (p.includes('city') || p.includes('pune') || p.includes('mumbai')) inp.value = 'Mumbai';
            else if (p.includes('maharashtra') || p.includes('state')) inp.value = 'Maharashtra';
            else if (p.includes('pin') || p.includes('411001') || p.includes('code')) inp.value = '400001';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
    ''')
    time.sleep(1)

    # Click Confirm & Pay button
    confirm_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
    print('3. Clicking Confirm & Pay with Razorpay button:', confirm_btn.text)
    confirm_btn.click()

    # Wait up to 15 seconds for Razorpay modal iframe to appear
    print('4. Waiting for Razorpay iframe modal to open...')
    modal_opened = False
    for i in range(30):
        time.sleep(0.5)
        # Check if iframe.razorpay-checkout-frame exists
        frames = driver.find_elements(By.CSS_SELECTOR, 'iframe.razorpay-checkout-frame, iframe[src*="razorpay"]')
        if len(frames) > 0:
            modal_opened = True
            print(f'[PASS] Real Razorpay Checkout modal OPENED in browser! Found {len(frames)} iframe(s).')
            src = frames[0].get_attribute('src') or ''
            print('   Iframe src:', src[:90] + '...')
            break

    driver.save_screenshot('razorpay_checkout_modal.png')
    print('Screenshot saved to razorpay_checkout_modal.png')

    if not modal_opened:
        print('Checking page body text for messages:')
        print(driver.find_element(By.TAG_NAME, 'body').text[:400].encode('ascii', 'ignore').decode('ascii'))

    assert modal_opened, 'FAIL: Razorpay modal did not open in browser'
    print('\n[SUCCESS] Browser E2E Checkout & Razorpay Modal Verified!')
finally:
    driver.quit()
