window.addEventListener('load', async () => {
    // Provjera da li je Metamask dostupan
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        // Zatraži pristup računu korisnika
        await window.ethereum.enable();
        // Dohvati dostupne kriptovalute iz Metamaska
        const accounts = await web3.eth.getAccounts();
        const balance = await web3.eth.getBalance(accounts[0]);
        // Ovdje možete dodati logiku za dohvat dostupnih kriptovaluta na računu
        console.log("Account:", accounts[0]);
        console.log("Balance:", web3.utils.fromWei(balance, 'ether'), "ETH");
        // Postavi dostupne kriptovalute u formu
        const fromCurrencySelect = document.getElementById('fromCurrency');
        const toCurrencySelect = document.getElementById('toCurrency');
        // Ovdje dodajte logiku za dodavanje kriptovaluta u select elemente
        // Primjer:
        const cryptocurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']; // Dodajte sve kriptovalute koje su dostupne na računu
        cryptocurrencies.forEach(currency => {
          const option = document.createElement('option');
          option.value = currency;
          option.textContent = currency;
          fromCurrencySelect.appendChild(option);
          const optionClone = option.cloneNode(true);
          toCurrencySelect.appendChild(optionClone);
        });
      } catch (error) {
        console.error("User denied account access or error:", error);
      }
    } else {
      console.error("Metamask not detected!");
    }
  
    // Dodajte funkcionalnost za razmjenu i povijest trgovanja ovdje
    // ...
  });
  