self.onmessage = function(eveniment) {
    const produsPrimit = eveniment.data;
    console.log("[Worker]: Am primit un produs nou de adăugat!", produsPrimit);
    self.postMessage(produsPrimit);
};