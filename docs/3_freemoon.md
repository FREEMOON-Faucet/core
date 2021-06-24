## The FREEMOON Token

### **Functions**

---

	rewardWinner(_winner, _lottery)

	burn(_amount)

	mintTimeSlice(_account, _amount, _tokenStart, _tokenEnd)

	burnTimeSlice(_account, _amount, _tokenStart, _tokenEnd)
	
	updateAuth(_airdrop, _faucet)

### **Events**

---

    Winner(beneficiary, lottery)

### **Overview**

---

This doc will outline each function in the FREEMOON token contract.

The FREEMOON Token is an FRC758 standard token on the FUSION blockchain.

#### Functions

---

| **`rewardWinner(_beneficiary, _lottery)`** |
| :--- |
| When an address **`_beneficiary`** wins the FREEMOON category **`_lottery`**, they are rewarded with 1 FREEMOON. |

| **`burn(_amount)`** |
| :--- |
| Burns **`_amount`** FREEMOON from sender's balance. |

| **`mintTimeSlice(_account, _amount, _tokenStart, _tokenEnd)`** |
| :-- |
| Mints a timeslice of **`_amount`** FREEMOON from **`_account`**'s balance, starting from **`_tokenStart`**, and ending at **`_tokenEnd`**. Only the token owner can do this. |

| **`burnTimeSlice(_account, _amount, _tokenStart, _tokenEnd)`** |
| :-- |
| Burns a timeslice of **`_amount`** FREEMOON from **`_account`**'s balance, starting from **`_tokenStart`**, and ending at **`_tokenEnd`**. Only the token owner can do this. |

| **`updateAuth(_airdrop, _faucet)`** |
| :-- |
| Update the addresses permited to mint FREEMOON (**`_airdrop`** and **`_faucet`**). Only possible from governance address. |

#### Events

---

| **`Winner(_beneficiary, _lottery)`** |
| :-- |
| Emits when address **`_beneficiary`** wins the FREEMOON category **`_lottery`** and is rewarded with 1 FREEMOON. |