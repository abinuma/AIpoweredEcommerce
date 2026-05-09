import express from "express";
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/postgres.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import requestRoute from "./routes/requestRoute.js";
import adminRouter from "./routes/adminRoute.js";
import locationRoute from "./routes/locationRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import searchRouter from "./routes/searchRoute.js";
import descriptionRouter from "./routes/descriptionRoute.js";
import chatbotRouter from "./routes/chatbotRoute.js";
//App Config
const app = express();
const port = process.env.PORT || 4000;
await connectDB();
await connectCloudinary();

//Middlewares
app.use(express.json());
app.use(cors())

//api Endpoints
app.use('/api/user',userRouter)
app.use('/api/admin',adminRouter)
app.use('/api/product',productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/request',requestRoute)
app.use('/api/location',locationRoute)
app.use('/api/review',reviewRouter)
app.use('/api/search', searchRouter)
app.use('/api/description', descriptionRouter)
app.use('/api/chatbot', chatbotRouter)

app.get('/', (req,res)=> {
    res.send('API Working')
})

app.listen(port,()=> console.log('Server started on port : ' + port))

