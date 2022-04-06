document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch("/list-readers"); 
  const { readers } = await res.json();
  const readerSelect = document.getElementById('reader-select'); 
  
  readers.forEach(el => {
    const readerOption = document.createElement('option');
    readerOption.value = el.id; 
    readerOption.text = `${el.label} (${el.id})`; 
    readerSelect.append(readerOption);
  });

  const form = document.getElementById('confirm-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    form.querySelector('button').disabled = true;

    const amountInput = document.querySelector('#amount').value;
    const readerOption = document.querySelector("#reader-select").value;
    
    const { paymentIntentId, paymentError } = await createPaymentIntent(amountInput);
    if (paymentError) {
      handleError(paymentError);
      form.querySelector('button').disabled = false;
      return; 
    }
    const { processError } = await processPayment(readerOption, paymentIntentId);
    if (processError) {
      handleError(processError);
      form.querySelector('button').disabled = false;
      return; 
    }
    window.location.replace(`/reader.html?reader_id=${readerOption}`);
  });
});

async function processPayment(readerId, paymentIntentId) {
  const res = await fetch("/process-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reader_id: readerId,
      payment_intent_id: paymentIntentId,
    }),
  });
  const { error: processError, reader_state: readerState } = await res.json();
  return { processError, readerState }; 
}