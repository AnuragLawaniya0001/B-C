"""Bigchamp platform business constants.

Business values now come from `settings` collection (key: business_rules).
Use: rules = await settings_service.get_business_rules()
Never hardcode card_fee, cookey_price, etc. here.
"""

# Platform currency
CURRENCY = "INR"
