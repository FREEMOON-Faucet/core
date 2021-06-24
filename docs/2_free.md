## The FREE Token

### **Functions**

---

	mint(_account, _amount)

	burn(_amount)

	mintTimeSlice(_account, _amount, _tokenStart, _tokenEnd)

	burnTimeSlice(_account, _amount, _tokenStart, _tokenEnd)
	
	updateAuth(_airdrop, _faucet)

### **Overview**

---

This doc will outline each function in the FREE token contract.

The FREE Token is an FRC758 standard token on the FUSION blockchain.

#### Functions

---

| `mint(_account, _amount)` |
| :--- |
| Mints *`_amount`* FREE to given address *`_account`*. Only faucet contract and airdrop contract can do this. |


| `burn(_amount)` |
| :--- |
| Burns *`_amount`* FREE from sender's balance. |

| `mintTimeSlice(_account, _amount, _tokenStart, _tokenEnd)` |
| :-- |
| Mints a timeslice of *`_amount`* FREE from *`_account`*'s balance, starting from *`_tokenStart`*, and ending at *`_tokenEnd`*. Only the token owner can do this. |

| `burnTimeSlice(_account, _amount, _tokenStart, _tokenEnd)` |
| :-- |
| Burns a timeslice of *`_amount`* FREE from *`_account`*'s balance, starting from *`_tokenStart`*, and ending at *`_tokenEnd`*. Only the token owner can do this. |

| `updateAuth(_airdrop, _faucet)` |
| :-- |
| Update the addresses permited to mint FREE (*`_airdrop`* and *`_faucet`*). Only possible from governance address. |
