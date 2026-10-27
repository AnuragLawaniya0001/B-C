import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless=new')
opts.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
driver = webdriver.Chrome(options=opts)

try:
    driver.get('http://localhost:3000/store')
    time.sleep(3)
    btns = driver.find_elements(By.CSS_SELECTOR, 'button[title="Add to cart"]')
    print('Buttons found:', len(btns))
    if btns:
        driver.execute_script('arguments[0].click();', btns[0])
        time.sleep(2)
        val = driver.execute_script('return localStorage.getItem("bigchamp_cart");')
        print('Storage after click:', val)

    # Now navigate to /cart
    print('Navigating to /cart...')
    driver.get('http://localhost:3000/cart')
    time.sleep(3)
    print('URL on cart:', driver.current_url)
    cart_text = driver.find_element(By.TAG_NAME, 'body').text
    print('Cart body text snippet:', cart_text[:400].encode('ascii', 'ignore').decode('ascii'))
    chk_btns = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/checkout"]')
    print('Checkout links found on /cart:', len(chk_btns))
finally:
    driver.quit()
