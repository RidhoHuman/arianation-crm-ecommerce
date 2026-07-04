async function testOrder() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtcTNraG5tdTAwMDA0a3ZhNnBrODV3dDYiLCJlbWFpbCI6ImJ1ZGkxMjNAZ21haWwuY29tIiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzgxMDA4NjcxLCJleHAiOjE3ODEwMTIyNzF9.-txUi75tZofg_ujyFj592GBomu1e03pQXhjqMqebTUc';
    const payload = {
      deliveryAddress: {
        fullName: "Budi",
        addressLine1: "Jalan 1",
        city: "Jakarta",
        state: "Jakarta",
        postalCode: "12345",
        country: "Indonesia"
      },
      items: [
        {
          productId: "cmp884dj60006va18jsopxq67",
          quantity: 1
        }
      ],
      paymentMethod: "BANK_TRANSFER",
      usePoints: false
    };

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Failed:', data);
    } else {
      console.log('✅ Order created:', data);
    }
  } catch (error) {
    console.error('❌ Network/Other Error:', error.message);
  }
}

testOrder();
