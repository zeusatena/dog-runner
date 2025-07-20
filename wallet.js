let userAddress = null;

async function checkWalletConnection() {
  // Check if MetaMask is installed
  if (typeof window.ethereum === 'undefined') {
    alert('To play, please install MetaMask!');
    return false;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    // Get current chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });

    // Ensure we are on Genesys network (Chain ID 16507)
    if (parseInt(chainId, 16) !== 16507) {
      try {
        // Attempt to switch network
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

    // Set the connected address
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