let userAddress = null;

async function checkWalletConnection() {
  if (typeof window.ethereum === 'undefined') {
    alert('To play, please install MetaMask!');
    return false;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (parseInt(chainId, 16) !== 16507) {
      try {
        await window.ethereum.request({
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
    if (walletDiv) {
      walletDiv.textContent = `Wallet: ${userAddress}`;
      walletDiv.style.display = 'block';
    }

    return true;
  } catch {
    alert('Unable to connect to wallet. Please try again.');
    return false;
  }
}

function getUserAddress() {
  return userAddress;
}

export { checkWalletConnection, getUserAddress };