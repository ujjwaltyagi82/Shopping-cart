const cartModel = require('../Model/cartModel')
const userModel = require('../Model/userModel')
const productModel = require('../Model/productModel')
const { checkBody } = require('../validation/validation')


const createCart = async function (req, res) {
    const userId = req.params.userId
    const data = req.body

    if (!userId)
        return res.status(400).send({ status: false, message: 'userId is required' })

    if (!(userId.match(/^[0-9a-fA-F]{24}$/)))
        return res.status(400).send({ status: false, message: "Invalid userId given" })

    const checkUser = await userModel.findOne({ _id: userId })
    if (!checkUser)
        return res.status(400).send({ status: false, message: "user not found" })

    if (!checkBody(data))
        return res.status(400).send({ status: false, message: "Enter data to create cart" })

    let { productId, cartId, quantity } = data
    quantity = 1
    data.quantity = quantity

    if (!(productId.match(/^[0-9a-fA-F]{24}$/)))
        return res.status(400).send({ status: false, message: "Invalid productId given" })

    const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!checkProduct)
        return res.status(400).send({ status: false, message: "product not found" })
    
        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId })
            
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" })
        }

    const checkCart = await cartModel.findOne({ userId: userId })

    if (!checkCart && findCart) {
        return res.status(403).send({ status: false, message:'Cart does not belong to the user'})
    }

    if (checkCart) {
        if (cartId) {
            if (checkCart._id.toString() != cartId)
                return res.status(403).send({ status: false, message:"Cart does not belong to you " })
        }
    //for existing product
        let qty = checkCart.items
        let uptotal = (checkCart.totalPrice + (checkProduct.price * Number(quantity))).toFixed(2)
        for (let i = 0; i < qty.length; i++) {
            let prod_itemId = qty[i].productId.toString()
            if (checkProduct._id.toString() == prod_itemId) {
                let oldQty = qty[i].quantity
                let newqty = oldQty + quantity
                qty[i].quantity = newqty
                checkCart.totalPrice = uptotal
                await checkCart.save();
                // let existProd = await cartModel.findOneAndUpdate({_id:cartId},checkCart,{new:true})
            
                return res.status(201).send({ status: true, message: "Exist product update successfully", data: checkCart })
                }
        }
        //for new product in existing cart
        checkCart.items.push({ productId: productId, quantity: Number(quantity) })
        let total = (checkCart.totalPrice + (checkProduct.price * Number(quantity))).toFixed(2)
        checkCart.totalPrice = total
        let count = checkCart.totalItems
        checkCart.totalItems = count + 1
        await checkCart.save()
        return res.status(201).send({ status: true, message: 'Success', data: checkCart })
    }
    //for new cart 
    let objCart = { userId: userId, items: [{ productId: productId, quantity: quantity }], totalPrice: (checkProduct.price * quantity)}
    objCart['totalItems'] = objCart.items.length

    let newCart = await cartModel.create(objCart)
    return res.status(201).send({ status: true, message: "cart created successfully", data: newCart })
}

// ==================getByUserId==============

const getByUserId= async function (req,res){
    const userId=req.params.userId
    let user=await userModel.findOne({_id:userId})
    if(!user){
        return res.status(400).send({status:false , message:"please use userId"})
    }
    let cart=await cartModel.findOne({userId:userId}).populate({path:'items.productId',select:{title:1,price:1,availableSizes:1}})
    if(!cart){
        return res.status(400).send({status:false , message:"dont find any product in cart"})
    }
    return res.status(200).send({status:true , message:"cart find", data:cart})

}

// ===============deletecart======

const cartDelete= async function (req,res){
    const userId=req.params.userId

    let user=await userModel.findOne({_id:userId})
    if(!user){
        return res.status(400).send({status:false , message:"please use userId"})
    }
    let cart=await cartModel.findOne({userId:userId})
    if(!cart){
        return res.status(400).send({status:false , message:"dont find any product in cart"})
    }

    let deleteCart=await cartModel.findOneAndUpdate({userId:userId},{totalItems:0,totalPrice:0,items:[]},{new:true})
    return res.status(200).send({status:true , message:"cart deleted", data:deleteCart})

}


module.exports = { createCart,getByUserId,cartDelete }