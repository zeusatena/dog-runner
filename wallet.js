let userAddress = null;

async function checkWalletConnection() {
  if (typeof window.ethereum === 'undefined') {
    alert('To play, you need to install MetaMask!');
    return false;
  }

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await ethereum.request({ method: 'eth_chainId' });

    if (parseInt(chainId, 16) !== 16507) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x407b' }] // 16507 in hex
        });
        return await checkWalletConnection(); // Retry after switch
      } catch (err) {
        alert('Please switch manually to the Genesys network (Chain ID 16507) in MetaMask.');
        return false;
      }
    }

    userAddress = accounts[0];
    const walletDiv = document.getElementById('walletInfo');
    walletDiv.textContent = `Wallet: ${userAddress}`;
    walletDiv.style.display = 'block';
    return true;
  } catch (err) {
    console.error('Wallet connection error:', err);
    return false;
  }
}

async function tryStartGame() {
  const connected = await checkWalletConnection();
  if (connected) startGame(); // defined in game.js
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startButton').addEventListener('click', tryStartGame);
  document.getElementById('retryButton').addEventListener('click', tryStartGame);
});