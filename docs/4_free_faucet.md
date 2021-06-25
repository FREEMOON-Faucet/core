## The FREE Faucet

### **Functions**

---

    setAssets(_free, _freemoon)
    subscribe(_account)
    timelockToFree()
    enter(_entrant)
    resolveEntry(_account, _lottery, _tx, _block)
    updateParams(_admin, _coordinator, _subscriptionCost, _cooldownTime, _payoutThreshold, _payoutAmount)
    setPause(_pause, _toSet)
    checkIfWin(_lottery, _tx, _block)
    getCategory(_account)
    getPayoutStatus(_account)
    _updateOdds()

### **Events**

---

    Entry(entrant, lottery)
    Win(entrant, lottery, txHash, blockHash)
    Loss(entrant, lottery, txHash, blockHash)

## **Overview**

---

Outline ...

#### Functions

---

| **`setAssets(_free, _freemoon)`** |
| :-- |
| Used to set contract addresses for **`_free`** and **`_freemoon`** tokens. Only callable once, by admin. |

| **`subscribe(_account)`** |
| :-- |
| Subscribes the given address **`_account`**. Cost is in FSN. |

| **`timelockToFree()`** |
| :-- |
| Buy FREE with timelock FSN. The conversion is 1 4-month timelock FSN  =>  50 FREE. |

| **`enter(_entrant)`** |
| :-- |
| Enters the given address **`_entrant`** into the FREEMOON draw. Address must be subscribed to the FREE Faucet. |

| **`resolveEntry(_account, _lottery, _tx, _block)`** |
| :-- |
| Checks if the address **`_account`** has won the FREEMOON category **`_lottery`**, and if so, mints them 1 FREEMOON. |

| **`updateParams(_admin, _coordinator, _subscriptionCost, _cooldownTime, _payoutThreshold, _payoutAmount)`** |
| :-- |
| Update the parameters around which the faucet operates. Only possible from governance vote. |

| **`setPause(_pause, _toSet)`** |
| :-- |
| Pause specific features of the contract in case of an emergency. This can either pause or unpause, depending on **`_pause`**. The functions to pause or unpause are listed in **`_toSet`**. |

| **`checkIfWin(_lottery, _tx, _block)`** |
| :-- |
| Checks if the given transaction hash **`_tx`** and its block hash **`_block`** won the FREEMOON category **`_lottery`**. |

| **`getCategory(_account)`** |
| :-- |
| Gets the category determining the given address **`_account`**'s odds of success. This is determined by their FREE balance. |

| **`getPayoutStatus(_account)`** |
| :-- |
| Checks if the given address **`_account`** has made enough entries (since their last FREE payout) to receive their next FREE payout. |

| **`_updateOdds()`** |
| :-- |
| Every time a FREEMOON token is won, the chances of winning one are globally reduced by 10%. |

#### Events

---

| **`Entry(entrant, lottery)`** |
| :-- |
| Emitted whenever an address enters the FREEMOON draw. |

| **`Win(entrant, lottery, txHash, blockHash)`** |
| :-- |
| Emitted when an entry wins the lottery and the address is awarded a FREEMOON. |

| **`Loss(entrant, lottery, txHash, blockHash)`** |
| :-- |
| Emitted when an entry loses the lottery. |

