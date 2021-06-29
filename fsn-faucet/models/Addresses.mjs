import Mongoose from 'mongoose'

const addressSchema = new Mongoose.Schema({
  ipAddress: { type: String, index: true },
  walletAddress: { type: String, index: true },
  lastVisit: {type: Date, index: true}
}, { timestamps: true })

const Address = Mongoose.model('Address', addressSchema, 'Addresses')

export default Address