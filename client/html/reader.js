document.addEventListener('DOMContentLoaded', async () => {
  // Get Reader ID and get its state
  const urlParams = new URLSearchParams(window.location.search);
  const readerId = urlParams.get('reader_id');
  const { reader, readerError } = await retrieveReader(readerId);
  if (readerError) {
    window.location.replace('/');
    return; 
  }

  // Add Reader value to DOM
  const readerSelect = document.getElementById('readers'); 
  const readerOption = document.createElement('option');
  readerOption.value = reader.id; 
  readerOption.text = `${reader.label} (${reader.id})`; 
  readerSelect.append(readerOption);

  // Get Payment Intent ID info
  const paymentIntentId = reader.action.process_payment_intent.payment_intent
  const { paymentIntent, paymentError } = await retrievePaymentIntent(paymentIntentId);

  // Add payment amount to DOM
  const amountInput = document.getElementById('amount'); 
  amountInput.value = paymentIntent.amount

  const { simulatePaymentError } = await simulatePayment(readerId); 
  if (simulatePaymentError) {
    handleError(simulatePaymentError);
    return;
  }
  
  // Event listener for capture button 
  const captureButton = document.getElementById('capture-button');
  captureButton.addEventListener('click', async (e) => {
    e.preventDefault(); 
    captureButton.disabled = true;
    
    const { captureError } = await capturePaymentIntent(paymentIntentId);
    if (captureError) {
      handleError(captureError);
      captureButton.disabled = false;
      return;
    }
    window.location.replace(`/success.html?payment_intent_id=${paymentIntentId}`);
  });

  // Event listener for cancel button 
  const cancelButton = document.getElementById('cancel-button');
  console.log('cancelButton', cancelButton)
  cancelButton.addEventListener('click', async (e) => {
    e.preventDefault(); 
    cancelButton.disabled = true;

    const { cancelActionError } = await cancelAction(readerId)
    if (cancelActionError) {
      handleError(cancelActionError);
      cancelButton.disabled = false; 
      return;
    }
    window.location.replace('/canceled.html');
  });

});

async function simulatePayment(readerId) {
  const res = await fetch("/simulate-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reader_id: readerId }),
  });
  const { reader_state: reader, error: simulatePaymentError } = await res.json();
  return { reader, simulatePaymentError }; 
}

async function retrieveReader(readerId) {
  const res = await fetch(`/retrieve-reader?reader_id=${readerId}`);
  const { reader_state: reader, error: readerError } = await res.json();
  return { reader, readerError }; 
}

async function cancelAction(readerId) {
  const res = await fetch("/cancel-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reader_id: readerId }),
  });
  const { reader_state: canceledReader, error: cancelActionError } = await res.json();
  return { canceledReader, cancelActionError }; 
}