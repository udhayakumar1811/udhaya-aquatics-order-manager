export function validateOrderForm(formData, items) {
  const errors = {};

  if (!formData.customerName?.trim()) errors.customerName = 'Customer name is required.';

  if (!/^[6-9]\d{9}$/.test(formData.mobileNumber?.trim() || '')) {
    errors.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (formData.whatsappNumber?.trim() && !/^[6-9]\d{9}$/.test(formData.whatsappNumber.trim())) {
    errors.whatsappNumber = 'Enter a valid 10-digit mobile number, or leave blank.';
  }

  if (!formData.fullAddress?.trim()) errors.fullAddress = 'Full address is required.';
  if (!formData.city?.trim()) errors.city = 'City is required.';
  if (!formData.state?.trim()) errors.state = 'State is required.';

  if (!/^\d{6}$/.test(formData.pincode?.trim() || '')) {
    errors.pincode = 'Enter a valid 6-digit PIN code.';
  }

  const itemErrors = items.map((item) => {
    const e = {};
    if (!item.varietyName?.trim()) e.varietyName = 'Required';
    if (Number(item.qty) < 1) e.qty = 'Must be at least 1';
    if (Number(item.sellingPrice) <= 0) e.sellingPrice = 'Must be greater than 0';
    if (Number(item.costPrice) < 0) e.costPrice = 'Cannot be negative';
    return e;
  });
  if (itemErrors.some((e) => Object.keys(e).length > 0)) {
    errors.items = itemErrors;
  }

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
